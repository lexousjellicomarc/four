<?php

namespace App\Support;

use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class MiceRecordPayload
{
    public static function fromRequest(array $validated, ?Booking $booking = null, ?Authenticatable $user = null): array
    {
        $eventDateFrom = self::dateValue(
            Arr::get($validated, 'event_date_from')
            ?? Arr::get($validated, 'booking_date_from')
            ?? $booking?->booking_date_from
            ?? $booking?->event_date_from
        );

        $eventDateTo = self::dateValue(
            Arr::get($validated, 'event_date_to')
            ?? Arr::get($validated, 'booking_date_to')
            ?? $booking?->booking_date_to
            ?? $booking?->event_date_to
            ?? $eventDateFrom
        );

        $eventName = self::text(
            Arr::get($validated, 'event_name')
            ?? $booking?->type_of_event
            ?? $booking?->public_calendar_title
            ?? 'Untitled Event'
        );

        $organizationName = self::text(
            Arr::get($validated, 'organization_name')
            ?? $booking?->company_name
            ?? $booking?->organization_name
            ?? $booking?->client_name
        );

        $organizerName = self::text(
            Arr::get($validated, 'organizer_name')
            ?? $booking?->head_of_organization
            ?? $booking?->client_name
        );

        $establishmentName = self::text(
            Arr::get($validated, 'establishment_name')
            ?? $organizationName
            ?? $organizerName
            ?? $eventName
            ?? 'Baguio Convention and Cultural Center'
        );

        $venueArea = self::text(
            Arr::get($validated, 'venue_area')
            ?? self::bookingVenueName($booking)
            ?? 'Baguio Convention and Cultural Center'
        );

        $localMale = self::intValue(Arr::get($validated, 'local_male_participants'));
        $localFemale = self::intValue(Arr::get($validated, 'local_female_participants'));
        $domesticMale = self::intValue(Arr::get($validated, 'domestic_male_participants'));
        $domesticFemale = self::intValue(Arr::get($validated, 'domestic_female_participants'));
        $foreignMale = self::intValue(Arr::get($validated, 'foreign_male_participants'));
        $foreignFemale = self::intValue(Arr::get($validated, 'foreign_female_participants'));

        $totalParticipants = self::intValue(
            Arr::get($validated, 'total_participants'),
            $localMale + $localFemale + $domesticMale + $domesticFemale + $foreignMale + $foreignFemale
        );

        $sameDayVisitors = self::intValue(Arr::get($validated, 'same_day_visitors'));
        $overnightVisitors = self::intValue(Arr::get($validated, 'overnight_visitors'));

        $totalEmployees = self::intValue(Arr::get($validated, 'total_employees'));
        $femaleEmployees = self::intValue(Arr::get($validated, 'female_employees'));
        $maleEmployees = self::intValue(Arr::get($validated, 'male_employees'));

        if ($totalEmployees <= 0 && ($femaleEmployees + $maleEmployees) > 0) {
            $totalEmployees = $femaleEmployees + $maleEmployees;
        }

        $eventDays = self::intValue(
            Arr::get($validated, 'event_days'),
            self::eventDays($eventDateFrom, $eventDateTo)
        );

        $userId = $user?->getAuthIdentifier();

        return [
            'booking_id' => $booking?->id ?? Arr::get($validated, 'booking_id'),

            'record_no' => Arr::get($validated, 'record_no'),
            'year_recorded' => self::intValue(
                Arr::get($validated, 'year_recorded'),
                $eventDateFrom ? (int) Carbon::parse($eventDateFrom)->format('Y') : now()->year
            ),

            'enterprise_group' => self::text(Arr::get($validated, 'enterprise_group'), 'UNCLASSIFIED'),
            'btc_group_code' => self::text(Arr::get($validated, 'btc_group_code')),

            'establishment_name' => $establishmentName,
            'event_name' => $eventName,
            'event_category' => self::text(Arr::get($validated, 'event_category')),
            'type_of_event' => self::text(
                Arr::get($validated, 'type_of_event')
                ?? $booking?->type_of_event
                ?? $eventName
            ),
            'venue_area' => $venueArea,

            'event_date_from' => $eventDateFrom,
            'event_date_to' => $eventDateTo,

            'organization_name' => $organizationName,
            'organizer_name' => $organizerName,
            'organizer_type' => self::text(
                Arr::get($validated, 'organizer_type')
                ?? $booking?->organization_type
            ),

            'contact_person' => self::text(
                Arr::get($validated, 'contact_person')
                ?? $booking?->client_name
            ),
            'contact_number' => self::text(
                Arr::get($validated, 'contact_number')
                ?? $booking?->client_contact_number
            ),
            'email' => self::text(
                Arr::get($validated, 'email')
                ?? $booking?->client_email
            ),
            'address' => self::text(
                Arr::get($validated, 'address')
                ?? $booking?->client_address
                ?? $booking?->client_street_address
            ),

            'local_male_participants' => $localMale,
            'local_female_participants' => $localFemale,
            'domestic_male_participants' => $domesticMale,
            'domestic_female_participants' => $domesticFemale,
            'foreign_male_participants' => $foreignMale,
            'foreign_female_participants' => $foreignFemale,

            'main_origin_country' => self::text(Arr::get($validated, 'main_origin_country'), 'Philippines'),
            'main_origin_province' => self::text(Arr::get($validated, 'main_origin_province')),
            'main_origin_city' => self::text(Arr::get($validated, 'main_origin_city')),

            'same_day_visitors' => $sameDayVisitors,
            'overnight_visitors' => $overnightVisitors,
            'estimated_room_nights' => self::intValue(Arr::get($validated, 'estimated_room_nights')),
            'estimated_tourism_receipts' => self::decimalValue(Arr::get($validated, 'estimated_tourism_receipts')),

            'total_employees' => $totalEmployees,
            'female_employees' => $femaleEmployees,
            'male_employees' => $maleEmployees,

            'permit_to_engage' => self::boolValue(Arr::get($validated, 'permit_to_engage')),
            'dot_accredited' => self::boolValue(Arr::get($validated, 'dot_accredited')),
            'active_member' => self::boolValue(Arr::get($validated, 'active_member')),

            'remarks' => self::text(Arr::get($validated, 'remarks')),
            'event_days' => $eventDays,
            'total_participants' => $totalParticipants,

            'status' => self::text(Arr::get($validated, 'status'), 'submitted'),
            'submitted_at' => Arr::get($validated, 'submitted_at') ?: now(),

            'submitted_by_user_id' => Arr::get($validated, 'submitted_by_user_id') ?? $userId,
            'updated_by_user_id' => Arr::get($validated, 'updated_by_user_id') ?? $userId,
        ];
    }

    private static function bookingVenueName(?Booking $booking): ?string
    {
        if (! $booking) {
            return null;
        }

        try {
            if ($booking->relationLoaded('service') || method_exists($booking, 'service')) {
                $service = $booking->service;

                if ($service && isset($service->name)) {
                    return $service->name;
                }

                if ($service && method_exists($service, 'serviceType')) {
                    $serviceType = $service->serviceType;

                    if ($serviceType && isset($serviceType->name)) {
                        return $serviceType->name;
                    }
                }
            }
        } catch (\Throwable) {
            return null;
        }

        return null;
    }

    private static function text(mixed $value, ?string $fallback = null): ?string
    {
        if ($value === null) {
            return $fallback;
        }

        $text = trim((string) $value);

        if ($text === '') {
            return $fallback;
        }

        return Str::limit($text, 255, '');
    }

    private static function intValue(mixed $value, int $fallback = 0): int
    {
        if ($value === null || $value === '') {
            return $fallback;
        }

        return max(0, (int) $value);
    }

    private static function decimalValue(mixed $value, float $fallback = 0): float
    {
        if ($value === null || $value === '') {
            return $fallback;
        }

        return max(0, (float) $value);
    }

    private static function boolValue(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (int) $value === 1;
        }

        return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
    }

    private static function dateValue(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            return Carbon::parse($value)->startOfDay()->toDateTimeString();
        } catch (\Throwable) {
            return null;
        }
    }

    private static function eventDays(?string $from, ?string $to): int
    {
        if (! $from) {
            return 1;
        }

        try {
            $start = Carbon::parse($from)->startOfDay();
            $end = $to ? Carbon::parse($to)->startOfDay() : $start;

            return max(1, $start->diffInDays($end) + 1);
        } catch (\Throwable) {
            return 1;
        }
    }
}
