<?php

namespace App\Services;

use App\Models\Booking;
use App\Services\Contracts\BookingServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Schema;
use App\Models\CalendarBlock;
use App\Models\PublicEvent;

class BookingService implements BookingServiceInterface
{
    protected function bookingSelectColumns(): array
    {
        static $columns = null;
        if ($columns !== null) {
            return $columns;
        }

        if (!Schema::hasColumn('bookings', 'survey_proof_image')) {
            $columns = ['bookings.*'];
            return $columns;
        }

        $all = Schema::getColumnListing('bookings');

        $exclude = ['survey_proof_image'];

        $columns = array_map(
            fn (string $col) => 'bookings.' . $col,
            array_values(array_diff($all, $exclude))
        );

        return $columns;
    }

    /**
     * Base query with client scoping.
     *
     * ✅ Client sees their bookings by:
     * - client_email == user email OR
     * - created_by_user_id == user id (prevents losing access if they edit booking email)
     */
    protected function baseBookingQuery(): Builder
    {
        $query = Booking::query()->select($this->bookingSelectColumns());

        if (auth()->check() && auth()->user()->hasRole('user')) {
            $user = auth()->user();
            $email = (string) ($user->email ?? '');
            $userId = (int) ($user->id ?? 0);

            $hasCreatorCol = Schema::hasColumn('bookings', 'created_by_user_id');

            $query->where(function ($q) use ($email, $userId, $hasCreatorCol) {
                $q->where('client_email', $email);

                if ($hasCreatorCol && $userId > 0) {
                    $q->orWhere('created_by_user_id', $userId);
                }
            });
        }

        return $query;
    }

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
{
    $this->syncLifecycleStatuses();

    $base = $this->baseBookingQuery()->with(['service', 'createdBy']);


        if (Schema::hasTable('booking_views')) {
            $base->with(['views']);
        }

        $query = $this->applyFilters($base, $filters);
        $query = $this->applySort($query, $filters);

        return $query->paginate($perPage)->withQueryString();
    }

