<?php

namespace App\Http\Requests;

use App\Models\BookingPayment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBookingPaymentRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $amount = $this->input('amount');

        if (is_string($amount)) {
            $amount = str_replace([',', ' '], '', trim($amount));
        }

        $paymentGateway = strtolower(trim((string) $this->input('payment_gateway', '')));
        $paymentType = strtolower(trim((string) $this->input('payment_type', '')));
        $status = strtolower(trim((string) $this->input('status', '')));
        $cardNumber = preg_replace('/\D+/', '', (string) $this->input('card_number', ''));
        $cardCvc = preg_replace('/\D+/', '', (string) $this->input('card_cvc', ''));

        $this->merge([
            'amount' => $amount,
            'payment_gateway' => $paymentGateway !== '' ? $paymentGateway : null,
            'payment_type' => $paymentType !== '' ? $paymentType : null,
            'status' => $status !== '' ? $status : null,
            'payer_name' => trim((string) $this->input('payer_name', '')) ?: null,
            'card_holder_name' => trim((string) $this->input('card_holder_name', '')) ?: null,
            'card_number' => $cardNumber !== '' ? $cardNumber : null,
            'card_expiration' => trim((string) $this->input('card_expiration', '')) ?: null,
            'card_cvc' => $cardCvc !== '' ? $cardCvc : null,
            'marketing_consent' => filter_var($this->input('marketing_consent', false), FILTER_VALIDATE_BOOL),
            'transaction_reference' => trim((string) $this->input('transaction_reference', '')) ?: null,
            'remarks' => trim((string) $this->input('remarks', '')) ?: null,
        ]);
    }

    public function authorize(): bool
    {
        $user = $this->user();
        return $user ? $user->can('payments.manage') : false;
    }

    public function rules(): array
    {
        /** @var BookingPayment|null $payment */
        $payment = $this->route('payment');

        return [
            'status' => ['required', 'in:pending,confirmed,failed,declined,refunded'],
            'payment_method' => ['required', 'string', 'max:100'],
            'payment_gateway' => ['nullable', 'string', 'in:card,paypal,gcash,bank,manual,cash'],
            'payment_type' => ['nullable', 'string', 'in:down,full'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'transaction_reference' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('booking_payments', 'transaction_reference')->ignore($payment?->id),
            ],
            'remarks' => ['nullable', 'string', 'max:1000'],
            'proof_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'payer_name' => ['nullable', 'string', 'max:255'],
            'card_holder_name' => ['nullable', 'string', 'max:255'],
            'card_number' => ['nullable', 'digits_between:12,19'],
            'card_expiration' => ['nullable', 'string', 'max:10'],
            'card_cvc' => ['nullable', 'digits_between:3,4'],
            'marketing_consent' => ['nullable', 'boolean'],
        ];
    }
}
