<?php

namespace App\Http\Requests;

use App\Support\BookingStatusCatalog;
use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }


    protected function prepareForValidation(): void
    {
        $payload = [];

        if ($this->has('booking_status')) {
            $payload['booking_status'] = BookingStatusCatalog::normalizeBookingStatus(
                (string) $this->input('booking_status'),
                'pencil_booked'
            );
        }

        if ($this->has('payment_status')) {
            $payload['payment_status'] = BookingStatusCatalog::normalizeBookingPaymentStatus(
                (string) $this->input('payment_status'),
                'unpaid'
            );
        }

        if ($payload !== []) {
            $this->merge($payload);
        }
    }

    public function rules(): array
    {
        return [
            'service_id' => ['required', 'exists:services,id'],
            'items' => ['nullable', 'array'],
            'items.*.service_id' => ['required_with:items', 'exists:services,id'],
            'items.*.quantity' => ['nullable', 'numeric', 'min:1'],
            'payment_meta' => ['nullable', 'array'],

            'organization_type' => ['nullable', 'string', 'max:100'],
            'company_name' => ['required', 'string', 'max:255'],
            'client_name' => ['required', 'string', 'max:255'],
            'client_contact_number' => ['required', 'string', 'max:30'],
            'client_email' => ['required', 'email', 'max:255'],

            'client_address' => ['nullable', 'string', 'max:1000'],
            'client_region' => ['nullable', 'string', 'max:255'],
            'client_province' => ['nullable', 'string', 'max:255'],
            'client_city_municipality' => ['nullable', 'string', 'max:255'],
            'client_barangay' => ['nullable', 'string', 'max:255'],
            'client_zip_code' => ['nullable', 'string', 'max:30'],
            'client_street_address' => ['nullable', 'string', 'max:1000'],

            'head_of_organization' => ['nullable', 'string', 'max:255'],
            'type_of_event' => ['required', 'string', 'max:255'],

            'booking_date_from' => ['required', 'date'],
            'booking_date_to' => ['required', 'date', 'after:booking_date_from'],
            'number_of_guests' => ['required', 'integer', 'min:1'],

            'survey_email' => ['nullable', 'email', 'max:255'],
            'survey_proof_image' => ['nullable', 'image', 'max:5120'],

            'booking_status' => ['nullable', 'string', 'max:100'],
            'payment_status' => ['nullable', 'string', 'max:100'],
            'is_public_calendar_visible' => ['nullable', 'boolean'],
            'public_calendar_title' => ['nullable', 'string', 'max:255'],

            'estimated_usage' => ['nullable', 'string', 'max:100'],
            'estimated_duration_hours' => ['nullable', 'numeric', 'min:0'],
            'estimated_other_rentals' => ['nullable', 'string', 'max:1000'],
            'estimated_additional_charges' => ['nullable', 'numeric', 'min:0'],
            'reservation_notes' => ['nullable', 'string', 'max:3000'],

            'package_acknowledged' => ['nullable', 'boolean'],
            'policy_acknowledged' => ['nullable', 'boolean'],
            'accuracy_acknowledged' => ['nullable', 'boolean'],
        ];
    }
}