    protected function applySort(Builder $query, array $filters): Builder
    {
        $sort = strtolower((string)($filters['sort'] ?? ''));

        if ($sort === '') {
            $user = auth()->user();
            $sort = ($user && method_exists($user, 'hasRole') && $user->hasRole('user'))
                ? 'newest'
                : 'upcoming';
        }

        $now = Carbon::now();

        $bucketSql = "
            CASE
                WHEN bookings.booking_date_from <= ? AND bookings.booking_date_to > ? THEN 0
                WHEN bookings.booking_date_from > ? THEN 1
                ELSE 2
            END
        ";

        $applyUnviewedFirst = function () use ($query) {
            $userId = auth()->id();
            if (!$userId) return;

            if (!Schema::hasTable('booking_views')) return;

            $query->leftJoin('booking_views as bv', function ($join) use ($userId) {
                $join->on('bv.booking_id', '=', 'bookings.id')
                    ->where('bv.user_id', '=', $userId);
            });

            $query->select($this->bookingSelectColumns());

            $trackingStartedAt = auth()->user()->bookings_view_tracking_started_at ?? null;
            if ($trackingStartedAt) {
                $query->orderByRaw(
                    "CASE WHEN bv.id IS NULL AND bookings.created_at >= ? THEN 0 ELSE 1 END ASC",
                    [$trackingStartedAt]
                );
            } else {
                $query->orderByRaw("CASE WHEN bv.id IS NULL THEN 0 ELSE 1 END ASC");
            }
        };

        switch ($sort) {
            case 'newest':
                return $query
                    ->orderByDesc('bookings.created_at')
                    ->orderByDesc('bookings.id');

            case 'oldest':
                return $query
                    ->orderBy('bookings.created_at')
                    ->orderBy('bookings.id');

            case 'farthest':
                return $query
                    ->orderByDesc('bookings.booking_date_from')
                    ->orderByDesc('bookings.created_at')
                    ->orderByDesc('bookings.id');

            case 'guests_desc':
                return $query
                    ->orderByDesc('bookings.number_of_guests')
                    ->orderBy('bookings.booking_date_from')
                    ->orderByDesc('bookings.created_at')
                    ->orderByDesc('bookings.id');

            case 'ending_soon':
                return $query
                    ->orderByRaw($bucketSql . " ASC", [$now, $now, $now])
                    ->orderByRaw(
                        "CASE WHEN bookings.booking_date_from <= ? AND bookings.booking_date_to > ? THEN bookings.booking_date_to END ASC",
                        [$now, $now]
                    )
                    ->orderByRaw(
                        "CASE WHEN bookings.booking_date_from > ? THEN bookings.booking_date_to END ASC",
                        [$now]
                    )
                    ->orderByRaw(
                        "CASE WHEN bookings.booking_date_to <= ? THEN bookings.booking_date_to END DESC",
                        [$now]
                    )
                    ->orderByDesc('bookings.created_at')
                    ->orderByDesc('bookings.id');

            case 'priority':
                $applyUnviewedFirst();

                return $query
                    ->orderByRaw("
                        CASE bookings.booking_status
                            WHEN 'pending' THEN 0
                            WHEN 'active' THEN 1
                            WHEN 'confirmed' THEN 2
                            WHEN 'completed' THEN 3
                            WHEN 'cancelled' THEN 4
                            WHEN 'declined' THEN 5
                            ELSE 99
                        END ASC
                    ")
                    ->orderByRaw($bucketSql . " ASC", [$now, $now, $now])
                    ->orderByRaw(
                        "CASE WHEN bookings.booking_date_from <= ? AND bookings.booking_date_to > ? THEN bookings.booking_date_to END ASC",
                        [$now, $now]
                    )
                    ->orderByRaw(
                        "CASE WHEN bookings.booking_date_from > ? THEN bookings.booking_date_from END ASC",
                        [$now]
                    )
                    ->orderByRaw(
                        "CASE WHEN bookings.booking_date_to <= ? THEN bookings.booking_date_from END DESC",
                        [$now]
                    )
                    ->orderByDesc('bookings.created_at')
                    ->orderByDesc('bookings.id');

            case 'unviewed_first':
                $applyUnviewedFirst();

                return $query
                    ->orderByRaw($bucketSql . " ASC", [$now, $now, $now])
                    ->orderByRaw(
                        "CASE WHEN bookings.booking_date_from <= ? AND bookings.booking_date_to > ? THEN bookings.booking_date_to END ASC",
                        [$now, $now]
                    )
                    ->orderByRaw(
                        "CASE WHEN bookings.booking_date_from > ? THEN bookings.booking_date_from END ASC",
                        [$now]
                    )
                    ->orderByRaw(
                        "CASE WHEN bookings.booking_date_to <= ? THEN bookings.booking_date_from END DESC",
                        [$now]
                    )
                    ->orderByDesc('bookings.created_at')
                    ->orderByDesc('bookings.id');

            case 'upcoming':
            default:
                return $query
                    ->orderByRaw($bucketSql . " ASC", [$now, $now, $now])
                    ->orderByRaw(
                        "CASE WHEN bookings.booking_date_from <= ? AND bookings.booking_date_to > ? THEN bookings.booking_date_to END ASC",
                        [$now, $now]
                    )
                    ->orderByRaw(
                        "CASE WHEN bookings.booking_date_from > ? THEN bookings.booking_date_from END ASC",
                        [$now]
                    )
                    ->orderByRaw(
                        "CASE WHEN bookings.booking_date_to <= ? THEN bookings.booking_date_from END DESC",
                        [$now]
                    )
                    ->orderByDesc('bookings.created_at')
                    ->orderByDesc('bookings.id');
        }
    }

    public function create(array $data): Booking
{
    return DB::transaction(function () use ($data) {
        $items = $this->normalizeItemsForBooking((array) ($data['items'] ?? []));
        $extraSchedules = (array) ($data['extra_schedules'] ?? []);
        $guestCount = (int) ($data['number_of_guests'] ?? 0);

        unset($data['items'], $data['extra_schedules']);
        unset($data['created_by_user_id']);

        if (isset($data['booking_date_from'], $data['booking_date_to'])) {
            [$from, $to] = $this->normalizeRangeToPreferred(
                (string) $data['booking_date_from'],
                (string) $data['booking_date_to']
            );

            $data['booking_date_from'] = $from;
            $data['booking_date_to'] = $to;

            $this->assertTimeSlotAvailable($from, $to, null);
        }

        $user = auth()->user();

        if ($user) {
            $data['created_by_user_id'] = $user->id;
        }

        if ($user && $user->hasRole('user')) {
            $data['client_email'] = $user->email;
            $data['booking_status'] = 'pending';
            $data['payment_status'] = 'unpaid';
        } else {
            if (! isset($data['payment_status'])) {
                $data['payment_status'] = 'unpaid';
            }
        }

        $this->assertGuestCapacityForItems($guestCount, $items);

        $data['service_id'] = $items[0]['service_id'] ?? null;

        $booking = Booking::create($data);

        if (! empty($items)) {
            $this->syncItems($booking, $items);
        }

        $this->recalculatePaymentStatus($booking);
        $this->createExtraSchedules($booking, $extraSchedules);

        return $booking->refresh()->loadMissing(['createdBy']);
    });
}


    public function update(Booking $booking, array $data): Booking
{
    return DB::transaction(function () use ($booking, $data) {
        $itemsWasSubmitted = array_key_exists('items', $data);
        $items = $itemsWasSubmitted
            ? $this->normalizeItemsForBooking((array) ($data['items'] ?? []))
            : null;

        $extraSchedules = (array) ($data['extra_schedules'] ?? []);
        unset($data['items'], $data['extra_schedules']);
        unset($data['created_by_user_id']);

        $user = auth()->user();

        if ($user && $user->hasRole('user')) {
            $allowed = [
                'client_name',
                'company_name',
                'client_contact_number',
                'client_email',
                'survey_email',
                'survey_proof_image_path',
                'survey_proof_image',
                'survey_proof_image_mime',
                'survey_proof_image_name',
                'client_address',
                'head_of_organization',
                'type_of_event',
                'number_of_guests',
            ];

            $data = array_intersect_key($data, array_flip($allowed));
            $items = null;
            $itemsWasSubmitted = false;
        }

        if (isset($data['booking_date_from'], $data['booking_date_to'])) {
            [$from, $to] = $this->normalizeRangeToPreferred(
                (string) $data['booking_date_from'],
                (string) $data['booking_date_to']
            );

            $this->assertTimeSlotAvailable($from, $to, $booking->id);

            $data['booking_date_from'] = $from;
            $data['booking_date_to'] = $to;
        }

        $guestCount = array_key_exists('number_of_guests', $data)
            ? (int) $data['number_of_guests']
            : (int) $booking->number_of_guests;

        $itemsForCapacity = $itemsWasSubmitted
            ? ($items ?? [])
            : $this->existingItemsForCapacity($booking);

        $this->assertGuestCapacityForItems($guestCount, $itemsForCapacity);

        if ($itemsWasSubmitted) {
            $data['service_id'] = $items[0]['service_id'] ?? null;
        }

        $booking->update($data);

        if ($itemsWasSubmitted) {
            $this->syncItems($booking, $items ?? []);
        }

        $this->recalculatePaymentStatus($booking);

        return $booking->refresh();
    });
}


    public function delete(Booking $booking): void
    {
        $booking->delete();
    }

    public function getStatusCounts(array $filters = []): array
{
    $this->syncLifecycleStatuses();

    $filtersNoStatus = $filters;

        unset($filtersNoStatus['booking_status']);

        $base = $this->applyFilters($this->baseBookingQuery(), $filtersNoStatus);

        $all = (clone $base)->count();

        $statuses = ['pending', 'active', 'confirmed', 'cancelled', 'declined', 'completed'];
        $result = [
            'all'       => $all,
            'pending'   => 0,
            'active'    => 0,
            'confirmed' => 0,
            'cancelled' => 0,
            'declined'  => 0,
            'completed' => 0,
        ];

        foreach ($statuses as $status) {
            $result[$status] = (clone $base)->where('booking_status', $status)->count();
        }

        return $result;
    }

    protected function applyFilters($query, array $filters)
    {
        return $query
            ->when(!empty($filters['booking_status']), function ($q) use ($filters) {
                $q->where('booking_status', $filters['booking_status']);
            })
            ->when(!empty($filters['payment_status']), function ($q) use ($filters) {
                $q->where('payment_status', $filters['payment_status']);
            })
            ->when(!empty($filters['service_id']), function ($q) use ($filters) {
                $q->where('service_id', $filters['service_id']);
            })
            ->when(!empty($filters['q']), function ($q) use ($filters) {
                $term = '%' . $filters['q'] . '%';
                $q->where(function ($q2) use ($term) {
                    $q2->where('client_name', 'like', $term)
                        ->orWhere('company_name', 'like', $term)
                        ->orWhere('client_email', 'like', $term);
                });
            })
            ->when(!empty($filters['date_from']), function ($q) use ($filters) {
                $q->whereDate('booking_date_from', '>=', $filters['date_from']);
            })
            ->when(!empty($filters['date_to']), function ($q) use ($filters) {
                $q->whereDate('booking_date_to', '<=', $filters['date_to']);
            });
    }
    
    protected function normalizeItemsForBooking(array $items): array
{
    $normalized = [];
    $seen = [];

    foreach ($items as $row) {
        if (! is_array($row)) {
            continue;
        }

        $serviceId = (int) ($row['service_id'] ?? 0);
        if ($serviceId < 1) {
            continue;
        }

        if (isset($seen[$serviceId])) {
            continue;
        }

        $seen[$serviceId] = true;

        $normalized[] = [
            'service_id' => $serviceId,
            'quantity' => 1,
        ];
    }

    return array_values($normalized);
}

protected function existingItemsForCapacity(Booking $booking): array
{
    return $booking->bookingServices()
        ->get(['service_id'])
        ->map(fn ($row) => [
            'service_id' => (int) $row->service_id,
            'quantity' => 1,
        ])
        ->all();
}

    protected function assertGuestCapacityForItems(int $guestCount, array $items): void
{
    if ($guestCount <= 0 || empty($items)) {
        return;
    }

    $serviceIds = collect($items)
        ->pluck('service_id')
        ->filter()
        ->map(fn ($id) => (int) $id)
        ->unique()
        ->values();

    if ($serviceIds->isEmpty()) {
        return;
    }

    $services = \App\Models\Service::query()
        ->whereIn('id', $serviceIds->all())
        ->get()
        ->keyBy('id');

    $messages = [];

    foreach ($serviceIds as $serviceId) {
        /** @var \App\Models\Service|null $service */
        $service = $services->get($serviceId);

        if (! $service) {
            continue;
        }

        $minGuests = $service->min_guests;
        $maxGuests = $service->max_guests;
        $capacityNote = trim((string) ($service->capacity_note ?? ''));

        if ($minGuests !== null && $guestCount < (int) $minGuests) {
            $messages[] = sprintf(
                '%s requires at least %d guest%s. You entered %d.%s',
                $service->name,
                (int) $minGuests,
                (int) $minGuests === 1 ? '' : 's',
                $guestCount,
                $capacityNote !== '' ? ' ' . $capacityNote : ''
            );
        }

        if ($maxGuests !== null && $guestCount > (int) $maxGuests) {
            $messages[] = sprintf(
                '%s allows a maximum of %d guest%s. You entered %d.%s',
                $service->name,
                (int) $maxGuests,
                (int) $maxGuests === 1 ? '' : 's',
                $guestCount,
                $capacityNote !== '' ? ' ' . $capacityNote : ''
            );
        }
    }

    if (! empty($messages)) {
        throw ValidationException::withMessages([
            'items' => $messages,
            'number_of_guests' => $messages[0],
        ]);
    }
}


    protected function syncItems(Booking $booking, array $items): void
{
    $booking->bookingServices()->delete();

    $lines = [];
    foreach ($this->normalizeItemsForBooking($items) as $item) {
        $lines[] = [
            'service_id' => (int) $item['service_id'],
            'quantity' => 1,
        ];
    }

    if (! empty($lines)) {
        $booking->bookingServices()->createMany($lines);
    }
}


    public function recalculatePaymentStatus(Booking $booking): void
{
    $booking->loadMissing(['bookingServices.service', 'payments']);

    $itemsTotal = $booking->bookingServices->reduce(function ($carry, $item) {
        $price = (float) ($item->service->price ?? 0);
        return $carry + $price;
    }, 0.0);

    $completedPaid = $booking->payments
        ->where('status', 'confirmed')
        ->reduce(fn ($sum, $payment) => $sum + (float) $payment->amount, 0.0);

    $newPaymentStatus = 'unpaid';

    if ($itemsTotal <= 0) {
        $newPaymentStatus = $completedPaid > 0 ? 'paid' : 'unpaid';
    } else {
        if ($completedPaid <= 0) {
            $newPaymentStatus = 'unpaid';
        } elseif ($completedPaid + 0.00001 >= $itemsTotal) {
            $newPaymentStatus = 'paid';
        } else {
            $newPaymentStatus = 'partial';
        }
    }

    if ($booking->payment_status !== $newPaymentStatus) {
        $booking->forceFill([
            'payment_status' => $newPaymentStatus,
        ])->saveQuietly();

        $booking->refresh();
    }

    $this->syncLifecycleStatus($booking);
}


    public function syncLifecycleStatuses(): int
{
    $changed = 0;

    Booking::query()
        ->where('booking_status', '!=', 'cancelled')
        ->orderBy('id')
        ->chunkById(100, function ($bookings) use (&$changed) {
            foreach ($bookings as $booking) {
                if ($this->syncLifecycleStatus($booking)) {
                    $changed++;
                }
            }
        });

    return $changed;
}

public function syncLifecycleStatus(Booking $booking): bool
{
    $currentStatus = strtolower((string) ($booking->booking_status ?? ''));

    // Cancelled stays manual and is never auto-overwritten.
    if ($currentStatus === 'cancelled') {
        return false;
    }

    $nextStatus = $this->determineAutomaticBookingStatus($booking);

    if ($nextStatus === $booking->booking_status) {
        return false;
    }

    $booking->forceFill([
        'booking_status' => $nextStatus,
    ])->saveQuietly();

    return true;
}

protected function determineAutomaticBookingStatus(Booking $booking): string
{
    $paymentStatus = strtolower((string) ($booking->payment_status ?? 'unpaid'));
    $hasQualifiedPayment = in_array($paymentStatus, ['partial', 'paid'], true);

    $now = Carbon::now();

    $createdAt = $booking->created_at instanceof Carbon
        ? $booking->created_at->copy()
        : ($booking->created_at ? Carbon::parse($booking->created_at) : $now->copy());

    $startsAt = $booking->booking_date_from instanceof Carbon
        ? $booking->booking_date_from->copy()
        : ($booking->booking_date_from ? Carbon::parse($booking->booking_date_from) : null);

    $endsAt = $booking->booking_date_to instanceof Carbon
        ? $booking->booking_date_to->copy()
        : ($booking->booking_date_to ? Carbon::parse($booking->booking_date_to) : null);

    // No qualifying payment yet:
    // - within 24 hours from creation => pending
    // - beyond 24 hours => declined
    if (! $hasQualifiedPayment) {
        return $createdAt->copy()->addHours(24)->lte($now)
            ? 'declined'
            : 'pending';
    }

    // Partial/Paid payment automatically qualifies the booking lifecycle.
    if (! $startsAt || ! $endsAt) {
        return 'confirmed';
    }

    if ($endsAt->lte($now)) {
        return 'completed';
    }

    if ($startsAt->lte($now) && $endsAt->gt($now)) {
        return 'active';
    }

    return 'confirmed';
}

    protected function createExtraSchedules(Booking $baseBooking, array $extraSchedules): void
    {
        if (empty($extraSchedules)) return;

        $baseBooking->loadMissing('bookingServices');

        foreach ($extraSchedules as $slot) {
            $fromRaw = $slot['from'] ?? null;
            $toRaw   = $slot['to'] ?? null;

            if (empty($fromRaw) || empty($toRaw)) continue;

            try {
                [$from, $to] = $this->normalizeRangeToPreferred((string)$fromRaw, (string)$toRaw);
            } catch (\Throwable $e) {
                continue;
            }

            if ($to->lessThanOrEqualTo($from)) continue;

            $this->assertTimeSlotAvailable($from, $to, null);

            $clone = $baseBooking->replicate();
            $clone->booking_date_from = $from;
            $clone->booking_date_to   = $to;
            $clone->payment_status    = 'unpaid';
            $clone->save();

            foreach ($baseBooking->bookingServices as $item) {
                $clone->bookingServices()->create([
                    'service_id' => $item->service_id,
                    'quantity'   => $item->quantity,
                ]);
            }

            $this->recalculatePaymentStatus($clone);
        }
    }

    private function overlaps(Carbon $aStart, Carbon $aEnd, Carbon $bStart, Carbon $bEnd): bool
    {
        return $aStart->lt($bEnd) && $aEnd->gt($bStart);
    }

    private function calendarBlockIntervalForDate(string $block, Carbon $day): array
    {
        $block = strtoupper($block);

        if ($block === 'AM') {
            return [$day->copy()->setTime(6, 0), $day->copy()->setTime(12, 0)];
        }

        if ($block === 'PM') {
            return [$day->copy()->setTime(12, 0), $day->copy()->setTime(18, 0)];
        }

        if ($block === 'EVE') {
            return [$day->copy()->setTime(18, 0), $day->copy()->addDay()->startOfDay()];
        }

        return [$day->copy()->setTime(6, 0), $day->copy()->addDay()->startOfDay()];
    }

    private function buildAvailabilityBlocks(Carbon $day, array $mergedIntervals): array
    {
        $amStart = $day->copy()->setTime(6, 0);
        $amEnd = $day->copy()->setTime(12, 0);

        $pmStart = $day->copy()->setTime(12, 0);
        $pmEnd = $day->copy()->setTime(18, 0);

        $eveStart = $day->copy()->setTime(18, 0);
        $eveEnd = $day->copy()->addDay()->startOfDay();

        $amAvailable = true;
        $pmAvailable = true;
        $eveAvailable = true;

        foreach ($mergedIntervals as $it) {
            $s = $it['from'];
            $e = $it['to'];

            if ($amAvailable && $this->overlaps($s, $e, $amStart, $amEnd)) {
                $amAvailable = false;
            }
            if ($pmAvailable && $this->overlaps($s, $e, $pmStart, $pmEnd)) {
                $pmAvailable = false;
            }
            if ($eveAvailable && $this->overlaps($s, $e, $eveStart, $eveEnd)) {
                $eveAvailable = false;
            }
        }

        return [
            'AM' => [
                'key' => 'AM',
                'label' => 'Morning',
                'from' => '06:00',
                'to' => '12:00',
                'is_available' => $amAvailable,
            ],
            'PM' => [
                'key' => 'PM',
                'label' => 'Afternoon',
                'from' => '12:00',
                'to' => '18:00',
                'is_available' => $pmAvailable,
            ],
            'EVE' => [
                'key' => 'EVE',
                'label' => 'Evening',
                'from' => '18:00',
                'to' => '23:59',
                'is_available' => $eveAvailable,
            ],
        ];
    }

    public function getDailyAvailability(string $date, $excludeBookingId = null, ?string $area = null): array
{
    $day = Carbon::createFromFormat('Y-m-d', $date)->startOfDay();
    $dayStart = $day->copy()->setTime(6, 0);
    $dayEnd = $day->copy()->addDay()->startOfDay();

    $intervals = [];

    $bookingQuery = Booking::query()
        ->with([
            'bookingServices.service.serviceType',
            'service.serviceType',
        ])
        ->whereIn('booking_status', ['active', 'confirmed'])
        ->where('booking_date_from', '<', $dayEnd)
        ->where('booking_date_to', '>', $dayStart);

    if (! empty($excludeBookingId)) {
        $bookingQuery->where('id', '!=', $excludeBookingId);
    }

    $bookings = $bookingQuery->get();

    if ($area) {
        $bookings = $bookings
            ->filter(fn (Booking $booking) => $this->bookingMatchesArea($booking, $area))
            ->values();
    }

    foreach ($bookings as $booking) {
        $s = Carbon::parse($booking->booking_date_from);
        $e = Carbon::parse($booking->booking_date_to);

        if ($e->lte($dayStart) || $s->gte($dayEnd)) {
            continue;
        }

        $from = $s->gt($dayStart) ? $s : $dayStart->copy();
        $to = $e->lt($dayEnd) ? $e : $dayEnd->copy();

        if ($to->gt($from)) {
            $intervals[] = [
                'from' => $from,
                'to' => $to,
            ];
        }
    }

    if (Schema::hasTable('calendar_blocks')) {
        $calendarBlocks = CalendarBlock::query()
            ->whereDate('date_from', '<=', $day->format('Y-m-d'))
            ->whereDate('date_to', '>=', $day->format('Y-m-d'))
            ->get(['id', 'block', 'area']);

        if ($area) {
            $calendarBlocks = $calendarBlocks
                ->filter(function (CalendarBlock $block) use ($area) {
                    return $this->labelMatchesArea((string) ($block->area ?? ''), $area)
                        || $this->isWholeVenueLabel((string) ($block->area ?? ''));
                })
                ->values();
        }

        foreach ($calendarBlocks as $blk) {
            [$bStart, $bEnd] = $this->calendarBlockIntervalForDate((string) $blk->block, $day);

            $from = $bStart->gt($dayStart) ? $bStart : $dayStart->copy();
            $to = $bEnd->lt($dayEnd) ? $bEnd : $dayEnd->copy();

            if ($to->gt($from)) {
                $intervals[] = [
                    'from' => $from,
                    'to' => $to,
                ];
            }
        }
    }

    if (empty($intervals)) {
        $blocks = $this->buildAvailabilityBlocks($day, []);

        return [
            'date' => $day->format('Y-m-d'),
            'busy' => [],
            'free' => [['from' => '06:00', 'to' => '23:59']],
            'blocks' => $blocks,
            'is_fully_booked' => false,
        ];
    }

    usort($intervals, fn ($a, $b) => $a['from']->getTimestamp() <=> $b['from']->getTimestamp());

    $merged = [];

    foreach ($intervals as $it) {
        if (empty($merged)) {
            $merged[] = $it;
            continue;
        }

        $lastIdx = count($merged) - 1;
        $last = $merged[$lastIdx];

        if ($it['from']->lte($last['to'])) {
            if ($it['to']->gt($last['to'])) {
                $merged[$lastIdx]['to'] = $it['to'];
            }
        } else {
            $merged[] = $it;
        }
    }

    $busy = [];

    foreach ($merged as $it) {
        $from = $it['from'];
        $to = $it['to'];

        $busy[] = [
            'from' => $from->format('H:i'),
            'to' => $to->equalTo($dayEnd) ? '23:59' : $to->format('H:i'),
        ];
    }

    $free = [];
    $cursor = $dayStart->copy();

    foreach ($merged as $it) {
        if ($it['from']->gt($cursor)) {
            $free[] = [
                'from' => $cursor->format('H:i'),
                'to' => $it['from']->format('H:i'),
            ];
        }

        if ($it['to']->gt($cursor)) {
            $cursor = $it['to']->copy();
        }
    }

    if ($cursor->lt($dayEnd)) {
        $free[] = [
            'from' => $cursor->format('H:i'),
            'to' => '23:59',
        ];
    }

    $blocks = $this->buildAvailabilityBlocks($day, $merged);

    $isFullyBooked = ! $blocks['AM']['is_available']
        && ! $blocks['PM']['is_available']
        && ! $blocks['EVE']['is_available'];

    return [
        'date' => $day->format('Y-m-d'),
        'busy' => $busy,
        'free' => $free,
        'blocks' => $blocks,
        'is_fully_booked' => $isFullyBooked,
    ];
}

    public function getPublicDayStatus(string $date, ?string $area = null, $excludeBookingId = null): array
{
    $availability = $this->getDailyAvailability($date, $excludeBookingId, $area);

    $events = PublicEvent::query()
        ->where('is_public', true)
        ->whereDate('event_date', $date)
        ->get()
        ->filter(function (PublicEvent $event) use ($area) {
            if (! $area) {
                return true;
            }

            return $this->labelMatchesArea((string) ($event->venue ?? ''), $area)
                || $this->isWholeVenueLabel((string) ($event->venue ?? ''));
        })
        ->values();

    $calendarBlocks = CalendarBlock::query()
        ->whereDate('date_from', '<=', $date)
        ->whereDate('date_to', '>=', $date)
        ->get()
        ->filter(function (CalendarBlock $block) use ($area) {
            if (! $area) {
                return true;
            }

            return $this->labelMatchesArea((string) ($block->area ?? ''), $area)
                || $this->isWholeVenueLabel((string) ($block->area ?? ''));
        })
        ->values();

    $hasRedBlock = $calendarBlocks->contains(
        fn (CalendarBlock $block) => strtolower((string) ($block->public_status ?? '')) === 'red'
    );

    $hasBlueBlock = $calendarBlocks->contains(
        fn (CalendarBlock $block) => strtolower((string) ($block->public_status ?? '')) === 'blue'
    );

    $hasGoldBlock = $calendarBlocks->contains(
        fn (CalendarBlock $block) => strtolower((string) ($block->public_status ?? '')) === 'gold'
    );

    $availableBlockCount = collect($availability['blocks'] ?? [])
        ->filter(fn ($block) => (bool) data_get($block, 'is_available', false))
        ->count();

    $status = 'available';

    if ($hasRedBlock) {
        $status = 'blocked';
    } elseif ($hasBlueBlock || $events->isNotEmpty()) {
        $status = 'public_booked';
    } elseif ($hasGoldBlock || (bool) ($availability['is_fully_booked'] ?? false)) {
        $status = 'private_booked';
    } elseif ($availableBlockCount > 0 && $availableBlockCount < 3) {
        $status = 'limited';
    }

    $title = 'Selected date is currently available';
    $description = 'No conflicting booking, public event, or admin block was found for the selected venue and date.';
    $note = 'You can continue to the formal booking workflow for final validation.';

    if ($status === 'limited') {
        $title = 'Selected date has limited availability';
        $description = 'Some time blocks are already occupied for the selected venue, but at least one block is still open.';
        $note = 'Check the AM / PM / EVE availability below before proceeding.';
    } elseif ($status === 'public_booked') {
        $title = 'Selected date already has a public event';
        $description = $events->isNotEmpty()
            ? 'This date is already assigned to a public-facing event for the selected venue.'
            : 'This date is marked as a public or government event by the calendar controls.';
        $note = 'Public events are visible to users and should appear consistently on the public calendar.';
    } elseif ($status === 'private_booked') {
        $title = 'Selected date is privately booked or fully occupied';
        $description = 'The selected venue is already occupied by a confirmed/private schedule for the checked date.';
        $note = 'Private booking details remain hidden, but the occupied time blocks are reflected in availability.';
    } elseif ($status === 'blocked') {
        $title = 'Selected date is blocked and unavailable';
        $description = 'The admin calendar currently marks this venue/date as unavailable.';
        $note = 'Blocked dates should not accept new requests from the public checker.';
    }

    return [
        'date' => $date,
        'venue' => $area,
        'status' => $status,
        'title' => $title,
        'description' => $description,
        'note' => $note,
        'blocks' => $availability['blocks'] ?? [],
        'busy' => $availability['busy'] ?? [],
        'free' => $availability['free'] ?? [],
        'is_fully_booked' => (bool) ($availability['is_fully_booked'] ?? false),
        'event_titles' => $events->pluck('title')->values()->all(),
    ];
}

public function getPublicMonthCalendar(string $month, ?string $area = null): array
{
    $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
    $end = $start->copy()->endOfMonth();

    $days = [];

    for ($day = $start->copy(); $day->lte($end); $day->addDay()) {
        $days[] = $this->getPublicDayStatus($day->format('Y-m-d'), $area);
    }

    return $days;
}

private function labelMatchesArea(?string $candidate, string $selected): bool
{
    $candidateNormalized = $this->normalizeAreaLabel($candidate);
    $selectedNormalized = $this->normalizeAreaLabel($selected);

    $candidateCompact = str_replace(' ', '', $candidateNormalized);
    $selectedCompact = str_replace(' ', '', $selectedNormalized);

    if ($candidateNormalized === '' || $selectedNormalized === '') {
        return false;
    }

    return $candidateNormalized === $selectedNormalized
        || $candidateCompact === $selectedCompact
        || str_contains($candidateNormalized, $selectedNormalized)
        || str_contains($selectedNormalized, $candidateNormalized)
        || str_contains($candidateCompact, $selectedCompact)
        || str_contains($selectedCompact, $candidateCompact);
}

private function normalizeAreaLabel(?string $value): string
{
    $value = mb_strtolower(trim((string) $value));
    $value = preg_replace('/[^a-z0-9]+/u', ' ', $value) ?? '';

    return trim(preg_replace('/\s+/u', ' ', $value) ?? '');
}

private function isWholeVenueLabel(?string $value): bool
{
    $normalized = str_replace(' ', '', $this->normalizeAreaLabel($value));

    return in_array($normalized, [
        'wholevenue',
        'wholefacility',
        'entirevenue',
        'allareas',
        'allarea',
        'allspaces',
        'wholeplace',
        'whole',
    ], true);
}


private function bookingMatchesArea(Booking $booking, string $area): bool
{
    foreach ($booking->bookingServices ?? [] as $item) {
        $service = $item->service;

        if (! $service) {
            continue;
        }

        if (
            $this->labelMatchesArea((string) ($service->name ?? ''), $area) ||
            $this->labelMatchesArea((string) ($service->serviceType?->name ?? ''), $area)
        ) {
            return true;
        }
    }

    $directService = $booking->service;

    if ($directService) {
        if (
            $this->labelMatchesArea((string) ($directService->name ?? ''), $area) ||
            $this->labelMatchesArea((string) ($directService->serviceType?->name ?? ''), $area)
        ) {
            return true;
        }
    }

    return false;
}

    public function getUnavailableDates($excludeBookingId = null): array
{
    $this->syncLifecycleStatuses();

    $start = Carbon::today()->startOfDay();

        $end = $start->copy()->addDays(365)->startOfDay();

        $availability = [];
        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $availability[$d->format('Y-m-d')] = ['AM' => true, 'PM' => true, 'EVE' => true];
        }

        $bookingQuery = Booking::query()
            ->whereIn('booking_status', ['active', 'confirmed'])
            ->where('booking_date_from', '<', $end->copy()->addDay()->startOfDay())
            ->where('booking_date_to', '>', $start->copy()->setTime(6, 0));

        if (!empty($excludeBookingId)) {
            $bookingQuery->where('id', '!=', $excludeBookingId);
        }

        $bookings = $bookingQuery->get(['booking_date_from', 'booking_date_to']);

        foreach ($bookings as $b) {
            $bs = Carbon::parse($b->booking_date_from);
            $be = Carbon::parse($b->booking_date_to);

            $fromDay = $bs->copy()->startOfDay();
            $toDay = $be->copy()->startOfDay();

            if ($fromDay->lt($start)) $fromDay = $start->copy();
            if ($toDay->gt($end)) $toDay = $end->copy();

            for ($day = $fromDay->copy(); $day->lte($toDay); $day->addDay()) {
                $key = $day->format('Y-m-d');
                if (!isset($availability[$key])) continue;

                $amStart = $day->copy()->setTime(6, 0);
                $amEnd = $day->copy()->setTime(12, 0);

                $pmStart = $day->copy()->setTime(12, 0);
                $pmEnd = $day->copy()->setTime(18, 0);

                $eveStart = $day->copy()->setTime(18, 0);
                $eveEnd = $day->copy()->addDay()->startOfDay();

                if ($availability[$key]['AM'] && $this->overlaps($bs, $be, $amStart, $amEnd)) $availability[$key]['AM'] = false;
                if ($availability[$key]['PM'] && $this->overlaps($bs, $be, $pmStart, $pmEnd)) $availability[$key]['PM'] = false;
                if ($availability[$key]['EVE'] && $this->overlaps($bs, $be, $eveStart, $eveEnd)) $availability[$key]['EVE'] = false;
            }
        }

        if (Schema::hasTable('calendar_blocks')) {
            $blocks = CalendarBlock::query()
                ->whereDate('date_to', '>=', $start->format('Y-m-d'))
                ->whereDate('date_from', '<=', $end->format('Y-m-d'))
                ->get(['date_from', 'date_to', 'block']);

            foreach ($blocks as $blk) {
                $from = Carbon::parse($blk->date_from)->startOfDay();
                $to = Carbon::parse($blk->date_to)->startOfDay();

                if ($from->lt($start)) $from = $start->copy();
                if ($to->gt($end)) $to = $end->copy();

                for ($day = $from->copy(); $day->lte($to); $day->addDay()) {
                    $key = $day->format('Y-m-d');
                    if (!isset($availability[$key])) continue;

                    $block = strtoupper((string) $blk->block);

                    if ($block === 'DAY') {
                        $availability[$key]['AM'] = false;
                        $availability[$key]['PM'] = false;
                        $availability[$key]['EVE'] = false;
                    } elseif (in_array($block, ['AM', 'PM', 'EVE'], true)) {
                        $availability[$key][$block] = false;
                    }
                }
            }
        }

        $unavailable = [];
        foreach ($availability as $dateKey => $v) {
            if (!$v['AM'] && !$v['PM'] && !$v['EVE']) {
                $unavailable[] = $dateKey;
            }
        }

        return $unavailable;
    }

