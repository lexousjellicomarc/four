<?php

namespace App\Http\Requests;

use App\Models\Booking;
use App\Models\MiceRecord;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBookingRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $payload = $this->all();

        foreach ([
            'organization_type',
            'company_name',
            'client_name',
            'client_address',
            'client_region',
            'client_province',
            'client_city_municipality',
            'client_barangay',
            'client_zip_code',
            'client_street_address',
            'head_of_organization',
            'type_of_event',
            'booking_status',
            'payment_status',
            'public_calendar_title',
        ] as $field) {
            if (array_key_exists($field, $payload) && is_string($payload[$field])) {
                $payload[$field] = trim($payload[$field]);
            }
        }

        if (array_key_exists('client_contact_number', $payload) && is_string($payload['client_contact_number'])) {
            $payload['client_contact_number'] = preg_replace('/\D+/', '', $payload['client_contact_number']);
        }

        if (array_key_exists('client_email', $payload) && is_string($payload['client_email'])) {
            $value = strtolower(trim($payload['client_email']));
            $payload['client_email'] = $value !== '' ? $value : null;
        }

        if (array_key_exists('number_of_guests', $payload)) {
            $payload['number_of_guests'] = is_numeric($payload['number_of_guests'])
                ? (int) $payload['number_of_guests']
                : $payload['number_of_guests'];
        }

        if (array_key_exists('booking_status', $payload) && is_string($payload['booking_status'])) {
            $payload['booking_status'] = strtolower($payload['booking_status']);
        }

        if (array_key_exists('payment_status', $payload) && is_string($payload['payment_status'])) {
            $payload['payment_status'] = strtolower($payload['payment_status']);
        }

        if (array_key_exists('is_public_calendar_visible', $payload)) {
            $payload['is_public_calendar_visible'] = filter_var(
                $payload['is_public_calendar_visible'],
                FILTER_VALIDATE_BOOL,
            );
        }

        if (empty($payload['client_address'])) {
            $payload['client_address'] = $this->buildClientAddress($payload);
        }

        $payload['booking_date_from'] = $payload['booking_date_from']
            ?? $payload['date_from']
            ?? $payload['from']
            ?? null;

        $payload['booking_date_to'] = $payload['booking_date_to']
            ?? $payload['date_to']
            ?? $payload['to']
            ?? null;

        [$from, $to] = $this->normalizeSchedulePair(
            $payload['booking_date_from'] ?? null,
            $payload['booking_date_to'] ?? null,
        );

        $payload['booking_date_from'] = $from;
        $payload['booking_date_to'] = $to;

        if (isset($payload['extra_schedules']) && is_array($payload['extra_schedules'])) {
            foreach ($payload['extra_schedules'] as $index => $row) {
                if (! is_array($row)) {
                    continue;
                }

                [$extraFrom, $extraTo] = $this->normalizeSchedulePair(
                    $row['from'] ?? null,
                    $row['to'] ?? null,
                );

                $payload['extra_schedules'][$index]['from'] = $extraFrom;
                $payload['extra_schedules'][$index]['to'] = $extraTo;
            }
        }

        if (array_key_exists('items', $payload) || array_key_exists('service_id', $payload)) {
            $payload['items'] = $this->normalizeItems(
                $payload['items'] ?? [],
                $payload['service_id'] ?? null,
            );

            if (empty($payload['service_id']) && ! empty($payload['items'][0]['service_id'])) {
                $payload['service_id'] = $payload['items'][0]['service_id'];
            }
        }

        $this->merge($payload);
    }

    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'service_id' => ['nullable', 'integer', 'exists:services,id'],

            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.service_id' => ['required', 'integer', 'exists:services,id'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],

            'organization_type' => ['nullable', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'client_name' => ['required', 'string', 'max:255'],
            'client_contact_number' => ['required', 'regex:/^09\d{9}$/'],
            'client_email' => ['required', 'string', 'email', 'max:255'],

            'client_address' => ['required', 'string', 'max:500'],
            'client_region' => ['nullable', 'string', 'max:255'],
            'client_province' => ['nullable', 'string', 'max:255'],
            'client_city_municipality' => ['nullable', 'string', 'max:255'],
            'client_barangay' => ['nullable', 'string', 'max:255'],
            'client_zip_code' => ['nullable', 'string', 'max:20'],
            'client_street_address' => ['nullable', 'string', 'max:255'],

            'head_of_organization' => ['nullable', 'string', 'max:255'],
            'type_of_event' => ['required', 'string', 'max:255'],

            'booking_date_from' => ['required', 'date'],
            'booking_date_to' => ['required', 'date', 'after:booking_date_from'],

            'extra_schedules' => ['sometimes', 'array'],
            'extra_schedules.*' => ['array'],
            'extra_schedules.*.from' => ['required_with:extra_schedules.*.to', 'date'],
            'extra_schedules.*.to' => ['required_with:extra_schedules.*.from', 'date', 'after:extra_schedules.*.from'],

            'number_of_guests' => ['required', 'integer', 'min:1', 'max:2000'],

            'booking_status' => [
                'required',
                Rule::in([
                    'pending',
                    'for_review',
                    'pencil_booked',
                    'active',
                    'confirmed',
                    'cancelled',
                    'declined',
                    'completed',
                ]),
            ],

            'payment_status' => [
                'nullable',
                Rule::in([
                    'unpaid',
                    'partial',
                    'paid',
                    'owing',
                ]),
            ],

            'is_public_calendar_visible' => ['sometimes', 'boolean'],
            'public_calendar_title' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.min' => 'Please select at least one venue or rental option.',
            'items.*.service_id.exists' => 'One selected venue option is no longer available. Please refresh and select again.',

            'client_name.required' => 'Contact person is required.',
            'client_contact_number.required' => 'Contact number is required.',
            'client_contact_number.regex' => 'Use a valid Philippine mobile number, example: 09171234567.',
            'client_email.required' => 'Email address is required.',
            'client_email.email' => 'Enter a valid email address.',
            'client_address.required' => 'Client address is required.',

            'type_of_event.required' => 'Event title or event type is required.',
            'booking_date_from.required' => 'Start date and time are required.',
            'booking_date_to.required' => 'End date and time are required.',
            'booking_date_to.after' => 'End date and time must be later than the start date and time.',

            'number_of_guests.required' => 'Number of guests is required.',
            'number_of_guests.min' => 'Number of guests must be at least 1.',
            'number_of_guests.max' => 'Number of guests cannot exceed 2,000.',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $isStaff = $this->isStaffUser();
            $isClient = $this->isClientUser();

            /** @var Booking|null $booking */
            $booking = $this->route('booking');

            if (! $booking instanceof Booking) {
                $booking = null;
            }

            if ($isClient && ! $isStaff && $booking) {
                $booking->loadMissing('bookingServices');

                if ($this->filled('service_id') && (string) $this->input('service_id') !== (string) $booking->service_id) {
                    $validator->errors()->add('service_id', 'Clients cannot change the selected venue/service. Please contact staff.');
                }

                if ($this->has('items') && ! $this->submittedItemsMatchExistingBooking($booking)) {
                    $validator->errors()->add('items', 'Clients cannot change selected services/items. Please contact staff.');
                }

                $requestSchedule = $this->canonicalSchedule(
                    $this->input('booking_date_from'),
                    $this->input('booking_date_to'),
                );

                $databaseSchedule = $this->canonicalSchedule(
                    $booking->booking_date_from,
                    $booking->booking_date_to,
                );

                if ($requestSchedule !== $databaseSchedule) {
                    $validator->errors()->add('booking_date_from', 'Clients cannot change the booking schedule. Please contact staff.');
                }

                if (
                    $this->filled('booking_status')
                    && strtolower((string) $this->input('booking_status')) !== strtolower((string) $booking->booking_status)
                ) {
                    $validator->errors()->add('booking_status', 'Clients cannot change booking status.');
                }

                if (
                    $this->filled('payment_status')
                    && strtolower((string) $this->input('payment_status')) !== strtolower((string) $booking->payment_status)
                ) {
                    $validator->errors()->add('payment_status', 'Payment status is managed by the system.');
                }

                return;
            }

            if ($booking instanceof Booking) {
                $this->validateMiceRequirementBeforeFinalStatus($validator, $booking);
            }

            if ($this->boolean('is_public_calendar_visible') && ! $this->filled('public_calendar_title')) {
                $validator->errors()->add('public_calendar_title', 'Please enter the title that should appear on the public calendar.');
            }

            $mainFrom = $this->parseDateTime($this->input('booking_date_from'));
            $mainTo = $this->parseDateTime($this->input('booking_date_to'));

            if ($mainFrom && $mainTo) {
                $message = $this->validateBlockRange($mainFrom, $mainTo, $this->isAdminUser());

                if ($message) {
                    $validator->errors()->add('booking_date_to', $message);
                }
            }

            $extraIntervals = [];

            foreach ((array) $this->input('extra_schedules', []) as $index => $schedule) {
                if (! is_array($schedule)) {
                    continue;
                }

                $fromRaw = $schedule['from'] ?? null;
                $toRaw = $schedule['to'] ?? null;

                if (! $fromRaw && ! $toRaw) {
                    continue;
                }

                $from = $this->parseDateTime($fromRaw);
                $to = $this->parseDateTime($toRaw);

                if (! $from || ! $to) {
                    $validator->errors()->add("extra_schedules.{$index}.from", 'Invalid date/time for this schedule row.');
                    continue;
                }

                if ($to->lessThanOrEqualTo($from)) {
                    $validator->errors()->add("extra_schedules.{$index}.to", 'End must be later than start.');
                    continue;
                }

                $message = $this->validateBlockRange($from, $to, $this->isAdminUser());

                if ($message) {
                    $validator->errors()->add("extra_schedules.{$index}.to", $message);
                    continue;
                }

                $extraIntervals[] = [
                    'from' => $from,
                    'to' => $to,
                    'error_field' => "extra_schedules.{$index}.from",
                ];
            }

            if ($mainFrom && $mainTo) {
                $this->validateNoOverlaps($validator, array_merge([
                    [
                        'from' => $mainFrom,
                        'to' => $mainTo,
                        'error_field' => 'booking_date_from',
                    ],
                ], $extraIntervals));
            }
        });
    }

    protected function validateMiceRequirementBeforeFinalStatus($validator, Booking $booking): void
    {
        $nextStatus = strtolower((string) $this->input('booking_status'));

        if (! in_array($nextStatus, ['confirmed', 'active', 'completed'], true)) {
            return;
        }

        $hasMiceReport = MiceRecord::query()
            ->where('booking_id', $booking->id)
            ->where('status', 'submitted')
            ->whereNotNull('submitted_at')
            ->exists();

        if (! $hasMiceReport) {
            $validator->errors()->add(
                'booking_status',
                'This booking cannot be confirmed, activated, or completed until the required MICE report is submitted.',
            );
        }
    }

    protected function submittedItemsMatchExistingBooking(Booking $booking): bool
    {
        $submitted = collect((array) $this->input('items', []))
            ->map(fn ($item) => (int) ($item['service_id'] ?? 0))
            ->filter()
            ->sort()
            ->values()
            ->all();

        if (empty($submitted)) {
            return true;
        }

        $existing = $booking->bookingServices
            ->map(fn ($item) => (int) $item->service_id)
            ->filter()
            ->push((int) $booking->service_id)
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();

        return $submitted === $existing;
    }

    protected function buildClientAddress(array $payload): string
    {
        return collect([
            $payload['client_street_address'] ?? null,
            $payload['client_barangay'] ?? null,
            $payload['client_city_municipality'] ?? null,
            $payload['client_province'] ?? null,
            $payload['client_region'] ?? null,
            $payload['client_zip_code'] ?? null,
        ])
            ->filter(fn ($value) => $value !== null && trim((string) $value) !== '')
            ->map(fn ($value) => trim((string) $value))
            ->implode(', ');
    }

    protected function normalizeItems(mixed $items, mixed $fallbackServiceId = null): array
    {
        $rows = is_array($items) ? $items : [];

        if (empty($rows) && $fallbackServiceId) {
            $rows = [
                [
                    'service_id' => $fallbackServiceId,
                    'quantity' => 1,
                ],
            ];
        }

        $seen = [];
        $normalized = [];

        foreach ($rows as $row) {
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

        return $normalized;
    }

    protected function validateBlockRange(Carbon $from, Carbon $to, bool $isAdmin): ?string
    {
        if ($to->lessThanOrEqualTo($from)) {
            return 'End date/time must be later than start date/time.';
        }

        if ($from->minute !== 0) {
            return 'Start time must be aligned to exact block hours.';
        }

        $validEndMinute = $to->minute === 0 || ($to->hour === 23 && $to->minute === 59);

        if (! $validEndMinute) {
            return 'End time must be aligned to block hours or exactly 11:59 PM.';
        }

        $fromTime = $from->format('H:i');
        $toTime = $to->format('H:i');

        $sameDay = $from->isSameDay($to);
        $multiDay = $to->copy()->startOfDay()->gt($from->copy()->startOfDay());

        if ($sameDay && $fromTime === '00:00' && $toTime === '06:00') {
            return $isAdmin ? null : '12:00 AM to 6:00 AM is admin-only. Please contact the office.';
        }

        if ($sameDay) {
            $allowed = [
                ['06:00', '12:00'],
                ['12:00', '18:00'],
                ['18:00', '23:59'],
                ['06:00', '18:00'],
                ['12:00', '23:59'],
                ['06:00', '23:59'],
            ];

            foreach ($allowed as [$allowedStart, $allowedEnd]) {
                if ($fromTime === $allowedStart && $toTime === $allowedEnd) {
                    return null;
                }
            }
        }

        if ($multiDay && $fromTime === '06:00' && $toTime === '23:59') {
            return null;
        }

        return 'Invalid schedule. Use AM, PM, EVE, Whole Day, or a multi-day Whole Day range.';
    }

    protected function validateNoOverlaps($validator, array $intervals): void
    {
        $count = count($intervals);

        for ($i = 0; $i < $count; $i++) {
            for ($j = $i + 1; $j < $count; $j++) {
                $a = $intervals[$i];
                $b = $intervals[$j];

                if ($a['from']->lt($b['to']) && $b['from']->lt($a['to'])) {
                    $validator->errors()->add(
                        $b['error_field'],
                        'Schedules in this request overlap each other. Please choose non-overlapping blocks or dates.',
                    );
                }
            }
        }
    }

    protected function canonicalSchedule(mixed $fromRaw, mixed $toRaw): string
    {
        [$from, $to] = $this->normalizeSchedulePair($fromRaw, $toRaw);

        return (string) $from . '|' . (string) $to;
    }

    protected function parseDateTime(mixed $value): ?Carbon
    {
        if (! $value) {
            return null;
        }

        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance($value);
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    protected function normalizeSchedulePair(mixed $fromRaw, mixed $toRaw): array
    {
        if (! $fromRaw || ! $toRaw) {
            return [$fromRaw, $toRaw];
        }

        $from = $this->parseDateTime($fromRaw);
        $to = $this->parseDateTime($toRaw);

        if (! $from || ! $to) {
            return [$fromRaw, $toRaw];
        }

        if (
            $to->format('H:i') === '00:00'
            && $to->copy()->startOfDay()->equalTo($from->copy()->startOfDay()->addDay())
            && in_array($from->format('H:i'), ['06:00', '12:00', '18:00'], true)
        ) {
            $to = $from->copy()->setTime(23, 59);
        }

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
        return $this->userHasAnyRole(['admin', 'manager', 'staff']);
    }

    protected function isAdminUser(): bool
    {
        return $this->userHasAnyRole(['admin']);
    }

    protected function userHasAnyRole(array $roles): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole($roles)) {
            return true;
        }

        if (method_exists($user, 'hasRole')) {
            foreach ($roles as $role) {
                if ($user->hasRole($role)) {
                    return true;
                }
            }
        }

        $role = (string) ($user->role_name ?? $user->role ?? '');

        if ($role !== '' && in_array($role, $roles, true)) {
            return true;
        }

        $userRoles = $user->roles ?? [];

        if (is_iterable($userRoles)) {
            foreach ($userRoles as $userRole) {
                $name = is_string($userRole) ? $userRole : ($userRole->name ?? null);

                if ($name && in_array($name, $roles, true)) {
                    return true;
                }
            }
        }

        return false;
    }
}
