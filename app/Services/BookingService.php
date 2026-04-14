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
use Illuminate\Support\Facades\Storage;
use App\Models\CalendarBlock;
use App\Models\PublicEvent;
use App\Models\BookingLifecycleEvent;
use App\Models\Service;


class BookingService implements BookingServiceInterface
{
    protected function recordLifecycleEvent(
    Booking $booking,
    string $eventKey,
    string $title,
    ?string $reason = null,
    ?string $fromStatus = null,
    ?string $toStatus = null,
    ?string $fromPaymentStatus = null,
    ?string $toPaymentStatus = null,
    array $meta = [],
): void {
    try {
        BookingLifecycleEvent::query()->create([
            'booking_id' => $booking->id,
            'actor_user_id' => auth()->id(),
            'event_key' => $eventKey,
            'title' => $title,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'from_payment_status' => $fromPaymentStatus,
            'to_payment_status' => $toPaymentStatus,
            'reason' => $reason,
            'meta' => $this->normalizeLifecycleMeta($meta),
            'event_at' => now(),
        ]);
    } catch (\Throwable $e) {
        report($e);
    }
}

protected function normalizeLifecycleMeta(array $meta): array
{
    return collect($meta)
        ->filter(function ($value) {
            return $value !== null && $value !== '' && $value !== [];
        })
        ->map(function ($value) {
            if ($value instanceof Carbon) {
                return $value->toIso8601String();
            }

            return $value;
        })
        ->toArray();
}

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

        if (isset($data['client_email'])) {
            $data['client_email'] = strtolower(trim((string) $data['client_email']));
        }

        if (isset($data['survey_email'])) {
            $data['survey_email'] = strtolower(trim((string) $data['survey_email']));
        }

        $areaServiceIds = $this->selectedAreaServiceIdsFromItems($items);

        if (empty($areaServiceIds)) {
            throw ValidationException::withMessages([
                'items' => 'Please select at least one venue/area service before scheduling the booking.',
            ]);
        }

        if (isset($data['booking_date_from'], $data['booking_date_to'])) {
            [$from, $to] = $this->normalizeRangeToPreferred(
                (string) $data['booking_date_from'],
                (string) $data['booking_date_to']
            );

            $data['booking_date_from'] = $from;
            $data['booking_date_to'] = $to;

            $this->assertTimeSlotAvailable($from, $to, $areaServiceIds, null);
        }

        $user = auth()->user();

        if ($user) {
            $data['created_by_user_id'] = $user->id;
        }

        if ($user && $user->hasRole('user')) {
            $data['client_email'] = strtolower(trim((string) $user->email));
            $data['booking_status'] = 'pending';
            $data['payment_status'] = 'unpaid';
        } elseif (! isset($data['payment_status'])) {
            $data['payment_status'] = 'unpaid';
        }

        $this->assertGuestCapacityForItems($guestCount, $items);

        $data['service_id'] = $items[0]['service_id'] ?? null;

        $booking = Booking::create($data);

        if (! empty($items)) {
            $this->syncItems($booking, $items);
        }

        $this->recalculatePaymentStatus($booking);
        $this->createExtraSchedules($booking, $extraSchedules);

        $booking = $booking->refresh()->loadMissing(['createdBy']);

        $this->recordLifecycleEvent(
            $booking,
            'booking_created',
            'Booking submitted',
            reason: 'The booking record was created and is now being tracked by the lifecycle system.',
            toStatus: (string) ($booking->booking_status ?? ''),
            toPaymentStatus: (string) ($booking->payment_status ?? ''),
            meta: [
                'source' => 'booking_service.create',
                'area_service_ids' => $areaServiceIds,
            ],
        );

        return $booking;
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

        if (isset($data['client_email'])) {
            $data['client_email'] = strtolower(trim((string) $data['client_email']));
        }

        if (isset($data['survey_email'])) {
            $data['survey_email'] = strtolower(trim((string) $data['survey_email']));
        }

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
            $data['client_email'] = strtolower(trim((string) $user->email));

