<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookingMiceSurveyRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $payload = $this->all();

        foreach ([
            'event_name',
            'event_category',
            'type_of_event',
            'venue_area',
            'organization_name',
            'organizer_name',
            'organizer_type',
            'contact_person',
            'contact_number',
            'email',
            'address',
            'main_origin_country',
            'main_origin_province',
            'main_origin_city',
            'enterprise_group',
            'btc_group_code',
            'remarks',
        ] as $field) {
            if (array_key_exists($field, $payload) && is_string($payload[$field])) {
                $payload[$field] = trim($payload[$field]);
            }
        }

        if (array_key_exists('email', $payload) && is_string($payload['email'])) {
            $payload['email'] = strtolower(trim($payload['email']));
        }

        foreach ([
            'local_male_participants',
            'local_female_participants',
            'domestic_male_participants',
            'domestic_female_participants',
            'foreign_male_participants',
            'foreign_female_participants',
            'same_day_visitors',
            'overnight_visitors',
            'estimated_room_nights',
            'total_employees',
            'female_employees',
            'male_employees',
        ] as $field) {
            $payload[$field] = max(0, (int) ($payload[$field] ?? 0));
        }

        $payload['estimated_tourism_receipts'] = is_numeric($payload['estimated_tourism_receipts'] ?? null)
            ? round((float) $payload['estimated_tourism_receipts'], 2)
            : 0;

        $payload['permit_to_engage'] = filter_var($payload['permit_to_engage'] ?? false, FILTER_VALIDATE_BOOL);
        $payload['dot_accredited'] = filter_var($payload['dot_accredited'] ?? false, FILTER_VALIDATE_BOOL);
        $payload['active_member'] = filter_var($payload['active_member'] ?? false, FILTER_VALIDATE_BOOL);

        $payload['total_participants'] =
            $payload['local_male_participants']
            + $payload['local_female_participants']
            + $payload['domestic_male_participants']
            + $payload['domestic_female_participants']
            + $payload['foreign_male_participants']
            + $payload['foreign_female_participants'];

        $payload['year_recorded'] = $payload['year_recorded'] ?? now()->year;
        $payload['status'] = 'submitted';

        if (! empty($payload['event_date_from']) && ! empty($payload['event_date_to'])) {
            try {
                $from = Carbon::parse($payload['event_date_from'])->startOfDay();
                $to = Carbon::parse($payload['event_date_to'])->startOfDay();

                $payload['event_days'] = max(1, $from->diffInDays($to) + 1);
            } catch (\Throwable) {
                $payload['event_days'] = null;
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
            'year_recorded' => ['required', 'integer', 'min:2020', 'max:2100'],
            'enterprise_group' => ['nullable', 'string', 'max:50'],
            'btc_group_code' => ['nullable', 'string', 'max:50'],

            'event_name' => ['required', 'string', 'max:255'],
            'event_category' => ['required', 'string', Rule::in([
                'Meeting',
                'Incentive',
                'Convention',
                'Exhibition',
                'Government',
                'Cultural',
                'Corporate',
                'Social',
                'Other',
            ])],
            'type_of_event' => ['required', 'string', 'max:255'],
            'venue_area' => ['required', 'string', 'max:255'],

            'event_date_from' => ['required', 'date'],
            'event_date_to' => ['required', 'date', 'after_or_equal:event_date_from'],
            'event_days' => ['nullable', 'integer', 'min:1'],

            'organization_name' => ['required', 'string', 'max:255'],
            'organizer_name' => ['nullable', 'string', 'max:255'],
            'organizer_type' => ['nullable', 'string', 'max:255'],
            'contact_person' => ['required', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],

            'local_male_participants' => ['required', 'integer', 'min:0'],
            'local_female_participants' => ['required', 'integer', 'min:0'],
            'domestic_male_participants' => ['required', 'integer', 'min:0'],
            'domestic_female_participants' => ['required', 'integer', 'min:0'],
            'foreign_male_participants' => ['required', 'integer', 'min:0'],
            'foreign_female_participants' => ['required', 'integer', 'min:0'],
            'total_participants' => ['required', 'integer', 'min:1'],

            'main_origin_country' => ['nullable', 'string', 'max:255'],
            'main_origin_province' => ['nullable', 'string', 'max:255'],
            'main_origin_city' => ['nullable', 'string', 'max:255'],

            'same_day_visitors' => ['nullable', 'integer', 'min:0'],
            'overnight_visitors' => ['nullable', 'integer', 'min:0'],
            'estimated_room_nights' => ['nullable', 'integer', 'min:0'],
            'estimated_tourism_receipts' => ['nullable', 'numeric', 'min:0'],

            'total_employees' => ['nullable', 'integer', 'min:0'],
            'female_employees' => ['nullable', 'integer', 'min:0'],
            'male_employees' => ['nullable', 'integer', 'min:0'],

            'permit_to_engage' => ['nullable', 'boolean'],
            'dot_accredited' => ['nullable', 'boolean'],
            'active_member' => ['nullable', 'boolean'],

            'remarks' => ['nullable', 'string', 'max:2000'],
            'certified' => ['accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            'event_name.required' => 'Event name is required.',
            'event_category.required' => 'MICE category is required.',
            'type_of_event.required' => 'Type of event is required.',
            'venue_area.required' => 'Venue area is required.',
            'event_date_from.required' => 'Event start date is required.',
            'event_date_to.required' => 'Event end date is required.',
            'event_date_to.after_or_equal' => 'Event end date must not be earlier than the start date.',
            'organization_name.required' => 'Organization name is required.',
            'contact_person.required' => 'Contact person is required.',
            'total_participants.min' => 'At least one participant must be encoded.',
            'certified.accepted' => 'Please certify that the MICE report information is accurate.',
        ];
    }
}
