<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingLifecycleEvent;
use App\Models\CalendarBlock;
use App\Models\PublicEvent;
use App\Models\Service;
use App\Services\Contracts\BookingServiceInterface;
use App\Support\BookingStatusCatalog;
use App\Support\VenueAreaCatalog;
use App\Support\WorkspaceAccess;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class BookingService implements BookingServiceInterface
{
    /**
     * Statuses that occupy availability while a booking is still valid.
     * Pencil-booked and review-stage bookings must block the venue until
     * they are declined, cancelled, expired, archived, or completed.
     */
    protected function blockingBookingStatuses(): array
    {
        return VenueAreaCatalog::BLOCKING_BOOKING_STATUSES;
    }

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
        if (! Schema::hasTable('booking_lifecycle_events')) {
            return;
        }

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
        } catch (\Throwable $exception) {
            report($exception);
        }
    }

    protected function normalizeLifecycleMeta(array $meta): array
    {
        return collect($meta)
            ->filter(fn ($value) => $value !== null && $value !== '' && $value !== [])
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

        if (! Schema::hasTable('bookings')) {
            return ['bookings.*'];
        }

        if (! Schema::hasColumn('bookings', 'survey_proof_image')) {
            $columns = ['bookings.*'];

            return $columns;
        }

        $columns = array_map(
            fn (string $column) => 'bookings.' . $column,
            array_values(array_diff(Schema::getColumnListing('bookings'), ['survey_proof_image']))
        );

        return $columns;
    }

    protected function baseBookingQuery(): Builder
    {
        $query = Booking::query()->select($this->bookingSelectColumns());

        if (! auth()->check()) {
            return $query->whereRaw('1 = 0');
        }

        $request = request();

        if (WorkspaceAccess::isStaffLike($request)) {
            return $query;
        }

        return WorkspaceAccess::applyBookingVisibility($request, $query);
    }

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $this->syncLifecycleStatuses();

        $base = $this->baseBookingQuery()->with([
            'service.serviceType',
            'bookingServices.service.serviceType',
            'createdBy',
        ]);

        if (Schema::hasTable('booking_views')) {
            $base->with('views');
        }

        $query = $this->applyFilters($base, $filters);
        $query = $this->applySort($query, $filters);

        return $query->paginate($perPage)->withQueryString();
    }

    protected function applySort(Builder $query, array $filters): Builder
    {
        $sort = strtolower((string) ($filters['sort'] ?? ''));

        if ($sort === '') {
            $sort = WorkspaceAccess::isClient(request()) ? 'newest' : 'upcoming';
        }

        $now = Carbon::now();

        $bucketSql = "
            CASE
                WHEN bookings.booking_date_from <= ? AND bookings.booking_date_to > ? THEN 0
                WHEN bookings.booking_date_from > ? THEN 1
                ELSE 2
            END
        ";

        $applyUnviewedFirst = function () use ($query): void {
            $userId = auth()->id();

            if (! $userId || ! Schema::hasTable('booking_views')) {
                return;
            }

            $query->leftJoin('booking_views as bv', function ($join) use ($userId) {
                $join->on('bv.booking_id', '=', 'bookings.id')
                    ->where('bv.user_id', '=', $userId);
            });

            $query->select($this->bookingSelectColumns());

            $trackingStartedAt = auth()->user()->bookings_view_tracking_started_at ?? null;

            if ($trackingStartedAt) {
                $query->orderByRaw(
                    'CASE WHEN bv.id IS NULL AND bookings.created_at >= ? THEN 0 ELSE 1 END ASC',
                    [$trackingStartedAt]
                );
            } else {
                $query->orderByRaw('CASE WHEN bv.id IS NULL THEN 0 ELSE 1 END ASC');
            }
        };

        return match ($sort) {
            'newest' => $query
                ->orderByDesc('bookings.created_at')
                ->orderByDesc('bookings.id'),

            'oldest' => $query
                ->orderBy('bookings.created_at')
                ->orderBy('bookings.id'),

            'farthest' => $query
                ->orderByDesc('bookings.booking_date_from')
                ->orderByDesc('bookings.created_at')
                ->orderByDesc('bookings.id'),

            'guests_desc' => $query
                ->orderByDesc('bookings.number_of_guests')
                ->orderBy('bookings.booking_date_from')
                ->orderByDesc('bookings.created_at')
                ->orderByDesc('bookings.id'),

            'ending_soon' => $query
                ->orderByRaw($bucketSql . ' ASC', [$now, $now, $now])
                ->orderByRaw(
                    'CASE WHEN bookings.booking_date_from <= ? AND bookings.booking_date_to > ? THEN bookings.booking_date_to END ASC',
                    [$now, $now]
                )
                ->orderByRaw(
                    'CASE WHEN bookings.booking_date_from > ? THEN bookings.booking_date_to END ASC',
                    [$now]
                )
                ->orderByRaw(
                    'CASE WHEN bookings.booking_date_to <= ? THEN bookings.booking_date_to END DESC',
                    [$now]
                )
                ->orderByDesc('bookings.created_at')
                ->orderByDesc('bookings.id'),

            'priority', 'unviewed_first' => tap($query, $applyUnviewedFirst)
                ->orderByRaw("
                    CASE bookings.booking_status
                        WHEN 'pending' THEN 0
                        WHEN 'pencil_booked' THEN 1
                        WHEN 'for_review' THEN 2
                        WHEN 'active' THEN 3
                        WHEN 'confirmed' THEN 4
                        WHEN 'completed' THEN 5
                        WHEN 'cancelled' THEN 6
                        WHEN 'declined' THEN 7
                        ELSE 99
                    END ASC
                ")
                ->orderByRaw($bucketSql . ' ASC', [$now, $now, $now])
                ->orderByRaw(
                    'CASE WHEN bookings.booking_date_from <= ? AND bookings.booking_date_to > ? THEN bookings.booking_date_to END ASC',
                    [$now, $now]
                )
                ->orderByRaw(
                    'CASE WHEN bookings.booking_date_from > ? THEN bookings.booking_date_from END ASC',
                    [$now]
                )
                ->orderByRaw(
                    'CASE WHEN bookings.booking_date_to <= ? THEN bookings.booking_date_from END DESC',
                    [$now]
                )
                ->orderByDesc('bookings.created_at')
                ->orderByDesc('bookings.id'),

            default => $query
                ->orderByRaw($bucketSql . ' ASC', [$now, $now, $now])
                ->orderByRaw(
                    'CASE WHEN bookings.booking_date_from <= ? AND bookings.booking_date_to > ? THEN bookings.booking_date_to END ASC',
                    [$now, $now]
                )
                ->orderByRaw(
                    'CASE WHEN bookings.booking_date_from > ? THEN bookings.booking_date_from END ASC',
                    [$now]
                )
                ->orderByRaw(
                    'CASE WHEN bookings.booking_date_to <= ? THEN bookings.booking_date_from END DESC',
                    [$now]
                )
                ->orderByDesc('bookings.created_at')
                ->orderByDesc('bookings.id'),
        };
    }

    public function create(array $data): Booking
    {
        return DB::transaction(function () use ($data) {
            $items = $this->normalizedBookingItems($data);
            $extraSchedules = $this->normalizedExtraSchedules($data);
            $bookingData = $this->onlyBookingColumns($data);

            $this->normalizeContactFields($bookingData);
            $this->normalizeStatusFields($bookingData);

            $user = auth()->user();

            if ($user) {
                $bookingData['created_by_user_id'] = $user->id;
            }

            if ($user && ! WorkspaceAccess::isStaffLike(request())) {
                $bookingData['client_email'] = strtolower(trim((string) $user->email));
                $bookingData['booking_status'] = 'pencil_booked';
                $bookingData['payment_status'] = 'unpaid';
            }

            $bookingData['payment_status'] = BookingStatusCatalog::normalizeBookingPaymentStatus($bookingData['payment_status'] ?? 'unpaid', 'unpaid');
            $bookingData['booking_status'] = BookingStatusCatalog::normalizeBookingStatus($bookingData['booking_status'] ?? 'pencil_booked', 'pencil_booked');

            if (empty($items)) {
                throw ValidationException::withMessages([
                    'items' => 'Please select at least one booking service.',
                    'service_id' => 'Please select a Service / rental option.',
                ]);
            }

            $bookingData['service_id'] = (int) ($items[0]['service_id'] ?? $bookingData['service_id'] ?? 0);

            $requestedAreas = $this->requestedAreaLabelsFromItems($items);

            if (empty($requestedAreas)) {
                throw ValidationException::withMessages([
                    'service_id' => 'The selected Service is not linked to a valid Service Type / venue area.',
                ]);
            }

            if (! empty($bookingData['booking_date_from']) && ! empty($bookingData['booking_date_to'])) {
                [$from, $to] = $this->normalizeRangeToPreferred(
                    (string) $bookingData['booking_date_from'],
                    (string) $bookingData['booking_date_to']
                );

                $this->assertTimeSlotAvailable($from, $to, $requestedAreas, null);

                $bookingData['booking_date_from'] = $from;
                $bookingData['booking_date_to'] = $to;
            }

            $this->assertGuestCapacityForItems((int) ($bookingData['number_of_guests'] ?? 0), $items);

            $booking = Booking::query()->create($bookingData);

            $this->syncItems($booking, $items);
            $this->recalculatePaymentStatus($booking);

            if (! empty($extraSchedules)) {
                $this->createExtraSchedules($booking->refresh(), $extraSchedules);
            }

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
                    'area_labels' => $requestedAreas,
                ],
            );

            return $booking;
        });
    }

    public function update(Booking $booking, array $data): Booking
    {
        return DB::transaction(function () use ($booking, $data) {
            $itemsWasSubmitted = array_key_exists('items', $data) || array_key_exists('service_id', $data);
            $items = $itemsWasSubmitted ? $this->normalizedBookingItems($data) : null;
            $extraSchedules = $this->normalizedExtraSchedules($data);
            $bookingData = $this->onlyBookingColumns($data);

            $this->normalizeContactFields($bookingData);
            $this->normalizeStatusFields($bookingData);

            $user = auth()->user();

            if ($user && ! WorkspaceAccess::isStaffLike(request())) {
                $allowed = [
                    'client_name',
                    'company_name',
                    'client_contact_number',
                    'client_email',
                    'survey_email',
                    'survey_proof_image_path',
                    'survey_proof_image_mime',
                    'survey_proof_image_name',
                    'client_address',
                    'client_region',
                    'client_province',
                    'client_city_municipality',
                    'client_barangay',
                    'client_zip_code',
                    'client_street_address',
                    'head_of_organization',
                    'type_of_event',
                    'number_of_guests',
                ];

                $bookingData = array_intersect_key($bookingData, array_flip($allowed));
                $bookingData['client_email'] = strtolower(trim((string) $user->email));

                $items = null;
                $itemsWasSubmitted = false;
            }

            $itemsForChecks = $itemsWasSubmitted
                ? ($items ?? [])
                : $this->existingItemsForCapacity($booking);

            $requestedAreas = $this->requestedAreaLabelsFromItems($itemsForChecks);

            if (empty($requestedAreas)) {
                throw ValidationException::withMessages([
                    'items' => 'A booking must include at least one valid venue area.',
                ]);
            }

            if (! empty($bookingData['booking_date_from']) && ! empty($bookingData['booking_date_to'])) {
                [$from, $to] = $this->normalizeRangeToPreferred(
                    (string) $bookingData['booking_date_from'],
                    (string) $bookingData['booking_date_to']
                );

                $this->assertTimeSlotAvailable($from, $to, $requestedAreas, $booking->id);

                $bookingData['booking_date_from'] = $from;
                $bookingData['booking_date_to'] = $to;
            }

            $guestCount = array_key_exists('number_of_guests', $bookingData)
                ? (int) $bookingData['number_of_guests']
                : (int) $booking->number_of_guests;

            $this->assertGuestCapacityForItems($guestCount, $itemsForChecks);

            if ($itemsWasSubmitted && ! empty($items)) {
                $bookingData['service_id'] = (int) $items[0]['service_id'];
            }

            unset($bookingData['created_by_user_id']);

            $originalStatus = (string) ($booking->booking_status ?? '');
            $originalPaymentStatus = (string) ($booking->payment_status ?? '');
            $changedFields = $this->extractChangedFields($booking, $bookingData, $itemsWasSubmitted ? ($items ?? []) : null);

            $booking->fill($bookingData);
            $booking->save();

            if ($itemsWasSubmitted && is_array($items)) {
                $this->syncItems($booking, $items);
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
                meta: ['source' => 'booking_service.delete'],
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

        $statuses = ['pending', 'pencil_booked', 'for_review', 'active', 'confirmed', 'cancelled', 'declined', 'completed'];

        $result = ['all' => (clone $base)->count()];

        foreach ($statuses as $status) {
            $result[$status] = (clone $base)->where('booking_status', $status)->count();
        }

        return $result;
    }

    protected function applyFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->when(! empty($filters['booking_status']), function (Builder $q) use ($filters) {
                $q->where('booking_status', $filters['booking_status']);
            })
            ->when(! empty($filters['payment_status']), function (Builder $q) use ($filters) {
                $q->where('payment_status', $filters['payment_status']);
            })
            ->when(! empty($filters['service_id']), function (Builder $q) use ($filters) {
                $serviceId = (int) $filters['service_id'];

                $q->where(function (Builder $inner) use ($serviceId) {
                    $inner->where('service_id', $serviceId)
                        ->orWhereHas('bookingServices', fn (Builder $itemQuery) => $itemQuery->where('service_id', $serviceId));
                });
            })
            ->when(! empty($filters['q']), function (Builder $q) use ($filters) {
                $term = '%' . trim((string) $filters['q']) . '%';

                $q->where(function (Builder $q2) use ($term) {
                    $q2->where('client_name', 'like', $term)
                        ->orWhere('company_name', 'like', $term)
                        ->orWhere('client_email', 'like', $term)
                        ->orWhere('type_of_event', 'like', $term)
                        ->orWhere('public_calendar_title', 'like', $term);
                });
            })
            ->when(! empty($filters['date_from']), function (Builder $q) use ($filters) {
                $q->whereDate('booking_date_from', '>=', $filters['date_from']);
            })
            ->when(! empty($filters['date_to']), function (Builder $q) use ($filters) {
                $q->whereDate('booking_date_to', '<=', $filters['date_to']);
            });
    }

    protected function onlyBookingColumns(array $payload): array
    {
        unset(
            $payload['items'],
            $payload['extra_schedules'],
            $payload['service_type_id'],
            $payload['policy_acknowledged'],
            $payload['accuracy_acknowledged'],
            $payload['survey_proof_image']
        );

        if (! Schema::hasTable('bookings')) {
            return $payload;
        }

        $columns = array_flip(Schema::getColumnListing('bookings'));

        return array_intersect_key($payload, $columns);
    }

    protected function normalizeContactFields(array &$data): void
    {
        foreach (['client_email', 'survey_email'] as $field) {
            if (isset($data[$field])) {
                $data[$field] = strtolower(trim((string) $data[$field])) ?: null;
            }
        }

        if (isset($data['client_contact_number'])) {
            $digits = preg_replace('/\D+/', '', (string) $data['client_contact_number']);
            $data['client_contact_number'] = $digits ?: $data['client_contact_number'];
        }

        if (isset($data['is_public_calendar_visible'])) {
            $data['is_public_calendar_visible'] = filter_var($data['is_public_calendar_visible'], FILTER_VALIDATE_BOOL);
        }

        if (($data['is_public_calendar_visible'] ?? false) && empty($data['public_calendar_title'])) {
            $data['public_calendar_title'] = $data['type_of_event'] ?? null;
        }

        if (empty($data['client_address'])) {
            $data['client_address'] = collect([
                $data['client_street_address'] ?? null,
                $data['client_barangay'] ?? null,
                $data['client_city_municipality'] ?? null,
                $data['client_province'] ?? null,
                $data['client_region'] ?? null,
                $data['client_zip_code'] ?? null,
            ])->filter()->implode(', ');
        }
    }

    protected function normalizeStatusFields(array &$data): void
    {
        if (array_key_exists('booking_status', $data)) {
            $data['booking_status'] = BookingStatusCatalog::normalizeBookingStatus(
                is_string($data['booking_status']) ? $data['booking_status'] : (string) $data['booking_status'],
                'pencil_booked'
            );
        }

        if (array_key_exists('payment_status', $data)) {
            $data['payment_status'] = BookingStatusCatalog::normalizeBookingPaymentStatus(
                is_string($data['payment_status']) ? $data['payment_status'] : (string) $data['payment_status'],
                'unpaid'
            );
        }
    }

    protected function normalizedBookingItems(array $payload): array
    {
        $items = $payload['items'] ?? [];

        if (! is_array($items)) {
            $items = [];
        }

        if (empty($items) && ! empty($payload['service_id'])) {
            $items[] = [
                'service_id' => (int) $payload['service_id'],
                'quantity' => 1,
            ];
        }

        return $this->normalizeItemsForBooking($items);
    }

    protected function normalizedExtraSchedules(array $payload): array
    {
        $schedules = $payload['extra_schedules'] ?? [];

        if (! is_array($schedules)) {
            return [];
        }

        return collect($schedules)
            ->filter(fn ($row) => is_array($row) && ! empty($row['from']) && ! empty($row['to']))
            ->map(fn ($row) => [
                'from' => (string) $row['from'],
                'to' => (string) $row['to'],
            ])
            ->values()
            ->all();
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

            if ($serviceId < 1 || isset($seen[$serviceId])) {
                continue;
            }

            $seen[$serviceId] = true;

            $normalized[] = [
                'service_id' => $serviceId,
                'quantity' => max(1, (int) ($row['quantity'] ?? 1)),
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

        $services = Service::query()
            ->whereIn('id', $serviceIds->all())
            ->get()
            ->keyBy('id');

        $messages = [];

        foreach ($serviceIds as $serviceId) {
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
        if (! method_exists($booking, 'bookingServices')) {
            return;
        }

        $booking->bookingServices()->delete();

        foreach ($this->normalizeItemsForBooking($items) as $item) {
            $booking->bookingServices()->create([
                'service_id' => (int) $item['service_id'],
                'quantity' => max(1, (int) ($item['quantity'] ?? 1)),
            ]);
        }
    }

    public function recalculatePaymentStatus(Booking $booking): void
    {
        $booking->loadMissing(['bookingServices.service', 'payments']);

        $itemsTotal = $this->roundMoney($this->bookingItemsTotal($booking));
        $confirmedPaid = $this->roundMoney($this->confirmedPaymentTotal($booking));
        $submittedPaid = $this->roundMoney($this->submittedPaymentTotal($booking));

        if ($itemsTotal <= 0) {
            $newPaymentStatus = $confirmedPaid > 0 ? 'paid' : 'unpaid';
        } elseif ($confirmedPaid <= 0.0) {
            $newPaymentStatus = $submittedPaid > 0.0 ? 'for_review' : 'unpaid';
        } elseif ($confirmedPaid + 0.00001 >= $itemsTotal) {
            $newPaymentStatus = 'paid';
        } else {
            $newPaymentStatus = 'partial';
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
            ->whereNotIn('booking_status', ['cancelled'])
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

        if (in_array($currentStatus, ['cancelled'], true)) {
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

        if ($confirmedTotal + 0.00001 < $downPaymentRequired) {
            if ($downPaymentDeadline->lte($now)) {
                if ($submittedTotal > 0.0) {
                    return [
                        'status' => 'for_review',
                        'reason' => 'A payment was submitted but is still awaiting confirmation. Staff review is required before the booking can move forward.',
                    ];
                }

                return [
                    'status' => 'declined',
                    'reason' => 'The required 50% down payment was not confirmed within the first 24 hours.',
                ];
            }

            return [
                'status' => 'pencil_booked',
                'reason' => 'The booking is pencil booked and still inside the initial 24-hour window for the 50% down payment.',
            ];
        }

        if ($confirmedTotal + 0.00001 < $itemsTotal && $fullPaymentDeadline->lte($now)) {
            if ($submittedTotal > $confirmedTotal) {
                return [
                    'status' => 'for_review',
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
        return (string) ($this->determineAutomaticBookingDecision($booking)['status'] ?? 'pencil_booked');
    }

    public function paymentPolicySnapshot(Booking $booking): array
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
            'has_met_down_payment' => $itemsTotal <= 0 || ($confirmedTotal + 0.00001 >= $downRequired),
            'has_met_full_payment' => $itemsTotal <= 0 || ($confirmedTotal + 0.00001 >= $itemsTotal),
            'has_pending_review_payment' => $submittedTotal > $confirmedTotal,
            'snapshot_at' => $now,
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
            ->whereIn('status', ['confirmed', 'verified', 'approved', 'paid', 'completed', 'settled'])
            ->reduce(fn ($sum, $payment) => $sum + (float) $payment->amount, 0.0);
    }

    protected function submittedPaymentTotal(Booking $booking): float
    {
        return (float) $booking->payments
            ->whereIn('status', ['pending', 'submitted', 'for_review', 'confirmed', 'verified', 'approved', 'paid', 'completed', 'settled'])
            ->reduce(fn ($sum, $payment) => $sum + (float) $payment->amount, 0.0);
    }

    protected function extractChangedFields(Booking $booking, array $incomingData, ?array $newItems = null): array
    {
        $changed = [];

        foreach ($incomingData as $field => $newValue) {
            if ($field === 'updated_at') {
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

        foreach ($booking->payments ?? [] as $payment) {
            if (! empty($payment->proof_image_path)) {
                $paths[] = (string) $payment->proof_image_path;
            }
        }

        foreach (array_values(array_unique(array_filter($paths))) as $path) {
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

        $baseBooking->loadMissing(['bookingServices.service.serviceType']);

        $baseItems = $this->existingItemsForCapacity($baseBooking);
        $requestedAreas = $this->requestedAreaLabelsFromItems($baseItems);

        if (empty($requestedAreas)) {
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
            } catch (\Throwable) {
                continue;
            }

            if ($to->lessThanOrEqualTo($from)) {
                continue;
            }

            $this->assertTimeSlotAvailable($from, $to, $requestedAreas, null);

            $clone = $baseBooking->replicate();
            $clone->booking_date_from = $from;
            $clone->booking_date_to = $to;
            $clone->payment_status = 'unpaid';
            $clone->save();

            $this->syncItems($clone, $baseItems);
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
                    'area_labels' => $requestedAreas,
                ],
            );
        }
    }

    protected function normalizeRangeToPreferred(string $fromRaw, string $toRaw): array
    {
        $from = Carbon::parse($fromRaw);
        $to = Carbon::parse($toRaw);

        if ($to->format('H:i') === '00:00') {
            $isNextDay = $to->copy()->startOfDay()->equalTo($from->copy()->startOfDay()->addDay());

            if ($isNextDay && in_array($from->format('H:i'), ['06:00', '12:00', '18:00'], true)) {
                $to = $from->copy()->setTime(23, 59, 0);
            }
        }

        return [$from, $to];
    }

    protected function assertTimeSlotAvailable(Carbon $from, Carbon $to, array $requestedAreaLabels = [], ?int $ignoreBookingId = null): void
    {
        if ($to->lte($from)) {
            throw ValidationException::withMessages([
                'booking_date_to' => 'End date & time must be after start date & time.',
            ]);
        }

        $normalizedAreaLabels = collect($requestedAreaLabels)
            ->filter()
            ->map(fn ($value) => (string) $value)
            ->unique()
            ->values()
            ->all();

        if (empty($normalizedAreaLabels)) {
            throw ValidationException::withMessages([
                'service_id' => 'Please select a valid Service Type / venue area before checking availability.',
            ]);
        }

        $conflictingBooking = Booking::query()
            ->with(['bookingServices.service.serviceType', 'service.serviceType'])
            ->whereIn('booking_status', $this->blockingBookingStatuses())
            ->when($ignoreBookingId, fn (Builder $query) => $query->where('id', '!=', $ignoreBookingId))
            ->where('booking_date_from', '<', $this->endForOverlap($to))
            ->where('booking_date_to', '>', $from)
            ->get()
            ->first(fn (Booking $booking) => $this->bookingOverlapsRequestedAreas($booking, $normalizedAreaLabels));

        if ($conflictingBooking) {
            throw ValidationException::withMessages([
                'booking_date_from' => 'This schedule overlaps an existing confirmed or active booking for the same venue area.',
            ]);
        }

        if (Schema::hasTable('calendar_blocks')) {
            $fromDate = $from->copy()->startOfDay();
            $toDate = $to->copy()->startOfDay();

            $blocks = CalendarBlock::query()
                ->whereDate('date_to', '>=', $fromDate->format('Y-m-d'))
                ->whereDate('date_from', '<=', $toDate->format('Y-m-d'))
                ->get();

            foreach ($blocks as $block) {
                $blockStartDate = Carbon::parse($block->date_from)->startOfDay();
                $blockEndDate = Carbon::parse($block->date_to)->startOfDay();

                for ($cursor = $blockStartDate->copy(); $cursor->lte($blockEndDate); $cursor->addDay()) {
                    [$blockFrom, $blockTo] = $this->calendarBlockIntervalForDate((string) ($block->block ?? 'DAY'), $cursor);

                    if (! $this->overlaps($from, $this->endForOverlap($to), $blockFrom, $blockTo)) {
                        continue;
                    }

                    foreach ($normalizedAreaLabels as $area) {
                        if ($this->areasOverlap((string) ($block->area ?? ''), $area)) {
                            throw ValidationException::withMessages([
                                'booking_date_from' => 'This schedule overlaps an admin calendar block for the selected venue area.',
                            ]);
                        }
                    }
                }
            }
        }
    }

    private function endForOverlap(Carbon $to): Carbon
    {
        return ($to->hour === 23 && $to->minute === 59)
            ? $to->copy()->addMinute()
            : $to->copy();
    }

    private function overlaps(Carbon $aStart, Carbon $aEnd, Carbon $bStart, Carbon $bEnd): bool
    {
        return $aStart->lt($bEnd) && $aEnd->gt($bStart);
    }

    private function calendarBlockIntervalForDate(string $block, Carbon $day): array
    {
        $block = strtoupper(trim($block));

        return match ($block) {
            'AM' => [$day->copy()->setTime(6, 0), $day->copy()->setTime(12, 0)],
            'PM' => [$day->copy()->setTime(12, 0), $day->copy()->setTime(18, 0)],
            'EVE' => [$day->copy()->setTime(18, 0), $day->copy()->addDay()->startOfDay()],
            default => [$day->copy()->setTime(6, 0), $day->copy()->addDay()->startOfDay()],
        };
    }

    private function buildAvailabilityBlocks(Carbon $day, array $sourceIntervals): array
    {
        $blocks = [
            'AM' => [
                'key' => 'AM',
                'label' => 'Morning',
                'from' => '06:00',
                'to' => '12:00',
                'start' => $day->copy()->setTime(6, 0),
                'end' => $day->copy()->setTime(12, 0),
            ],
            'PM' => [
                'key' => 'PM',
                'label' => 'Afternoon',
                'from' => '12:00',
                'to' => '18:00',
                'start' => $day->copy()->setTime(12, 0),
                'end' => $day->copy()->setTime(18, 0),
            ],
            'EVE' => [
                'key' => 'EVE',
                'label' => 'Evening',
                'from' => '18:00',
                'to' => '23:59',
                'start' => $day->copy()->setTime(18, 0),
                'end' => $day->copy()->addDay()->startOfDay(),
            ],
        ];

        foreach ($blocks as $key => $block) {
            $booked = false;
            $blocked = false;
            $reasons = [];

            foreach ($sourceIntervals as $interval) {
                if (! $this->overlaps($interval['from'], $interval['to'], $block['start'], $block['end'])) {
                    continue;
                }

                $source = (string) ($interval['source'] ?? 'booking');

                if ($source === 'calendar_block') {
                    $blocked = true;
                } else {
                    $booked = true;
                }

                $reason = trim((string) ($interval['reason'] ?? ''));

                if ($reason !== '') {
                    $reasons[] = $reason;
                }
            }

            unset($blocks[$key]['start'], $blocks[$key]['end']);

            $isAvailable = ! $booked && ! $blocked;

            $blocks[$key]['is_available'] = $isAvailable;
            $blocks[$key]['isAvailable'] = $isAvailable;
            $blocks[$key]['booked'] = $booked;
            $blocks[$key]['blocked'] = $blocked;
            $blocks[$key]['reason'] = $isAvailable
                ? null
                : (array_values(array_unique($reasons))[0] ?? ($blocked ? 'Blocked by admin calendar' : 'Reserved by booking'));
        }

        return $blocks;
    }

    public function getDailyAvailability(string $date, $excludeBookingId = null, ?string $area = null): array
    {
        $day = Carbon::createFromFormat('Y-m-d', $date)->startOfDay();
        $dayStart = $day->copy()->setTime(6, 0);
        $dayEnd = $day->copy()->addDay()->startOfDay();

        $intervals = [];

        $bookings = Booking::query()
            ->with(['bookingServices.service.serviceType', 'service.serviceType'])
            ->whereIn('booking_status', $this->blockingBookingStatuses())
            ->when($excludeBookingId, fn (Builder $query) => $query->where('id', '!=', $excludeBookingId))
            ->where('booking_date_from', '<', $dayEnd)
            ->where('booking_date_to', '>', $dayStart)
            ->get()
            ->filter(function (Booking $booking) use ($area) {
                return ! $area || $this->bookingMatchesArea($booking, $area);
            })
            ->values();

        foreach ($bookings as $booking) {
            $start = Carbon::parse($booking->booking_date_from);
            $end = $this->endForOverlap(Carbon::parse($booking->booking_date_to));

            if ($end->lte($dayStart) || $start->gte($dayEnd)) {
                continue;
            }

            $from = $start->gt($dayStart) ? $start : $dayStart->copy();
            $to = $end->lt($dayEnd) ? $end : $dayEnd->copy();

            if ($to->gt($from)) {
                $intervals[] = [
                    'from' => $from,
                    'to' => $to,
                    'source' => 'booking',
                    'reason' => trim((string) ($booking->public_calendar_title ?: $booking->type_of_event ?: $booking->company_name ?: 'Reserved by booking')),
                ];
            }
        }

        if (Schema::hasTable('calendar_blocks')) {
            $calendarBlocks = CalendarBlock::query()
                ->whereDate('date_from', '<=', $day->format('Y-m-d'))
                ->whereDate('date_to', '>=', $day->format('Y-m-d'))
                ->get(['id', 'title', 'block', 'area', 'public_status', 'notes']);

            if ($area) {
                $calendarBlocks = $calendarBlocks
                    ->filter(fn (CalendarBlock $block) => $this->areasOverlap((string) ($block->area ?? ''), $area))
                    ->values();
            }

            foreach ($calendarBlocks as $block) {
                [$blockStart, $blockEnd] = $this->calendarBlockIntervalForDate((string) ($block->block ?? 'DAY'), $day);

                $from = $blockStart->gt($dayStart) ? $blockStart : $dayStart->copy();
                $to = $blockEnd->lt($dayEnd) ? $blockEnd : $dayEnd->copy();

                if ($to->gt($from)) {
                    $status = strtolower((string) ($block->public_status ?? 'red'));
                    $label = match ($status) {
                        'blue' => 'Public calendar block',
                        'gold' => 'Private calendar reservation',
                        default => 'Blocked by admin calendar',
                    };

                    $title = trim((string) ($block->title ?? ''));
                    $intervals[] = [
                        'from' => $from,
                        'to' => $to,
                        'source' => 'calendar_block',
                        'reason' => $title !== '' ? $title : $label,
                        'public_status' => $status,
                    ];
                }
            }
        }

        $merged = $this->mergeIntervals($intervals);

        $busy = collect($merged)
            ->map(fn ($interval) => [
                'from' => $interval['from']->format('H:i'),
                'to' => $interval['to']->equalTo($dayEnd) ? '23:59' : $interval['to']->format('H:i'),
            ])
            ->values()
            ->all();

        $free = [];
        $cursor = $dayStart->copy();

        foreach ($merged as $interval) {
            if ($interval['from']->gt($cursor)) {
                $free[] = [
                    'from' => $cursor->format('H:i'),
                    'to' => $interval['from']->format('H:i'),
                ];
            }

            if ($interval['to']->gt($cursor)) {
                $cursor = $interval['to']->copy();
            }
        }

        if ($cursor->lt($dayEnd)) {
            $free[] = [
                'from' => $cursor->format('H:i'),
                'to' => '23:59',
            ];
        }

        if (empty($busy)) {
            $free = [['from' => '06:00', 'to' => '23:59']];
        }

        $blocks = $this->buildAvailabilityBlocks($day, $intervals);

        $isFullyBooked = ! $blocks['AM']['is_available']
            && ! $blocks['PM']['is_available']
            && ! $blocks['EVE']['is_available'];

        return [
            'date' => $day->format('Y-m-d'),
            'venue' => $area,
            'busy' => $busy,
            'free' => $free,
            'blocks' => $blocks,
            'is_fully_booked' => $isFullyBooked,
        ];
    }

    protected function mergeIntervals(array $intervals): array
    {
        if (empty($intervals)) {
            return [];
        }

        usort($intervals, fn ($a, $b) => $a['from']->getTimestamp() <=> $b['from']->getTimestamp());

        $merged = [];

        foreach ($intervals as $interval) {
            if (empty($merged)) {
                $merged[] = $interval;
                continue;
            }

            $lastIndex = count($merged) - 1;
            $last = $merged[$lastIndex];

            if ($interval['from']->lte($last['to'])) {
                if ($interval['to']->gt($last['to'])) {
                    $merged[$lastIndex]['to'] = $interval['to'];
                }
            } else {
                $merged[] = $interval;
            }
        }

        return $merged;
    }

    public function getDashboardMonthAvailability(Carbon|string $month): array
    {
        $start = $month instanceof Carbon
            ? $month->copy()->startOfMonth()
            : Carbon::createFromFormat('Y-m', (string) $month)->startOfMonth();

        $end = $start->copy()->endOfMonth();

        $publicEventDays = PublicEvent::query()
            ->where('is_public', true)
            ->whereDate('event_date', '>=', $start->format('Y-m-d'))
            ->whereDate('event_date', '<=', $end->format('Y-m-d'))
            ->pluck('event_date')
            ->map(fn ($value) => Carbon::parse($value)->format('Y-m-d'))
            ->flip();

        $blockFlagsByDate = [];

        if (Schema::hasTable('calendar_blocks')) {
            CalendarBlock::query()
                ->whereDate('date_to', '>=', $start->format('Y-m-d'))
                ->whereDate('date_from', '<=', $end->format('Y-m-d'))
                ->get(['date_from', 'date_to', 'public_status'])
                ->each(function (CalendarBlock $block) use (&$blockFlagsByDate, $start, $end) {
                    $rangeStart = Carbon::parse($block->date_from)->startOfDay();
                    $rangeEnd = Carbon::parse($block->date_to)->startOfDay();

                    if ($rangeStart->lt($start)) {
                        $rangeStart = $start->copy()->startOfDay();
                    }

                    if ($rangeEnd->gt($end)) {
                        $rangeEnd = $end->copy()->startOfDay();
                    }

                    $status = strtolower((string) ($block->public_status ?? 'red'));

                    for ($cursor = $rangeStart->copy(); $cursor->lte($rangeEnd); $cursor->addDay()) {
                        $key = $cursor->format('Y-m-d');
                        $blockFlagsByDate[$key] ??= [
                            'red' => false,
                            'blue' => false,
                            'gold' => false,
                        ];

                        if (array_key_exists($status, $blockFlagsByDate[$key])) {
                            $blockFlagsByDate[$key][$status] = true;
                        }
                    }
                });
        }

        $monthAvailability = [];

        for ($day = $start->copy(); $day->lte($end); $day->addDay()) {
            $dateKey = $day->format('Y-m-d');
            $availability = $this->getDailyAvailability($dateKey);
            $flags = $blockFlagsByDate[$dateKey] ?? ['red' => false, 'blue' => false, 'gold' => false];

            $availableBlockCount = collect($availability['blocks'] ?? [])
                ->filter(fn ($block) => (bool) data_get($block, 'is_available', false))
                ->count();

            $status = 'available';

            if ($flags['red']) {
                $status = 'blocked';
            } elseif ($flags['blue'] || $publicEventDays->has($dateKey)) {
                $status = 'public_booked';
            } elseif ($flags['gold'] || (bool) ($availability['is_fully_booked'] ?? false)) {
                $status = 'private_booked';
            } elseif ($availableBlockCount < 3) {
                $status = 'limited';
            }

            $monthAvailability[$dateKey] = [
                'date' => $dateKey,
                'day_status' => $status,
                'AM' => (bool) data_get($availability, 'blocks.AM.is_available', true),
                'PM' => (bool) data_get($availability, 'blocks.PM.is_available', true),
                'EVE' => (bool) data_get($availability, 'blocks.EVE.is_available', true),
                'is_fully_booked' => (bool) ($availability['is_fully_booked'] ?? false),
            ];
        }

        return $monthAvailability;
    }

    public function calendarAreaOptions(): array
    {
        return [
            'FULL HALL',
            'MAIN HALL',
            'FOYER & LOBBY AREA',
            'VIP LOUNGE',
            'BOARD ROOM',
            'BASEMENT',
            'GALLERY2600',
        ];
    }

    public function getDashboardDayStatus(string $date): array
    {
        $availability = $this->getDailyAvailability($date);

        $publicEventsExist = PublicEvent::query()
            ->where('is_public', true)
            ->whereDate('event_date', $date)
            ->exists();

        $calendarBlocks = Schema::hasTable('calendar_blocks')
            ? CalendarBlock::query()
                ->whereDate('date_from', '<=', $date)
                ->whereDate('date_to', '>=', $date)
                ->get(['public_status'])
            : collect();

        $hasRedBlock = $calendarBlocks->contains(fn (CalendarBlock $block) => strtolower((string) ($block->public_status ?? '')) === 'red');
        $hasBlueBlock = $calendarBlocks->contains(fn (CalendarBlock $block) => strtolower((string) ($block->public_status ?? '')) === 'blue');
        $hasGoldBlock = $calendarBlocks->contains(fn (CalendarBlock $block) => strtolower((string) ($block->public_status ?? '')) === 'gold');

        $availableBlockCount = collect($availability['blocks'] ?? [])
            ->filter(fn ($block) => (bool) data_get($block, 'is_available', false))
            ->count();

        $status = 'available';

        if ($hasRedBlock) {
            $status = 'blocked';
        } elseif ($hasBlueBlock || $publicEventsExist) {
            $status = 'public_booked';
        } elseif ($hasGoldBlock || (bool) ($availability['is_fully_booked'] ?? false)) {
            $status = 'private_booked';
        } elseif ($availableBlockCount < 3) {
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
        ?int $guestCount = null,
    ): array {
        $availability = $this->getDailyAvailability($date, $excludeBookingId, $area);

        $dayStart = Carbon::parse($date)->startOfDay();
        $dayEnd = $dayStart->copy()->addDay();

        $events = PublicEvent::query()
            ->where('is_public', true)
            ->whereDate('event_date', $date)
            ->get()
            ->filter(fn (PublicEvent $event) => ! $area || $this->areasOverlap((string) ($event->venue ?? ''), $area))
            ->values();

        $publicVisibleBookingsQuery = Booking::query()
            ->with(['bookingServices.service.serviceType', 'service.serviceType'])
            ->whereIn('booking_status', $this->blockingBookingStatuses())
            ->where('booking_date_from', '<', $dayEnd)
            ->where('booking_date_to', '>', $dayStart);

        if (Schema::hasColumn('bookings', 'is_public_calendar_visible')) {
            $publicVisibleBookingsQuery->where('is_public_calendar_visible', true);
        }

        $publicVisibleBookings = $publicVisibleBookingsQuery
            ->get()
            ->filter(fn (Booking $booking) => ! $area || $this->bookingMatchesArea($booking, $area))
            ->values();

        $calendarBlocks = Schema::hasTable('calendar_blocks')
            ? CalendarBlock::query()
                ->whereDate('date_from', '<=', $date)
                ->whereDate('date_to', '>=', $date)
                ->get()
                ->filter(fn (CalendarBlock $block) => ! $area || $this->areasOverlap((string) ($block->area ?? ''), $area))
                ->values()
            : collect();

        $hasRedBlock = $calendarBlocks->contains(fn (CalendarBlock $block) => strtolower((string) ($block->public_status ?? '')) === 'red');
        $hasBlueBlock = $calendarBlocks->contains(fn (CalendarBlock $block) => strtolower((string) ($block->public_status ?? '')) === 'blue');
        $hasGoldBlock = $calendarBlocks->contains(fn (CalendarBlock $block) => strtolower((string) ($block->public_status ?? '')) === 'gold');

        $availableBlockCount = collect($availability['blocks'] ?? [])
            ->filter(fn ($block) => (bool) data_get($block, 'is_available', false))
            ->count();

        $closedBlockCount = max(0, 3 - $availableBlockCount);
        $isFullyBooked = $availableBlockCount === 0 || (bool) ($availability['is_fully_booked'] ?? false);

        $capacitySummary = $this->summarizePublicCapacityForArea($area, $guestCount);
        $eventProfile = $this->profilePublicEventType($eventType);

        $status = 'available';

        if ($isFullyBooked) {
            if ($hasRedBlock) {
                $status = 'blocked';
            } elseif ($hasBlueBlock || $events->isNotEmpty() || $publicVisibleBookings->isNotEmpty()) {
                $status = 'public_booked';
            } else {
                $status = 'private_booked';
            }
        } elseif ($hasRedBlock || $hasGoldBlock || $closedBlockCount > 0) {
            $status = 'limited';
        } elseif ($hasBlueBlock || $events->isNotEmpty() || $publicVisibleBookings->isNotEmpty()) {
            $status = 'public_booked';
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
            $description = 'This date is marked for a public-facing activity for the selected venue.';
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

        $canProceed = $availableBlockCount > 0 && ! in_array($status, ['blocked', 'private_booked'], true);

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
            'event_titles' => $events->pluck('title')
                ->merge($publicVisibleBookings->map(fn (Booking $booking) => trim((string) ($booking->public_calendar_title ?: $booking->type_of_event ?: $booking->company_name ?: 'Public booking'))))
                ->filter()
                ->values()
                ->all(),
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

        $services = Service::query()
            ->with('serviceType')
            ->orderBy('name')
            ->get()
            ->filter(fn (Service $service) =>
                $this->areasOverlap((string) ($service->name ?? ''), $area)
                || $this->areasOverlap((string) ($service->serviceType?->name ?? ''), $area)
            )
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

    private function canonicalAreaKey(?string $value): string
    {
        return VenueAreaCatalog::canonicalKey($value);
    }

    private function normalizeAreaLabel(?string $value): string
    {
        return VenueAreaCatalog::normalizeLabel($value);
    }

    private function isWholeVenueLabel(?string $value): bool
    {
        return VenueAreaCatalog::isWholeVenue($value);
    }

    private function areaOverlapMatrix(): array
    {
        return VenueAreaCatalog::matrix();
    }

    private function areasOverlap(?string $candidate, ?string $selected): bool
    {
        return VenueAreaCatalog::overlaps($candidate, $selected);
    }

    private function bookingMatchesArea(Booking $booking, string $area): bool
    {
        $booking->loadMissing(['bookingServices.service.serviceType', 'service.serviceType']);

        foreach ($booking->bookingServices ?? [] as $item) {
            $service = $item->service;

            if (! $service) {
                continue;
            }

            if (
                $this->areasOverlap((string) ($service->name ?? ''), $area)
                || $this->areasOverlap((string) ($service->serviceType?->name ?? ''), $area)
            ) {
                return true;
            }
        }

        if ($booking->service) {
            return $this->areasOverlap((string) ($booking->service->name ?? ''), $area)
                || $this->areasOverlap((string) ($booking->service->serviceType?->name ?? ''), $area);
        }

        return false;
    }

    protected function requestedAreaLabelsFromItems(array $items): array
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
            ->flatMap(function (Service $service) {
                return [
                    (string) ($service->serviceType?->name ?? ''),
                    (string) ($service->name ?? ''),
                ];
            })
            ->filter(fn ($label) => $this->canonicalAreaKey($label) !== '')
            ->unique()
            ->values()
            ->all();
    }

    protected function extractAreaLabelsFromBooking(Booking $booking): array
    {
        $booking->loadMissing(['bookingServices.service.serviceType', 'service.serviceType']);

        $labels = collect();

        foreach ($booking->bookingServices ?? [] as $item) {
            if ($item->service) {
                $labels->push((string) ($item->service->serviceType?->name ?? ''));
                $labels->push((string) ($item->service->name ?? ''));
            }
        }

        if ($booking->service) {
            $labels->push((string) ($booking->service->serviceType?->name ?? ''));
            $labels->push((string) ($booking->service->name ?? ''));
        }

        return $labels
            ->filter(fn ($label) => $this->canonicalAreaKey($label) !== '')
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

    public function getUnavailableDates(?int $excludeBookingId = null): array
    {
        $bookings = Booking::query()
            ->whereIn('booking_status', $this->blockingBookingStatuses())
            ->when($excludeBookingId, fn (Builder $query) => $query->where('id', '!=', $excludeBookingId))
            ->whereNotNull('booking_date_from')
            ->whereNotNull('booking_date_to')
            ->get(['id', 'booking_date_from', 'booking_date_to']);

        $unavailable = [];

        foreach ($bookings as $booking) {
            $from = Carbon::parse($booking->booking_date_from)->startOfDay();
            $to = Carbon::parse($booking->booking_date_to)->startOfDay();

            for ($cursor = $from->copy(); $cursor->lte($to); $cursor->addDay()) {
                $unavailable[$cursor->format('Y-m-d')] = true;
            }
        }

        if (Schema::hasTable('calendar_blocks')) {
            CalendarBlock::query()
                ->get(['date_from', 'date_to'])
                ->each(function (CalendarBlock $block) use (&$unavailable) {
                    $from = Carbon::parse($block->date_from)->startOfDay();
                    $to = Carbon::parse($block->date_to)->startOfDay();

                    for ($cursor = $from->copy(); $cursor->lte($to); $cursor->addDay()) {
                        $unavailable[$cursor->format('Y-m-d')] = true;
                    }
                });
        }

        return array_keys($unavailable);
    }
}