            $items = null;
            $itemsWasSubmitted = false;
        }

        $itemsForConflict = $itemsWasSubmitted
            ? ($items ?? [])
            : $this->existingItemsForCapacity($booking);

        $areaServiceIds = $this->selectedAreaServiceIdsFromItems($itemsForConflict);

        if (empty($areaServiceIds)) {
            throw ValidationException::withMessages([
                'items' => 'A booking must include at least one venue/area service.',
            ]);
        }

        if (isset($data['booking_date_from'], $data['booking_date_to'])) {
            [$from, $to] = $this->normalizeRangeToPreferred(
                (string) $data['booking_date_from'],
                (string) $data['booking_date_to']
            );

            $this->assertTimeSlotAvailable($from, $to, $areaServiceIds, $booking->id);

            $data['booking_date_from'] = $from;
            $data['booking_date_to'] = $to;
        }

        $guestCount = array_key_exists('number_of_guests', $data)
            ? (int) $data['number_of_guests']
            : (int) $booking->number_of_guests;

        $this->assertGuestCapacityForItems($guestCount, $itemsForConflict);

        if ($itemsWasSubmitted) {
            $data['service_id'] = $items[0]['service_id'] ?? null;
        }

        $originalStatus = (string) ($booking->booking_status ?? '');
        $originalPaymentStatus = (string) ($booking->payment_status ?? '');
        $changedFields = $this->extractChangedFields($booking, $data, $itemsWasSubmitted ? ($items ?? []) : null);

        $booking->update($data);

        if ($itemsWasSubmitted) {
            $this->syncItems($booking, $items ?? []);
        }

        $this->recalculatePaymentStatus($booking);
        $booking = $booking->refresh();

        if (! empty($extraSchedules)) {
            $this->createExtraSchedules($booking, $extraSchedules);
            $changedFields[] = 'extra_schedules';
        }

        $changedFields = array_values(array_unique(array_filter($changedFields)));

        if (! empty($changedFields)) {
            $this->recordLifecycleEvent(
                $booking,
                'booking_updated',
                'Booking details updated',
                reason: 'One or more booking details were modified.',
                fromStatus: $originalStatus,
                toStatus: (string) ($booking->booking_status ?? ''),
                fromPaymentStatus: $originalPaymentStatus,
                toPaymentStatus: (string) ($booking->payment_status ?? ''),
                meta: [
                    'changed_fields' => $changedFields,
                    'source' => 'booking_service.update',
                ],
            );
        }

        return $booking;
    });
}



    public function delete(Booking $booking): void
{
    DB::transaction(function () use ($booking) {
        $booking->loadMissing(['payments', 'bookingServices', 'views', 'lifecycleEvents']);

        $this->recordLifecycleEvent(
            $booking,
            'booking_deleted',
            'Booking deleted',
            reason: 'The booking record and its related operational data were manually removed.',
            fromStatus: (string) ($booking->booking_status ?? ''),
            toStatus: 'deleted',
            toPaymentStatus: (string) ($booking->payment_status ?? ''),
            meta: [
                'source' => 'booking_service.delete',
            ],
        );

        $this->deleteBookingStoredFiles($booking);

        $booking->payments()->delete();
        $booking->bookingServices()->delete();

        if (method_exists($booking, 'views')) {
            $booking->views()->delete();
        }

        if (method_exists($booking, 'lifecycleEvents')) {
            $booking->lifecycleEvents()->delete();
        }

        $booking->delete();
    });
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

        $quantity = max(1, (int) ($row['quantity'] ?? 1));

        $normalized[] = [
            'service_id' => $serviceId,
            'quantity' => $quantity,
        ];
    }

    return array_values($normalized);
}

protected function existingItemsForCapacity(Booking $booking): array
{
    return $booking->bookingServices()
        ->get(['service_id', 'quantity'])
        ->map(fn ($row) => [
            'service_id' => (int) $row->service_id,
            'quantity' => max(1, (int) ($row->quantity ?? 1)),
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
            'quantity' => max(1, (int) ($item['quantity'] ?? 1)),
        ];
    }

    if (! empty($lines)) {
        $booking->bookingServices()->createMany($lines);
    }
}


    public function recalculatePaymentStatus(Booking $booking): void
{
    $booking->loadMissing(['bookingServices.service', 'payments']);

    $itemsTotal = $this->roundMoney($this->bookingItemsTotal($booking));
    $confirmedPaid = $this->roundMoney($this->confirmedPaymentTotal($booking));
    $submittedPaid = $this->roundMoney($this->submittedPaymentTotal($booking));

    $newPaymentStatus = 'unpaid';

    if ($itemsTotal <= 0) {
        $newPaymentStatus = $confirmedPaid > 0 ? 'paid' : 'unpaid';
    } else {
        if ($confirmedPaid <= 0.0) {
            $newPaymentStatus = $submittedPaid > 0.0 ? 'partial' : 'unpaid';
        } elseif ($confirmedPaid + 0.00001 >= $itemsTotal) {
            $newPaymentStatus = 'paid';
        } else {
            $newPaymentStatus = 'partial';
        }
    }

    $previousPaymentStatus = (string) ($booking->payment_status ?? '');

    if ($previousPaymentStatus !== $newPaymentStatus) {
        $booking->forceFill([
            'payment_status' => $newPaymentStatus,
        ])->saveQuietly();

        $this->recordLifecycleEvent(
            $booking,
            'payment_status_changed',
            'Payment status updated',
            reason: 'Payment totals were recalculated for this booking.',
            fromPaymentStatus: $previousPaymentStatus,
            toPaymentStatus: $newPaymentStatus,
            meta: [
                'items_total' => $itemsTotal,
                'submitted_payments_total' => $submittedPaid,
                'confirmed_payments_total' => $confirmedPaid,
                'source' => 'booking_service.recalculate_payment_status',
            ],
        );

        $booking->refresh();
    }

    $this->syncLifecycleStatus($booking);
}

   
public function syncLifecycleStatuses(): int
{
    return (int) ($this->runAutomatedLifecycleMaintenance()['changed_count'] ?? 0);
}

public function syncLifecycleStatus(Booking $booking): bool
{
    return $this->syncLifecycleStatusAndReturnChange($booking) !== null;
}

public function runAutomatedLifecycleMaintenance(): array
{
    $synced = [];

    Booking::query()
        ->where('booking_status', '!=', 'cancelled')
        ->orderBy('id')
        ->chunkById(100, function ($bookings) use (&$synced) {
            foreach ($bookings as $booking) {
                $change = $this->syncLifecycleStatusAndReturnChange($booking);

                if ($change !== null) {
                    $synced[] = $change;
                }
            }
        });

    $deleted = $this->cleanupAutoDeletedBookings();

    return [
        'synced' => array_values($synced),
        'deleted' => array_values($deleted),
        'changed_count' => count($synced),
        'deleted_count' => count($deleted),
    ];
}

