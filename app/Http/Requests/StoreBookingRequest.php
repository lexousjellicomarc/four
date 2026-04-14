<?php

namespace App\Http\Requests;

use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    /**
     * Normalize schedules BEFORE rules/validation run:
     * - Convert "00:00 next day" to "23:59 same day" for block schedules
     *   so EVE doesn't become "tomorrow".
     */
    protected function prepareForValidation(): void
{
    $payload = $this->all();

    $trimmedStrings = [
        'company_name',
        'client_name',
        'client_contact_number',
        'client_address',
        'head_of_organization',
        'type_of_event',
        'public_calendar_title',
    ];

    foreach ($trimmedStrings as $field) {
        if (array_key_exists($field, $payload) && is_string($payload[$field])) {
            $payload[$field] = trim($payload[$field]);
        }
    }

    foreach (['client_email', 'survey_email'] as $field) {
        if (array_key_exists($field, $payload) && is_string($payload[$field])) {
            $value = strtolower(trim($payload[$field]));
            $payload[$field] = $value !== '' ? $value : null;
        }
    }

    if (array_key_exists('number_of_guests', $payload)) {
        $payload['number_of_guests'] = is_numeric($payload['number_of_guests'])
            ? (int) $payload['number_of_guests']
            : $payload['number_of_guests'];
    }

    if (array_key_exists('booking_status', $payload) && is_string($payload['booking_status'])) {
        $payload['booking_status'] = strtolower(trim($payload['booking_status']));
    }

    if (array_key_exists('payment_status', $payload) && is_string($payload['payment_status'])) {
        $payload['payment_status'] = strtolower(trim($payload['payment_status']));
    }

    if (array_key_exists('is_public_calendar_visible', $payload)) {
        $payload['is_public_calendar_visible'] = filter_var($payload['is_public_calendar_visible'], FILTER_VALIDATE_BOOL);
    }

    [$fromN, $toN] = $this->normalizeSchedulePair(
        $payload['booking_date_from'] ?? null,
        $payload['booking_date_to'] ?? null
    );

    $payload['booking_date_from'] = $fromN;
    $payload['booking_date_to'] = $toN;

    if (isset($payload['extra_schedules']) && is_array($payload['extra_schedules'])) {
        foreach ($payload['extra_schedules'] as $i => $row) {
            if (!is_array($row)) {
                continue;
            }

            [$ef, $et] = $this->normalizeSchedulePair(
                $row['from'] ?? null,
                $row['to'] ?? null
            );

            $payload['extra_schedules'][$i]['from'] = $ef;
            $payload['extra_schedules'][$i]['to'] = $et;
        }
    }

    if (isset($payload['items']) && is_array($payload['items'])) {
        $seen = [];
        $normalizedItems = [];

        foreach ($payload['items'] as $row) {
            if (!is_array($row)) {
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
                'quantity' => max(1, (int) ($row['quantity'] ?? 1)),
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
        return [
            'service_id' => ['nullable', 'integer', 'exists:services,id'],

            // ✅ A booking MUST have at least 1 selected service
            'items' => ['required', 'array', 'min:1'],
            'items.*.service_id' => ['required', 'integer', 'exists:services,id'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],

            'company_name' => ['nullable', 'string', 'max:255'],
            'client_name' => ['required', 'string', 'max:255'],
            'client_contact_number' => ['required', 'regex:/^09\d{9}$/'],
            'client_email' => ['required', 'string', 'email', 'max:255'],
            'survey_email' => ['required', 'string', 'email', 'max:255'],
            'survey_proof_image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],

            'client_address' => ['required', 'string', 'max:255'],
            'head_of_organization' => ['nullable', 'string', 'max:255'],

            'type_of_event' => ['required', 'string', 'max:255'],

            'booking_date_from' => ['required', 'date'],
            'booking_date_to'   => ['required', 'date', 'after:booking_date_from'],

            'extra_schedules' => ['sometimes', 'array'],
            'extra_schedules.*' => ['array'],
            'extra_schedules.*.from' => ['required_with:extra_schedules.*.to', 'date'],
            'extra_schedules.*.to'   => ['required_with:extra_schedules.*.from', 'date'],

            'number_of_guests' => ['required', 'integer', 'min:1', 'max:2000'],

            'booking_status' => ['required', 'in:pending,active,confirmed,cancelled,declined,completed'],
            'payment_status' => ['sometimes', 'in:unpaid,partial,paid,owing'],
            'is_public_calendar_visible' => ['sometimes', 'boolean'],
            'public_calendar_title' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $isAdmin  = $this->isAdminUser(); // admin only
            $isStaff  = $this->isStaffUser(); // admin/manager/staff
            $isClient = $this->isClientUser(); // user

            // Client restrictions
            if ($isClient && !$isStaff) {
                if ($this->input('booking_status') !== 'pending') {
                    $validator->errors()->add('booking_status', 'Clients can only create bookings with status Pending.');
                }
                if ($this->filled('payment_status')) {
                    $validator->errors()->add('payment_status', 'Payment status is managed by the system.');
                }
            }

            if ($this->boolean('is_public_calendar_visible') && ! $this->filled('public_calendar_title')) {
                $validator->errors()->add('public_calendar_title', 'Please enter the public title that should appear on the calendar.');
            }

            // Validate MAIN schedule
            $mainFrom = $this->parseDateTime($this->input('booking_date_from'));
            $mainTo   = $this->parseDateTime($this->input('booking_date_to'));

            if ($mainFrom && $mainTo) {
                // block-range validation
                $msg = $this->validateBlockRange($mainFrom, $mainTo, $isAdmin);
                if ($msg) {
                    $validator->errors()->add('booking_date_to', $msg);
                } else {
                    // DB conflict check (confirmed/active only)
                    $conflict = $this->findConflict($mainFrom, $mainTo, null);
                    if ($conflict) {
                        $validator->errors()->add(
                            'booking_date_from',
                            'This schedule overlaps an existing CONFIRMED/ACTIVE booking. Please choose another date/block.'
                        );
                    }
                }
            }

            // Validate EXTRA schedules
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
                        $conflict = $this->findConflict($from, $to, null);
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

            // Prevent overlaps inside the SAME request (main + extras)
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
        });
    }

    /**
     * Allowed strict ranges (preferred format uses 23:59 instead of 00:00 next day):
     * AM:      06:00-11:59
     * PM:      12:00-18:00
     * AM+PM:   06:00-18:00
     * EVE:     18:00-23:59   (preferred)
     * PM+EVE:  12:00-23:59   (preferred)
     * Full:    06:00-23:59   (preferred)
     *
     * Backward-compatible (still accepted):
     * EVE/PM+EVE/Full can end at 00:00 on next day.
     *
     * Admin-only:
     * NIGHT:   00:00-06:00 (same day)
     */
    protected function validateBlockRange(Carbon $from, Carbon $to, bool $isAdmin): ?string
    {
        $fromTime = $from->format('H:i');
        $toTime   = $to->format('H:i');

        // Start must be exactly :00
        if ($from->minute !== 0) {
            return 'Start time must be aligned to exact block hours (minutes must be :00).';
        }

        // End must be :00 OR exactly 23:59
        $endOk = ($to->minute === 0) || ($to->hour === 23 && $to->minute === 59);
        if (!$endOk) {
            return 'End time must be aligned to block hours (:00) or exactly 11:59 PM for EVE.';
        }

        $fromDate = $from->copy()->startOfDay();
        $toDate   = $to->copy()->startOfDay();

        $sameDay = $toDate->equalTo($fromDate);
        $nextDay = $toDate->equalTo($fromDate->copy()->addDay());

        // Admin-only night
        if ($sameDay && $fromTime === '00:00' && $toTime === '06:00') {
            return $isAdmin ? null : '11:59 PM – 6:00 AM is ADMIN-only. Please contact admin for this booking.';
        }

        // AM / PM / AM+PM
        if ($sameDay && $fromTime === '06:00' && $toTime === '12:00') return null;
        if ($sameDay && $fromTime === '12:00' && $toTime === '18:00') return null;
        if ($sameDay && $fromTime === '06:00' && $toTime === '18:00') return null;

        // Preferred EVE / combos ending 23:59 same day
        if ($sameDay && $fromTime === '18:00' && $toTime === '23:59') return null; // EVE
        if ($sameDay && $fromTime === '12:00' && $toTime === '23:59') return null; // PM+EVE
        if ($sameDay && $fromTime === '06:00' && $toTime === '23:59') return null; // Full day

        // Backward compatible: end at 00:00 next day
        if ($nextDay && $fromTime === '18:00' && $toTime === '23:59') return null; // EVE legacy
        if ($nextDay && $fromTime === '12:00' && $toTime === '23:59') return null; // PM+EVE legacy
        if ($nextDay && $fromTime === '06:00' && $toTime === '23:59') return null; // Full legacy

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

    /**
     * Server-side conflict check: confirmed/active bookings only
     */
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

    /**
     * Treat 23:59 as "end of day" => use +1 minute (midnight) for overlap math.
     */
    protected function endForOverlap(Carbon $to): Carbon
    {
        return ($to->hour === 23 && $to->minute === 59)
            ? $to->copy()->addMinute()
            : $to;
    }

    protected function parseDateTime($value): ?Carbon
    {
        if (!$value) return null;

        try {
            return Carbon::parse($value);
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Convert 00:00 next day => 23:59 same day for allowed block schedules only.
     */
    protected function normalizeSchedulePair(?string $fromRaw, ?string $toRaw): array
    {
        if (!$fromRaw || !$toRaw) return [$fromRaw, $toRaw];

        $from = $this->parseDateTime($fromRaw);
        $to   = $this->parseDateTime($toRaw);

        if (!$from || !$to) return [$fromRaw, $toRaw];

        $fromTime = $from->format('H:i');
        $toTime   = $to->format('H:i');

        // Only normalize if end is 00:00 next day AND start is one of our block starts
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

        // Standardize formatting
        return [
            $from->format('Y-m-d\TH:i'),
            $to->format('Y-m-d\TH:i'),
        ];
    }

    protected function isClientUser(): bool
    {
        return $this->userHasAnyRole(['user']);
    }

    protected function isStaffUser(): bool
    {
        // staff = admin/manager/staff
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

        // Spatie permission
        if (method_exists($user, 'hasRole')) {
            return $user->hasRole($roles);
        }

        // Fallback: check $user->roles
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