    protected function assertTimeSlotAvailable(Carbon $from, Carbon $to, ?int $ignoreBookingId = null): void
    {
        if ($to->lte($from)) {
            throw ValidationException::withMessages([
                'booking_date_to' => 'End date & time must be after start date & time.',
            ]);
        }

        $toCalc = $this->normalizeEndForCalc($to);

        $query = Booking::query()
            ->whereIn('booking_status', ['active', 'confirmed'])
            ->where(function ($q) use ($from, $toCalc) {
                $q->where('booking_date_from', '<', $toCalc)
                    ->where('booking_date_to', '>', $from);
            });

        if ($ignoreBookingId) {
            $query->where('id', '!=', $ignoreBookingId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'booking_date_from' => 'The selected schedule overlaps an existing CONFIRMED/ACTIVE booking. Please choose another block/date.',
            ]);
        }
    }

    private function normalizeRangeToPreferred(string $fromRaw, string $toRaw): array
    {
        $from = Carbon::parse($fromRaw);
        $to   = Carbon::parse($toRaw);

        $fromTime = $from->format('H:i');
        $toTime   = $to->format('H:i');

        $isNextDayMidnight =
            $toTime === '23:59'
            && $to->copy()->startOfDay()->equalTo($from->copy()->startOfDay()->addDay());

        $isBlockStart = in_array($fromTime, ['06:00', '12:00', '18:00'], true);

        if ($isNextDayMidnight && $isBlockStart) {
            $to = $from->copy()->setTime(23, 59, 0);
        }

        return [$from, $to];
    }

    private function normalizeEndForCalc(Carbon $to): Carbon
    {
        if ($to->format('H:i') === '23:59') {
            return $to->copy()->addMinute();
        }
        return $to;
    }

    private function minutesToTime(int $minutes, bool $isEnd): string
    {
        if ($isEnd && $minutes >= 1440) return '23:59';
        if ($minutes >= 1440) $minutes = 1439;

        $h = intdiv($minutes, 60);
        $m = $minutes % 60;
        return sprintf('%02d:%02d', $h, $m);
    }

    private function mergeIntervals(array $intervals): array
    {
        if (count($intervals) === 0) return [];

        usort($intervals, fn ($a, $b) => $a['from'] <=> $b['from']);

        $merged = [];
        foreach ($intervals as $it) {
            if (empty($merged)) {
                $merged[] = $it;
                continue;
            }

            $lastIdx = count($merged) - 1;
            $last = $merged[$lastIdx];

            if ($it['from'] <= $last['to']) {
                $merged[$lastIdx]['to'] = max($last['to'], $it['to']);
            } else {
                $merged[] = $it;
            }
        }

        return $merged;
    }

    private function computeFreeIntervals(array $busy, int $windowStart, int $windowEnd): array
    {
        $free = [];
        $cursor = $windowStart;

        foreach ($busy as $b) {
            if ($b['from'] > $cursor) {
                $free[] = ['from' => $cursor, 'to' => $b['from']];
            }
            $cursor = max($cursor, $b['to']);
        }

        if ($cursor < $windowEnd) {
            $free[] = ['from' => $cursor, 'to' => $windowEnd];
        }

        return $free;
    }

    private function intervalOverlaps(array $busy, int $from, int $to): bool
    {
        foreach ($busy as $b) {
            if ($b['from'] < $to && $b['to'] > $from) return true;
        }
        return false;
    }
}