protected function syncLifecycleStatusAndReturnChange(Booking $booking): ?array
{
    $currentStatus = strtolower((string) ($booking->booking_status ?? ''));

    if ($currentStatus === 'cancelled') {
        return null;
    }

    $decision = $this->determineAutomaticBookingDecision($booking);
    $nextStatus = (string) ($decision['status'] ?? $booking->booking_status);
    $reason = (string) ($decision['reason'] ?? '');

    if ($nextStatus === $booking->booking_status) {
        return null;
    }

    $previousStatus = (string) ($booking->booking_status ?? '');

    $booking->forceFill([
        'booking_status' => $nextStatus,
    ])->saveQuietly();

    $this->recordLifecycleEvent(
        $booking,
        'booking_status_changed',
        'Booking status updated',
        reason: $reason !== '' ? $reason : 'The booking lifecycle engine updated the booking status.',
        fromStatus: $previousStatus,
        toStatus: $nextStatus,
        toPaymentStatus: (string) ($booking->payment_status ?? ''),
        meta: [
            'source' => app()->runningInConsole() ? 'automation' : 'booking_service.sync_lifecycle_status',
        ],
    );

    return [
        'booking_id' => $booking->id,
        'title' => (string) ($booking->type_of_event ?: $booking->company_name ?: 'Booking'),
        'client_name' => (string) ($booking->client_name ?: $booking->company_name ?: $booking->client_email ?: 'Client'),
        'from_status' => $previousStatus,
        'to_status' => $nextStatus,
        'scheduled_at' => optional($booking->booking_date_from)?->format('Y-m-d H:i'),
        'reason' => $reason,
    ];
}


protected function automatedDeletionWindowHours(): int
{
    return 24;
}

protected function cleanupAutoDeletedBookings(): array
{
    $cutoff = now()->subHours($this->automatedDeletionWindowHours());

    $targets = Booking::query()
        ->with(['payments', 'bookingServices', 'views', 'lifecycleEvents'])
        ->whereIn('booking_status', ['declined', 'cancelled'])
        ->where('updated_at', '<=', $cutoff)
        ->orderBy('id')
        ->get();

    $deleted = [];

    foreach ($targets as $booking) {
        $deleted[] = [
            'booking_id' => $booking->id,
            'title' => (string) ($booking->type_of_event ?: $booking->company_name ?: 'Booking'),
            'client_name' => (string) ($booking->client_name ?: $booking->company_name ?: $booking->client_email ?: 'Client'),
            'status' => (string) ($booking->booking_status ?? ''),
            'scheduled_at' => optional($booking->booking_date_from)?->format('Y-m-d H:i'),
        ];

        $this->recordLifecycleEvent(
            $booking,
            'booking_auto_deleted',
            'Booking automatically deleted',
            reason: 'The booking remained declined or cancelled beyond the cleanup window and was automatically removed.',
            fromStatus: (string) ($booking->booking_status ?? ''),
            toStatus: 'deleted',
            toPaymentStatus: (string) ($booking->payment_status ?? ''),
            meta: [
                'source' => 'booking_service.cleanup_auto_deleted_bookings',
            ],
        );

        $this->deleteBookingStoredFiles($booking);
        $booking->payments()->delete();
        $booking->bookingServices()->delete();

        if (method_exists($booking, 'views')) {
            $booking->views()->delete();
        }

        if (method_exists($booking, 'lifecycleEvents')) {
            $booking->lifecycleEvents()->delete();
        }

        $booking->delete();
    }

    return $deleted;
}



protected function determineAutomaticBookingDecision(Booking $booking): array
{
    $booking->loadMissing(['bookingServices.service', 'payments']);

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

    $itemsTotal = $this->roundMoney($this->bookingItemsTotal($booking));
    $confirmedTotal = $this->roundMoney($this->confirmedPaymentTotal($booking));
    $submittedTotal = $this->roundMoney($this->submittedPaymentTotal($booking));

    $downPaymentRequired = $itemsTotal > 0 ? $this->roundMoney($itemsTotal * 0.5) : 0.0;
    $downPaymentDeadline = $createdAt->copy()->addHours(24);
    $fullPaymentDeadline = $createdAt->copy()->addHours(48);

    if ($itemsTotal <= 0) {
        if (! $startsAt || ! $endsAt) {
            return [
                'status' => 'confirmed',
                'reason' => 'This booking has no billable item total, so it is treated as confirmed.',
            ];
        }

        if ($endsAt->lte($now)) {
            return [
                'status' => 'completed',
                'reason' => 'The scheduled end time has passed.',
            ];
        }

        if ($startsAt->lte($now) && $endsAt->gt($now)) {
            return [
                'status' => 'active',
                'reason' => 'The booking schedule is currently in progress.',
            ];
        }

        return [
            'status' => 'confirmed',
            'reason' => 'The booking is fully scheduled and no payment gate is blocking it.',
        ];
    }

    /**
     * Security correction:
     * Only CONFIRMED payments satisfy automated payment compliance.
     * Pending uploads/screenshots are informative, but they must not
     * stop the lifecycle engine from enforcing the policy.
     */
    if ($confirmedTotal + 0.00001 < $downPaymentRequired) {
        if ($downPaymentDeadline->lte($now)) {
            if ($submittedTotal > 0.0) {
                return [
                    'status' => 'pending',
                    'reason' => 'A payment was submitted but is still awaiting confirmation. Staff review is required before the booking can move forward.',
                ];
            }

            return [
                'status' => 'declined',
                'reason' => 'The required 50% down payment was not confirmed within the first 24 hours.',
            ];
        }

        return [
            'status' => 'pending',
            'reason' => 'The booking is still inside the initial 24-hour window for the 50% down payment.',
        ];
    }

    if ($confirmedTotal + 0.00001 < $itemsTotal && $fullPaymentDeadline->lte($now)) {
        if ($submittedTotal > $confirmedTotal) {
            return [
                'status' => 'pending',
                'reason' => 'A remaining payment was submitted but is still awaiting confirmation. Staff review is required before the booking can move forward.',
            ];
        }

        return [
            'status' => 'declined',
            'reason' => 'The remaining balance was not confirmed within 48 hours from booking creation.',
        ];
    }

    if (! $startsAt || ! $endsAt) {
        return [
            'status' => 'confirmed',
            'reason' => 'Payment compliance is currently sufficient for the next lifecycle stage.',
        ];
    }

    if ($endsAt->lte($now)) {
        return [
            'status' => 'completed',
            'reason' => 'The scheduled end time has passed.',
        ];
    }

    if ($startsAt->lte($now) && $endsAt->gt($now)) {
        return [
            'status' => 'active',
            'reason' => 'The booking schedule is currently in progress.',
        ];
    }

    return [
        'status' => 'confirmed',
        'reason' => 'The booking met the payment rule and is waiting for its scheduled date.',
    ];
}


