<?php

namespace App\Http\Requests;

use App\Models\Booking;
use Carbon\Carbon;
use DateTimeInterface;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBookingRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $payload = $this->all();

        [$fromN, $toN] = $this->normalizeSchedulePair(
            $payload['booking_date_from'] ?? null,
            $payload['booking_date_to'] ?? null
        );

        $payload['booking_date_from'] = $fromN;
        $payload['booking_date_to']   = $toN;

        
        if (isset($payload['extra_schedules']) && is_array($payload['extra_schedules'])) {
            foreach ($payload['extra_schedules'] as $i => $row) {
                if (!is_array($row)) continue;

                [$ef, $et] = $this->normalizeSchedulePair(
                    $row['from'] ?? null,
                    $row['to'] ?? null
                );

                $payload['extra_schedules'][$i]['from'] = $ef;
                $payload['extra_schedules'][$i]['to']   = $et;
            }
        }

        if (isset($payload['items']) && is_array($payload['items'])) {
    $seen = [];
    $normalizedItems = [];

    foreach ($payload['items'] as $row) {
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

        $normalizedItems[] = [
            'service_id' => $serviceId,
            'quantity' => 1,
        ];
    }

    $payload['items'] = $normalizedItems;
}

        $this->merge($payload);
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Booking|null $booking */
        $booking = $this->route('booking');
        if (!$booking instanceof Booking) {
            $booking = null;
        }

        // ✅ Proof required only if there is NO existing proof yet (disk OR blob)
        $proofRequired = !$booking || (
            empty($booking->survey_proof_image_path)
            && empty($booking->survey_proof_image_name)
            && empty($booking->survey_proof_image)
        );

        $proofRule = $proofRequired
            ? ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120']
            : ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'];

        return [
            'service_id' => ['nullable', 'integer', 'exists:services,id'],

            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.service_id' => ['required', 'integer', 'exists:services,id'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],

            'company_name' => ['nullable', 'string', 'max:255'],
            'client_name' => ['required', 'string', 'max:255'],
            'client_contact_number' => ['required', 'string', 'max:255'],
            'client_email' => ['required', 'string', 'email', 'max:255'],

            'survey_email' => ['required', 'string', 'email', 'max:255'],
            'survey_proof_image' => $proofRule,

            'client_address' => ['required', 'string', 'max:255'],
            'head_of_organization' => ['nullable', 'string', 'max:255'],

            'type_of_event' => ['required', 'string', 'max:255'],

            'booking_date_from' => ['required', 'date'],
            'booking_date_to'   => ['required', 'date', 'after:booking_date_from'],

            'extra_schedules' => ['sometimes', 'array'],
            'extra_schedules.*' => ['array'],
            'extra_schedules.*.from' => ['required_with:extra_schedules.*.to', 'date'],
            'extra_schedules.*.to'   => ['required_with:extra_schedules.*.from', 'date'],

            'number_of_guests' => ['required', 'integer', 'min:0'],

            'booking_status' => ['required', 'in:pending,active,confirmed,cancelled,declined,completed'],
            'payment_status' => ['sometimes', 'in:unpaid,partial,paid,owing'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $isAdmin  = $this->isAdminUser();
            $isStaff  = $this->isStaffUser();
            $isClient = $this->isClientUser();

            /** @var Booking|null $booking */
            $booking = $this->route('booking');
            if (!$booking instanceof Booking) $booking = null;

            /**
             * ✅ CLIENT RULES (per your request)
             * Clients CAN edit:
             * - client_name, company_name, contact, email, address
             * - head_of_organization
             * - type_of_event
             * - number_of_guests
             * - survey_email + survey_proof_image (upload/replace)
             *
             * Clients CANNOT edit:
             * - schedule (booking_date_from/to)
             * - booking_status
             * - services/items
             * - payment_status
             */
            if ($isClient && !$isStaff && $booking) {
                if ($this->filled('items')) {
                    $validator->errors()->add('items', 'Clients cannot modify services/items. Please contact staff.');
                }

                // Optional hardening: do not allow changing selected service_id
                if ($this->filled('service_id') && (string) $this->input('service_id') !== (string) $booking->service_id) {
                    $validator->errors()->add('service_id', 'Clients cannot change selected service. Please contact staff.');
                }

                // ✅ FIX: canonicalSchedule now supports Carbon/DateTime (DB values) properly
                $reqCanon = $this->canonicalSchedule($this->input('booking_date_from'), $this->input('booking_date_to'));
                $dbCanon  = $this->canonicalSchedule($booking->booking_date_from, $booking->booking_date_to);

                if ($reqCanon !== $dbCanon) {
                    $validator->errors()->add('booking_date_from', 'Clients cannot change the booking schedule. Please contact staff.');
                }

                if (strtolower((string) $this->input('booking_status')) !== strtolower((string) $booking->booking_status)) {
                    $validator->errors()->add('booking_status', 'Clients cannot change booking status.');
                }

                if ($this->filled('payment_status')) {
                    $validator->errors()->add('payment_status', 'Payment status is managed by the system.');
                }

                return;
            }

            // Staff/admin: validate schedule blocks + DB conflicts
            $mainFrom = $this->parseDateTime($this->input('booking_date_from'));
            $mainTo   = $this->parseDateTime($this->input('booking_date_to'));

            if ($mainFrom && $mainTo) {
                $msg = $this->validateBlockRange($mainFrom, $mainTo, $isAdmin);
                if ($msg) {
                    $validator->errors()->add('booking_date_to', $msg);
                } else {
                    $excludeId = $booking?->id;
                    $conflict = $this->findConflict($mainFrom, $mainTo, $excludeId);
                    if ($conflict) {
                        $validator->errors()->add(
                            'booking_date_from',
                            'This schedule overlaps an existing CONFIRMED/ACTIVE booking. Please choose another date/block.'
                        );
                    }
                }
            }

            // Extra schedules (if used in update)
            $extras = $this->input('extra_schedules', []);
            $extraIntervals = [];

            if (is_array($extras)) {
                foreach ($extras as $idx => $s) {
                    $fromRaw = $s['from'] ?? null;
                    $toRaw   = $s['to'] ?? null;

                    if (!$fromRaw && !$toRaw) continue;

                    $from = $this->parseDateTime($fromRaw);
                    $to   = $this->parseDateTime($toRaw);

                    if (!$from || !$to) {
                        $validator->errors()->add("extra_schedules.$idx.from", 'Invalid date/time for this schedule row.');
                        continue;
                    }

                    if ($to->lessThanOrEqualTo($from)) {
                        $validator->errors()->add("extra_schedules.$idx.to", 'End must be after start.');
                        continue;
                    }

                    $msg = $this->validateBlockRange($from, $to, $isAdmin);
                    if ($msg) {
                        $validator->errors()->add("extra_schedules.$idx.to", $msg);
                    } else {
                        $excludeId = $booking?->id;
                        $conflict = $this->findConflict($from, $to, $excludeId);
                        if ($conflict) {
                            $validator->errors()->add(
                                "extra_schedules.$idx.from",
                                "Extra schedule row " . ($idx + 1) . " overlaps an existing CONFIRMED/ACTIVE booking."
                            );
                        }
                    }

                    $extraIntervals[] = [
                        'key' => "extra:$idx",
                        'from' => $from,
                        'to' => $to,
                        'error_field' => "extra_schedules.$idx.from",
                    ];
                }
            }

            if ($mainFrom && $mainTo) {
                $intervals = array_merge(
                    [[
                        'key' => 'main',
                        'from' => $mainFrom,
                        'to' => $mainTo,
                        'error_field' => 'booking_date_from',
                    ]],
                    $extraIntervals
                );

                $this->validateNoOverlaps($validator, $intervals);
            }

            // Prevent accepting/confirming a booking with no services
            $status = strtolower((string) $this->input('booking_status', ''));
            $acceptStatuses = ['active', 'confirmed', 'completed'];

            if (in_array($status, $acceptStatuses, true)) {
                $itemsCount = 0;

                $itemsInput = $this->input('items');
                if (is_array($itemsInput)) {
                    $itemsCount = count(array_filter($itemsInput, function ($row) {
                        return is_array($row) && !empty($row['service_id']);
                    }));
                } elseif ($booking) {
                    $itemsCount = (int) $booking->bookingServices()->count();
                }

                if ($itemsCount < 1) {
                    $validator->errors()->add(
                        'items',
                        'A booking cannot be confirmed/activated/completed without at least one selected service.'
                    );
                }
            }
        });
    }

    protected function validateBlockRange(Carbon $from, Carbon $to, bool $isAdmin): ?string
    {
        $fromTime = $from->format('H:i');
        $toTime   = $to->format('H:i');

        if ($from->minute !== 0) {
            return 'Start time must be aligned to exact block hours (minutes must be :00).';
        }

        $endOk = ($to->minute === 0) || ($to->hour === 23 && $to->minute === 59);
        if (!$endOk) {
            return 'End time must be aligned to block hours (:00) or exactly 11:59 PM for EVE.';
        }

        $fromDate = $from->copy()->startOfDay();
        $toDate   = $to->copy()->startOfDay();

        $sameDay = $toDate->equalTo($fromDate);
        $nextDay = $toDate->equalTo($fromDate->copy()->addDay());

        if ($sameDay && $fromTime === '00:00' && $toTime === '06:00') {
            return $isAdmin ? null : '11:59 PM – 6:00 AM is ADMIN-only. Please contact admin for this booking.';
        }

        if ($sameDay && $fromTime === '06:00' && $toTime === '12:00') return null;
        if ($sameDay && $fromTime === '12:00' && $toTime === '18:00') return null;
        if ($sameDay && $fromTime === '06:00' && $toTime === '18:00') return null;

        if ($sameDay && $fromTime === '18:00' && $toTime === '23:59') return null;
        if ($sameDay && $fromTime === '12:00' && $toTime === '23:59') return null;
        if ($sameDay && $fromTime === '06:00' && $toTime === '23:59') return null;

        // Allow legacy "next day midnight" normalized cases (if any slip through)
        if ($nextDay && in_array($fromTime, ['06:00', '12:00', '18:00'], true) && $toTime === '00:00') return null;

        return 'Invalid schedule. Use AM (6–12), PM (12–6), EVE (6–11:59), or valid combinations.';
    }

    protected function validateNoOverlaps($validator, array $intervals): void
    {
        $count = count($intervals);

        for ($i = 0; $i < $count; $i++) {
            for ($j = $i + 1; $j < $count; $j++) {
                $a = $intervals[$i];
                $b = $intervals[$j];

                /** @var Carbon $aFrom */
                $aFrom = $a['from'];
                /** @var Carbon $aTo */
                $aTo = $a['to'];

                /** @var Carbon $bFrom */
                $bFrom = $b['from'];
                /** @var Carbon $bTo */
                $bTo = $b['to'];

                if ($aFrom->lt($bTo) && $bFrom->lt($aTo)) {
                    $validator->errors()->add(
                        $b['error_field'],
                        'Schedules in this request overlap each other. Please choose non-overlapping blocks/dates.'
                    );
                }
            }
        }
    }

    protected function findConflict(Carbon $from, Carbon $to, ?int $excludeId = null): ?Booking
    {
        $toCalc = $this->endForOverlap($to);

        return Booking::query()
            ->select(['id', 'booking_date_from', 'booking_date_to', 'booking_status'])
            ->whereIn('booking_status', ['confirmed', 'active'])
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->where('booking_date_from', '<', $toCalc->toDateTimeString())
            ->where('booking_date_to', '>', $from->toDateTimeString())
            ->orderBy('booking_date_from', 'asc')
            ->first();
    }

    protected function endForOverlap(Carbon $to): Carbon
    {
        return ($to->hour === 23 && $to->minute === 59)
            ? $to->copy()->addMinute()
            : $to;
    }

    /**
     * ✅ FIX: accepts string OR DateTimeInterface (Carbon) safely
     */
    protected function parseDateTime($value): ?Carbon
    {
        if ($value instanceof DateTimeInterface) {
            return Carbon::instance($value);
        }
        if (!$value) return null;

        try {
            return Carbon::parse($value);
        } catch (\Throwable $e) {
            return null;
        }
    }

    protected function normalizeSchedulePair(?string $fromRaw, ?string $toRaw): array
    {
        if (!$fromRaw || !$toRaw) return [$fromRaw, $toRaw];

        $from = $this->parseDateTime($fromRaw);
        $to   = $this->parseDateTime($toRaw);

        if (!$from || !$to) return [$fromRaw, $toRaw];

        $fromTime = $from->format('H:i');
        $toTime   = $to->format('H:i');

        // legacy: end at 00:00 next day -> normalize to 23:59 same day
        if ($toTime === '00:00') {
            $fromDate = $from->copy()->startOfDay();
            $toDate   = $to->copy()->startOfDay();

            $isNextDay = $toDate->equalTo($fromDate->copy()->addDay());
            $validStarts = in_array($fromTime, ['06:00', '12:00', '18:00'], true);

            if ($isNextDay && $validStarts) {
                $toFixed = $from->copy()->setTime(23, 59, 0);
                return [
                    $from->format('Y-m-d\TH:i'),
                    $toFixed->format('Y-m-d\TH:i'),
                ];
            }
        }

        return [
            $from->format('Y-m-d\TH:i'),
            $to->format('Y-m-d\TH:i'),
        ];
    }

    /**
     * ✅ FIX: canonical schedule works for BOTH request strings and DB Carbon values.
     * Treats "00:00 next day" as equivalent to "23:59 same day" for block schedules.
     */
    protected function canonicalSchedule($fromRaw, $toRaw): string
    {
        $from = $this->parseDateTime($fromRaw);
        $to   = $this->parseDateTime($toRaw);

        if (!$from || !$to) return '';

        $fromTime = $from->format('H:i');
        $toTime   = $to->format('H:i');

        if ($toTime === '00:00') {
            $isNextDay = $to->copy()->startOfDay()->equalTo($from->copy()->startOfDay()->addDay());
            $validStarts = in_array($fromTime, ['06:00', '12:00', '18:00'], true);

            if ($isNextDay && $validStarts) {
                $to = $from->copy()->setTime(23, 59, 0);
            }
        }

        return $from->format('Y-m-d\TH:i') . '|' . $to->format('Y-m-d\TH:i');
    }

    protected function isClientUser(): bool
    {
        return $this->userHasAnyRole(['user']);
    }

    protected function isStaffUser(): bool
    {
        return $this->userHasAnyRole(['admin', 'manager', 'staff']);
    }

    protected function isAdminUser(): bool
    {
        return $this->userHasAnyRole(['admin']);
    }

    protected function userHasAnyRole(array $roles): bool
    {
        $user = $this->user();
        if (!$user) return false;

        if (method_exists($user, 'hasRole')) {
            return $user->hasRole($roles);
        }

        $userRoles = $user->roles ?? [];
        if (is_array($userRoles) || $userRoles instanceof \Traversable) {
            foreach ($userRoles as $ur) {
                $name = is_string($ur) ? $ur : ($ur->name ?? null);
                if ($name && in_array($name, $roles, true)) return true;
            }
        }

        return false;
    }
}
