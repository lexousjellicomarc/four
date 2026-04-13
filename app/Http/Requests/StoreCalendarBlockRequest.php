<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCalendarBlockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'manager']) ?? false;
    }

    protected function prepareForValidation(): void
    {
        $block = strtoupper(trim((string) $this->input('block', '')));
        $status = strtolower(trim((string) ($this->input('public_status') ?? $this->input('statusColor') ?? 'red')));

        $statusMap = [
            'red' => 'red',
            'blocked' => 'red',
            'unavailable' => 'red',
            'gold' => 'gold',
            'private' => 'gold',
            'reserved' => 'gold',
            'blue' => 'blue',
            'public' => 'blue',
            'event' => 'blue',
        ];

        if ($block === 'WHOLE_DAY') {
            $block = 'DAY';
        }

        $this->merge([
            'title' => trim((string) $this->input('title', '')),
            'area' => trim((string) $this->input('area', '')),
            'notes' => trim((string) $this->input('notes', '')),
            'block' => $block,
            'public_status' => $statusMap[$status] ?? $status,
        ]);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'area' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'block' => ['required', Rule::in(['AM', 'PM', 'EVE', 'DAY'])],
            'public_status' => ['required', Rule::in(['red', 'gold', 'blue'])],
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
        ];
    }
}