protected function determineAutomaticBookingStatus(Booking $booking): string
{
    return (string) ($this->determineAutomaticBookingDecision($booking)['status'] ?? 'pending');
}


protected function paymentPolicySnapshot(Booking $booking): array
{
    $booking->loadMissing(['bookingServices.service', 'payments']);

    $now = Carbon::now();

    $createdAt = $booking->created_at instanceof Carbon
        ? $booking->created_at->copy()
        : ($booking->created_at ? Carbon::parse($booking->created_at) : $now->copy());

    $itemsTotal = $this->roundMoney($this->bookingItemsTotal($booking));
    $confirmedTotal = $this->roundMoney($this->confirmedPaymentTotal($booking));
    $submittedTotal = $this->roundMoney($this->submittedPaymentTotal($booking));
    $downRequired = $itemsTotal <= 0 ? 0.0 : $this->roundMoney($itemsTotal * 0.50);

    return [
        'items_total' => $itemsTotal,
        'confirmed_total' => $confirmedTotal,
        'submitted_total' => $submittedTotal,
        'down_required' => $downRequired,
        'down_deadline_at' => $createdAt->copy()->addHours(24),
        'final_deadline_at' => $createdAt->copy()->addHours(48),
        'has_met_down_payment' => $itemsTotal <= 0 ? true : ($confirmedTotal + 0.00001 >= $downRequired),
        'has_met_full_payment' => $itemsTotal <= 0 ? true : ($confirmedTotal + 0.00001 >= $itemsTotal),
        'has_pending_review_payment' => $submittedTotal > $confirmedTotal,
    ];
}


protected function bookingItemsTotal(Booking $booking): float
{
    return (float) $booking->bookingServices->reduce(function ($carry, $item) {
        $price = (float) ($item->service->price ?? 0);
        $quantity = max(1, (int) ($item->quantity ?? 1));
        return $carry + ($price * $quantity);
    }, 0.0);
}

protected function confirmedPaymentTotal(Booking $booking): float
{
    return (float) $booking->payments
        ->whereIn('status', ['confirmed'])
        ->reduce(fn ($sum, $payment) => $sum + (float) $payment->amount, 0.0);
}

protected function submittedPaymentTotal(Booking $booking): float
{
    return (float) $booking->payments
        ->whereIn('status', ['pending', 'confirmed'])
        ->reduce(fn ($sum, $payment) => $sum + (float) $payment->amount, 0.0);
}

protected function extractChangedFields(Booking $booking, array $incomingData, ?array $newItems = null): array
{
    $changed = [];

    foreach ($incomingData as $field => $newValue) {
        if (in_array($field, ['updated_at'], true)) {
            continue;
        }

        $oldValue = $booking->getAttribute($field);

        if ($oldValue instanceof Carbon) {
            $oldValue = $oldValue->toIso8601String();
        }

        if ($newValue instanceof Carbon) {
            $newValue = $newValue->toIso8601String();
        }

        if (is_bool($oldValue) || is_bool($newValue)) {
            if ((bool) $oldValue !== (bool) $newValue) {
                $changed[] = $field;
            }
            continue;
        }

        if ((string) $oldValue !== (string) $newValue) {
            $changed[] = $field;
        }
    }

    if (is_array($newItems)) {
        $existingServiceIds = $booking->bookingServices()
            ->pluck('service_id')
            ->map(fn ($id) => (int) $id)
            ->sort()
            ->values()
            ->all();

        $incomingServiceIds = collect($newItems)
            ->pluck('service_id')
            ->map(fn ($id) => (int) $id)
            ->sort()
            ->values()
            ->all();

        if ($existingServiceIds !== $incomingServiceIds) {
            $changed[] = 'items';
        }
    }

    return array_values(array_unique($changed));
}

protected function deleteBookingStoredFiles(Booking $booking): void
{
    $paths = [];

    if (! empty($booking->survey_proof_image_path)) {
        $paths[] = (string) $booking->survey_proof_image_path;
    }

    foreach ($booking->payments as $payment) {
        if (! empty($payment->proof_image_path)) {
            $paths[] = (string) $payment->proof_image_path;
        }
    }

    $paths = array_values(array_unique(array_filter($paths)));

    foreach ($paths as $path) {
        $this->deleteStoredPath($path);
    }
}

protected function deleteStoredPath(?string $path): void
{
    if (! $path) {
        return;
    }

    $candidates = array_values(array_unique(array_filter([
        ltrim((string) $path, '/'),
        ltrim((string) preg_replace('#^/?storage/#', '', (string) $path), '/'),
    ])));

    foreach (['local', 'public'] as $disk) {
        foreach ($candidates as $candidate) {
            if ($candidate !== '' && Storage::disk($disk)->exists($candidate)) {
                Storage::disk($disk)->delete($candidate);
                return;
            }
        }
    }
}


