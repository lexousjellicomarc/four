<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookingPaymentRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $amount = $this->input('amount');

        if (is_string($amount)) {
            $amount = str_replace([',', ' '], '', trim($amount));
        }

        $paymentMethod = trim((string) $this->input('payment_method', 'online'));
        $paymentGateway = strtolower(trim((string) $this->input('payment_gateway', '')));
        $paymentType = strtolower(trim((string) $this->input('payment_type', '')));
        $transactionReference = trim((string) $this->input('transaction_reference', ''));
        $remarks = trim((string) $this->input('remarks', ''));
        $status = trim((string) $this->input('status', ''));
        $payerName = trim((string) $this->input('payer_name', ''));
        $cardHolderName = trim((string) $this->input('card_holder_name', ''));
        $cardNumber = preg_replace('/\D+/', '', (string) $this->input('card_number', ''));
        $cardExpiration = trim((string) $this->input('card_expiration', ''));
        $cardCvc = preg_replace('/\D+/', '', (string) $this->input('card_cvc', ''));

        $this->merge([
            'amount' => $amount,
            'payment_method' => $paymentMethod !== '' ? $paymentMethod : 'online',
            'payment_gateway' => $paymentGateway !== '' ? $paymentGateway : null,
            'payment_type' => $paymentType !== '' ? $paymentType : null,
            'transaction_reference' => $transactionReference !== '' ? $transactionReference : null,
            'remarks' => $remarks !== '' ? $remarks : null,
            'status' => $status !== '' ? strtolower($status) : null,
            'payer_name' => $payerName !== '' ? $payerName : null,
            'card_holder_name' => $cardHolderName !== '' ? $cardHolderName : null,
            'card_number' => $cardNumber !== '' ? $cardNumber : null,
            'card_expiration' => $cardExpiration !== '' ? $cardExpiration : null,
            'card_cvc' => $cardCvc !== '' ? $cardCvc : null,
            'marketing_consent' => filter_var($this->input('marketing_consent', false), FILTER_VALIDATE_BOOL),
        ]);
    }

    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        $user = $this->user();
        $canManage = $user ? $user->can('payments.manage') : false;

        $rules = [
            'payment_method' => ['required', 'string', 'max:100'],
            'payment_gateway' => ['nullable', 'string', 'in:card,paypal,gcash,bank,manual,cash'],
            'payment_type' => ['nullable', 'string', 'in:down,full'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'transaction_reference' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('booking_payments', 'transaction_reference'),
            ],
            'remarks' => ['nullable', 'string', 'max:1000'],
            'proof_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'payer_name' => ['required', 'string', 'max:255'],
            'card_holder_name' => ['nullable', 'string', 'max:255'],
            'card_number' => ['nullable', 'digits_between:12,19'],
            'card_expiration' => ['nullable', 'string', 'max:10'],
            'card_cvc' => ['nullable', 'digits_between:3,4'],
            'marketing_consent' => ['nullable', 'boolean'],
        ];

        if ($canManage) {
            $rules['status'] = ['required', 'string', 'in:pending,confirmed,failed,declined,refunded'];
        }

        return $rules;
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $gateway = strtolower((string) $this->input('payment_gateway', ''));
            $isCard = $gateway === 'card';
            $requiresProof = in_array($gateway, ['paypal', 'gcash'], true);

            if ($isCard) {
                foreach (['card_holder_name', 'card_number', 'card_expiration', 'card_cvc'] as $field) {
                    if (! $this->filled($field)) {
                        $validator->errors()->add($field, 'This card field is required.');
                    }
                }
            }

            if ($requiresProof) {
                if (! $this->filled('transaction_reference')) {
                    $validator->errors()->add('transaction_reference', 'Reference number is required for PayPal and GCash trial payments.');
                }

                if (! $this->hasFile('proof_image')) {
                    $validator->errors()->add('proof_image', 'A payment screenshot is required for PayPal and GCash trial payments.');
                }
            }
        });
    }
}