protected function roundMoney(float $value): float
{
    return round($value, 2);
}

    protected function createExtraSchedules(Booking $baseBooking, array $extraSchedules): void
    {
        if (empty($extraSchedules)) {
            return;
        }

        $baseBooking->loadMissing(['bookingServices']);

        $areaServiceIds = $this->bookingAreaServiceIds($baseBooking);

        if (empty($areaServiceIds)) {
            return;
        }

        foreach ($extraSchedules as $slot) {
            $fromRaw = $slot['from'] ?? null;
            $toRaw = $slot['to'] ?? null;

            if (empty($fromRaw) || empty($toRaw)) {
                continue;
            }

            try {
                [$from, $to] = $this->normalizeRangeToPreferred((string) $fromRaw, (string) $toRaw);
            } catch (\Throwable $e) {
                continue;
            }

            if ($to->lessThanOrEqualTo($from)) {
                continue;
            }

            $this->assertTimeSlotAvailable($from, $to, $areaServiceIds, null);

            $clone = $baseBooking->replicate();
            $clone->booking_date_from = $from;
            $clone->booking_date_to = $to;
            $clone->payment_status = 'unpaid';
            $clone->save();

            foreach ($baseBooking->bookingServices as $item) {
                $clone->bookingServices()->create([
                    'service_id' => $item->service_id,
                    'quantity' => $item->quantity,
                ]);
            }

            $this->recalculatePaymentStatus($clone);

            $this->recordLifecycleEvent(
                $clone,
                'booking_created',
                'Booking submitted',
                reason: 'An additional schedule was created from the same booking request.',
                toStatus: (string) ($clone->booking_status ?? ''),
                toPaymentStatus: (string) ($clone->payment_status ?? ''),
                meta: [
                    'source' => 'booking_service.create_extra_schedules',
                    'parent_booking_id' => $baseBooking->id,
                    'area_service_ids' => $areaServiceIds,
                ],
            );
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
        return $this->areasOverlap((string) ($block->area ?? ''), $area);
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
   
    public function getDashboardDayStatus(string $date): array
{
    $availability = $this->getDailyAvailability($date);

    $publicEventsExist = PublicEvent::query()
        ->where('is_public', true)
        ->whereDate('event_date', $date)
        ->exists();

    $calendarBlocks = CalendarBlock::query()
        ->whereDate('date_from', '<=', $date)
        ->whereDate('date_to', '>=', $date)
        ->get(['public_status']);

    $hasRedBlock = $calendarBlocks->contains(
        fn (CalendarBlock $block) => strtolower((string) ($block->public_status ?? '')) === 'red'
    );

    $hasBlueBlock = $calendarBlocks->contains(
        fn (CalendarBlock $block) => strtolower((string) ($block->public_status ?? '')) === 'blue'
    );

    $hasGoldBlock = $calendarBlocks->contains(
        fn (CalendarBlock $block) => strtolower((string) ($block->public_status ?? '')) === 'gold'
    );

    $status = 'available';

    if ($hasRedBlock) {
        $status = 'blocked';
    } elseif ($hasBlueBlock || $publicEventsExist) {
        $status = 'public_booked';
    } elseif ($hasGoldBlock || (bool) ($availability['is_fully_booked'] ?? false)) {
        $status = 'private_booked';
    } elseif (
        collect($availability['blocks'] ?? [])
            ->filter(fn ($block) => (bool) data_get($block, 'is_available', false))
            ->count() < 3
    ) {
        $status = 'limited';
    }

    return [
        'date' => $date,
        'day_status' => $status,
        'AM' => (bool) data_get($availability, 'blocks.AM.is_available', true),
        'PM' => (bool) data_get($availability, 'blocks.PM.is_available', true),
        'EVE' => (bool) data_get($availability, 'blocks.EVE.is_available', true),
        'is_fully_booked' => (bool) ($availability['is_fully_booked'] ?? false),
    ];
}

    public function getPublicDayStatus(
    string $date,
    ?string $area = null,
    $excludeBookingId = null,
    ?string $eventType = null,
    ?int $guestCount = null
): array
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

            return $this->areasOverlap((string) ($event->venue ?? ''), $area);
        })
        ->values();

    $publicVisibleBookings = Booking::query()
        ->with(['bookingServices.service.serviceType'])
        ->whereIn('booking_status', ['active', 'confirmed'])
        ->where('is_public_calendar_visible', true)
        ->where('booking_date_from', '<', Carbon::parse($date)->addDay()->startOfDay())
        ->where('booking_date_to', '>', Carbon::parse($date)->startOfDay())
        ->get()
        ->filter(function (Booking $booking) use ($area) {
            if (! $area) {
                return true;
            }

            return $this->bookingMatchesArea($booking, $area);
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

            return $this->areasOverlap((string) ($block->area ?? ''), $area);

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

    $capacitySummary = $this->summarizePublicCapacityForArea($area, $guestCount);
    $eventProfile = $this->profilePublicEventType($eventType);

    $status = 'available';

    if ($hasRedBlock) {
        $status = 'blocked';
    } elseif ($hasBlueBlock || $events->isNotEmpty() || $publicVisibleBookings->isNotEmpty()) {
        $status = 'public_booked';
    } elseif ($hasGoldBlock || (bool) ($availability['is_fully_booked'] ?? false)) {
        $status = 'private_booked';
    } elseif ($availableBlockCount > 0 && $availableBlockCount < 3) {
        $status = 'limited';
    }

    $title = 'Selected date is currently available';
    $description = 'No conflicting booking, public event, or admin block was found for the selected venue and date.';
    $note = 'You can continue to the formal booking workflow for final validation.';
    $recommendedAction = 'You may continue to the booking request flow.';

    if ($status === 'limited') {
        $title = 'Selected date has limited availability';
        $description = 'Some time blocks are already occupied for the selected venue, but at least one block is still open.';
        $note = 'Check the AM / PM / EVE availability below before proceeding.';
        $recommendedAction = 'Pick an open time block or choose another date if you need a whole-day schedule.';
    } elseif ($status === 'public_booked') {
        $title = 'Selected date already has a public event';
        $description = $events->isNotEmpty()
            ? 'This date is already assigned to a public-facing event for the selected venue.'
            : 'This date is marked as a public or government event by the calendar controls.';
        $note = 'Public events are visible to users and should appear consistently on the public calendar.';
        $recommendedAction = 'Choose a different date for this request or coordinate with the admin office.';
    } elseif ($status === 'private_booked') {
        $title = 'Selected date is privately booked or fully occupied';
        $description = 'The selected venue is already occupied by a confirmed/private schedule for the checked date.';
        $note = 'Private booking details remain hidden, but the occupied time blocks are reflected in availability.';
        $recommendedAction = 'Choose another date because the selected venue is already reserved.';
    } elseif ($status === 'blocked') {
        $title = 'Selected date is blocked and unavailable';
        $description = 'The admin calendar currently marks this venue/date as unavailable.';
        $note = 'Blocked dates should not accept new requests from the public checker.';
        $recommendedAction = 'Choose another date or contact the office for clarification.';
    }

    if ($eventProfile['classification'] === 'public') {
        $note .= ' The selected event type is public-facing, so final publication still depends on admin approval.';
    } elseif ($eventProfile['classification'] === 'private') {
        $note .= ' The selected event type is treated as private on the public layer unless the office publishes it as a public event.';
    }

    if ($capacitySummary['message']) {
        $note .= ' ' . $capacitySummary['message'];
    }

    $canProceed = in_array($status, ['available', 'limited'], true);

    if ($capacitySummary['ok'] === false) {
        $canProceed = false;
        $title = 'Selected date needs venue adjustment';
        $description = 'The date may still have time availability, but the selected guest count does not fit the current venue rule for this area.';
        $recommendedAction = 'Choose another venue/area or adjust the guest count before proceeding.';
    }

    return [
        'date' => $date,
        'venue' => $area,
        'event_type' => $eventType,
        'event_type_classification' => $eventProfile['classification'],
        'guests' => $guestCount,
        'status' => $status,
        'title' => $title,
        'description' => $description,
        'note' => $note,
        'recommended_action' => $recommendedAction,
        'can_proceed' => $canProceed,
        'blocks' => array_values($availability['blocks'] ?? []),
        'busy' => array_values($availability['busy'] ?? []),
        'free' => array_values($availability['free'] ?? []),
        'is_fully_booked' => (bool) ($availability['is_fully_booked'] ?? false),
        'event_titles' => $events->pluck('title')->merge($publicVisibleBookings->map(function (Booking $booking) {
            return trim((string) ($booking->public_calendar_title ?: $booking->type_of_event ?: $booking->company_name ?: 'Public booking'));
        }))->filter()->values()->all(),
        'calendar_blocks' => $calendarBlocks->map(fn (CalendarBlock $block) => [
            'title' => $this->publicCalendarBlockTitle($block),
            'area' => $this->publicCalendarBlockArea($block),
            'notes' => $this->publicCalendarBlockNotes($block),
            'block' => (string) ($block->block ?? 'DAY'),
            'public_status' => strtolower((string) ($block->public_status ?? 'red')),
        ])->values()->all(),
        'venue_capacity_ok' => $capacitySummary['ok'],
        'venue_capacity_message' => $capacitySummary['message'],
        'matching_services' => $capacitySummary['matching_services'],
        'capacity_reasons' => $capacitySummary['reasons'],
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

private function summarizePublicCapacityForArea(?string $area, ?int $guestCount): array
{
    if (! $guestCount || $guestCount < 1) {
        return [
            'ok' => null,
            'message' => null,
            'matching_services' => [],
            'reasons' => [],
        ];
    }

    if (! $area || $this->isWholeVenueLabel($area)) {
        return [
            'ok' => null,
            'message' => 'Whole-venue and multi-area requests still need admin review for final guest-capacity planning.',
            'matching_services' => [],
            'reasons' => [],
        ];
    }

    $services = \App\Models\Service::query()
        ->with('serviceType')
        ->orderBy('name')
        ->get()
        ->filter(function ($service) use ($area) {
            return $this->areasOverlap((string) ($service->name ?? ''), $area)
                || $this->areasOverlap((string) ($service->serviceType?->name ?? ''), $area);

        })
        ->values();

    if ($services->isEmpty()) {
        return [
            'ok' => null,
            'message' => 'No specific guest-capacity rule is configured yet for the selected area. Final validation will still happen during booking review.',
            'matching_services' => [],
            'reasons' => [],
        ];
    }

    $matching = [];
    $reasons = [];

    foreach ($services as $service) {
        $minGuests = $service->min_guests;
        $maxGuests = $service->max_guests;
        $capacityNote = trim((string) ($service->capacity_note ?? ''));
        $serviceName = trim((string) ($service->name ?? 'Selected venue'));

        $fitsMin = $minGuests === null || $guestCount >= (int) $minGuests;
        $fitsMax = $maxGuests === null || $guestCount <= (int) $maxGuests;

        if ($fitsMin && $fitsMax) {
            $matching[] = $serviceName;
            continue;
        }

        if ($minGuests !== null && $guestCount < (int) $minGuests) {
            $reasons[] = sprintf(
                '%s requires at least %d guest%s. You entered %d.%s',
                $serviceName,
                (int) $minGuests,
                (int) $minGuests === 1 ? '' : 's',
                $guestCount,
                $capacityNote !== '' ? ' ' . $capacityNote : ''
            );
        }

        if ($maxGuests !== null && $guestCount > (int) $maxGuests) {
            $reasons[] = sprintf(
                '%s allows a maximum of %d guest%s. You entered %d.%s',
                $serviceName,
                (int) $maxGuests,
                (int) $maxGuests === 1 ? '' : 's',
                $guestCount,
                $capacityNote !== '' ? ' ' . $capacityNote : ''
            );
        }
    }

    if (! empty($matching)) {
        $preview = collect($matching)->take(3)->implode(', ');

        return [
            'ok' => true,
            'message' => 'Guest count fits the selected area based on the current venue rule' . ($preview !== '' ? ' (' . $preview . ').' : '.'),
            'matching_services' => array_values(array_unique($matching)),
            'reasons' => [],
        ];
    }

    return [
        'ok' => false,
        'message' => $reasons[0] ?? 'The selected guest count does not fit the current venue rule for this area.',
        'matching_services' => [],
        'reasons' => array_values(array_unique($reasons)),
    ];
}

private function profilePublicEventType(?string $eventType): array
{
    $label = trim((string) $eventType);
    $normalized = mb_strtolower($label);

    if ($normalized === '') {
        return [
            'label' => null,
            'classification' => 'general',
        ];
    }

    $publicWords = ['public', 'government', 'gov', 'community', 'cultural', 'city', 'festival', 'expo'];
    $privateWords = ['private', 'wedding', 'birthday', 'debut', 'family', 'personal'];

    foreach ($publicWords as $word) {
        if (str_contains($normalized, $word)) {
            return [
                'label' => $label,
                'classification' => 'public',
            ];
        }
    }

    foreach ($privateWords as $word) {
        if (str_contains($normalized, $word)) {
            return [
                'label' => $label,
                'classification' => 'private',
            ];
        }
    }

    return [
        'label' => $label,
        'classification' => 'general',
    ];
}

private function publicCalendarBlockTitle(CalendarBlock $block): string
{
    $status = strtolower((string) ($block->public_status ?? 'red'));

    return match ($status) {
        'blue' => (string) ($block->title ?? 'Public Event Block'),
        'gold' => 'Private Booking',
        default => 'Blocked Date',
    };
}

private function publicCalendarBlockArea(CalendarBlock $block): string
{
    $status = strtolower((string) ($block->public_status ?? 'red'));

    if ($status === 'blue') {
        return (string) ($block->area ?? '');
    }

    return $status === 'gold' ? 'Reserved area details are hidden' : 'Unavailable for public requests';
}

private function publicCalendarBlockNotes(CalendarBlock $block): string
{
    $status = strtolower((string) ($block->public_status ?? 'red'));

    return match ($status) {
        'blue' => (string) ($block->notes ?? ''),
        'gold' => 'Private booking details are hidden from public view.',
        default => 'This date is blocked for maintenance, control, or other internal reasons.',
    };
}

private function labelMatchesArea(?string $candidate, string $selected): bool
{
    return $this->areasOverlap($candidate, $selected);
}

private function canonicalAreaKey(?string $value): string
{
    $normalized = str_replace(' ', '', $this->normalizeAreaLabel($value));

    $map = [
        'fullhall' => 'full_hall',
        'fullvenue' => 'full_hall',
        'wholehall' => 'full_hall',
        'entirehall' => 'full_hall',

        'mainhall' => 'main_hall',
        'mainfunctionhall' => 'main_hall',

        'foyerlobbyarea' => 'foyer_lobby',
        'foyerandlobbyarea' => 'foyer_lobby',
        'foyerlobby' => 'foyer_lobby',
        'foyer' => 'foyer_lobby',
        'lobbyarea' => 'foyer_lobby',
        'lobby' => 'foyer_lobby',

        'viplounge' => 'vip_lounge',
        'viploungearea' => 'vip_lounge',

        'boardroom' => 'board_room',
        'boardrm' => 'board_room',

        'basement' => 'basement',

        'gallery2600' => 'gallery2600',
        'gallery' => 'gallery2600',

        'wholevenue' => 'whole_venue',
        'wholefacility' => 'whole_venue',
        'entirevenue' => 'whole_venue',
        'allareas' => 'whole_venue',
        'allarea' => 'whole_venue',
        'allspaces' => 'whole_venue',
        'wholeplace' => 'whole_venue',
        'whole' => 'whole_venue',
    ];

    return $map[$normalized] ?? $normalized;
}

private function normalizeAreaLabel(?string $value): string
{
    $value = mb_strtolower(trim((string) $value));
    $value = str_replace(['&', '/'], [' and ', ' '], $value);
    $value = preg_replace('/[^a-z0-9]+/u', ' ', $value) ?? '';

    return trim(preg_replace('/\s+/u', ' ', $value) ?? '');
}

private function isWholeVenueLabel(?string $value): bool
{
    return in_array($this->canonicalAreaKey($value), ['whole_venue', 'full_hall'], true);
}

private function areaOverlapMatrix(): array
{
    return [
        'whole_venue' => ['whole_venue', 'full_hall', 'main_hall', 'foyer_lobby', 'vip_lounge', 'board_room', 'basement', 'gallery2600'],
        'full_hall' => ['whole_venue', 'full_hall', 'main_hall', 'foyer_lobby', 'vip_lounge', 'board_room', 'basement', 'gallery2600'],

        'main_hall' => ['whole_venue', 'full_hall', 'main_hall'],
        'foyer_lobby' => ['whole_venue', 'full_hall', 'foyer_lobby'],
        'vip_lounge' => ['whole_venue', 'full_hall', 'vip_lounge'],
        'board_room' => ['whole_venue', 'full_hall', 'board_room'],
        'basement' => ['whole_venue', 'full_hall', 'basement'],
        'gallery2600' => ['whole_venue', 'full_hall', 'gallery2600'],
    ];
}

private function areasOverlap(?string $candidate, ?string $selected): bool
{
    $candidateKey = $this->canonicalAreaKey($candidate);
    $selectedKey = $this->canonicalAreaKey($selected);

    if ($candidateKey === '' || $selectedKey === '') {
        return false;
    }

    if ($candidateKey === $selectedKey) {
        return true;
    }

    $matrix = $this->areaOverlapMatrix();

    return in_array($selectedKey, $matrix[$candidateKey] ?? [], true)
        || in_array($candidateKey, $matrix[$selectedKey] ?? [], true);
}

private function bookingMatchesArea(Booking $booking, string $area): bool
{
    foreach ($booking->bookingServices ?? [] as $item) {
        $service = $item->service;

        if (! $service) {
            continue;
        }

        if (
            $this->areasOverlap((string) ($service->name ?? ''), $area) ||
            $this->areasOverlap((string) ($service->serviceType?->name ?? ''), $area)
        ) {
            return true;
        }
    }

    $directService = $booking->service;

    if ($directService) {
        if (
            $this->areasOverlap((string) ($directService->name ?? ''), $area) ||
            $this->areasOverlap((string) ($directService->serviceType?->name ?? ''), $area)
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
    protected function selectedAreaServiceIdsFromItems(array $items): array
{
    $serviceIds = collect($items)
        ->pluck('service_id')
        ->filter()
        ->map(fn ($id) => (int) $id)
        ->unique()
        ->values()
        ->all();

    if (empty($serviceIds)) {
        return [];
    }

    return Service::query()
        ->with('serviceType')
        ->whereIn('id', $serviceIds)
        ->get()
        ->filter(function (Service $service) {
            $type = strtolower(trim((string) ($service->serviceType?->name ?? '')));

            return $type === 'area'
                || in_array($this->canonicalAreaKey($service->name), array_keys($this->areaOverlapMatrix()), true);
        })
        ->pluck('id')
        ->map(fn ($id) => (int) $id)
        ->values()
        ->all();
}


protected function bookingAreaServiceIds(Booking $booking): array
{
    $booking->loadMissing(['bookingServices']);

    return $booking->bookingServices
        ->pluck('service_id')
        ->filter()
        ->map(fn ($id) => (int) $id)
        ->unique()
        ->values()
        ->all();
}


protected function resolveAreaLabelsFromServiceIds(array $serviceIds): array
{
    if (empty($serviceIds)) {
        return [];
    }

    return Service::query()
        ->with('serviceType')
        ->whereIn('id', $serviceIds)
        ->get()
        ->filter(function (Service $service) {
            $type = strtolower(trim((string) ($service->serviceType?->name ?? '')));

            return $type === 'area'
                || in_array($this->canonicalAreaKey($service->name), array_keys($this->areaOverlapMatrix()), true);
        })
        ->map(fn (Service $service) => (string) $service->name)
        ->filter()
        ->unique()
        ->values()
        ->all();
}

protected function extractAreaLabelsFromBooking(Booking $booking): array
{
    $booking->loadMissing(['bookingServices.service.serviceType']);

    return $booking->bookingServices
        ->map(fn ($row) => $row->service)
        ->filter(fn ($service) => $service instanceof Service)
        ->filter(function (Service $service) {
            $type = strtolower(trim((string) ($service->serviceType?->name ?? '')));

            return $type === 'area'
                || in_array($this->canonicalAreaKey($service->name), array_keys($this->areaOverlapMatrix()), true);
        })
        ->map(fn (Service $service) => (string) $service->name)
        ->filter()
        ->unique()
        ->values()
        ->all();
}

protected function bookingOverlapsRequestedAreas(Booking $booking, array $requestedAreaLabels): bool
{
    $existingLabels = $this->extractAreaLabelsFromBooking($booking);

    foreach ($existingLabels as $existing) {
        foreach ($requestedAreaLabels as $requested) {
            if ($this->areasOverlap($existing, $requested)) {
                return true;
            }
        }
    }

    return false;
}

    protected function assertTimeSlotAvailable(Carbon $from, Carbon $to, array $requestedAreaServiceIds = [], ?int $ignoreBookingId = null): void
{
    if ($to->lte($from)) {
        throw ValidationException::withMessages([
            'booking_date_to' => 'End date & time must be after start date & time.',
        ]);
    }

    $requestedAreaLabels = $this->resolveAreaLabelsFromServiceIds($requestedAreaServiceIds);

    if (empty($requestedAreaLabels)) {
        throw ValidationException::withMessages([
            'items' => 'Please select at least one venue/area service before scheduling the booking.',
        ]);
    }

    $toCalc = $this->normalizeEndForCalc($to);

    $overlapping = Booking::query()
        ->with(['bookingServices.service.serviceType'])
        ->whereIn('booking_status', ['active', 'confirmed'])
        ->when($ignoreBookingId, fn ($query) => $query->where('id', '!=', $ignoreBookingId))
        ->where(function ($query) use ($from, $toCalc) {
            $query->where('booking_date_from', '<', $toCalc)
                ->where('booking_date_to', '>', $from);
        })
        ->orderBy('booking_date_from')
        ->get();

    $conflict = $overlapping->first(function (Booking $booking) use ($requestedAreaLabels) {
        return $this->bookingOverlapsRequestedAreas($booking, $requestedAreaLabels);
    });

    if ($conflict) {
        throw ValidationException::withMessages([
            'booking_date_from' => 'The selected schedule overlaps an existing CONFIRMED/ACTIVE booking for the same area or an overlapping venue scope.',
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