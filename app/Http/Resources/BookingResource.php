<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\WorkspacePage;

class BookingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $items = $this->whenLoaded('bookingServices', function () {
            return $this->bookingServices->map(function ($item) {
                $price = (float) ($item->service?->price ?? 0);

                return [
                    'id' => $item->id,
                    'service_id' => $item->service_id,
                    'service_name' => $item->service?->name,
                    'area' => $item->service?->serviceType?->name ?? null,
                    'price' => $price,
                    'quantity' => 1,
                    'line_total' => $price,
                ];
            })->values()->toArray();
        });

        $payments = $this->whenLoaded('payments', function () {
            return $this->payments
                ->sortByDesc('created_at')
                ->values()
                ->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'status' => $p->status,
                        'payment_method' => $p->payment_method,
                        'payment_gateway' => $p->payment_gateway,
                        'payment_type' => $p->payment_type,
                        'amount' => (float) $p->amount,
                        'transaction_reference' => $p->transaction_reference,
                        'remarks' => $p->remarks,
                        'payer_name' => $p->payer_name,
                        'card_last_four' => $p->card_last_four,
                        'marketing_consent' => (bool) $p->marketing_consent,
                        'proof_image_url' => $this->paymentProofUrl($request, $p),
                        'paid_at' => optional($p->paid_at)->toIso8601String(),
                        'created_at' => optional($p->created_at)->toIso8601String(),
                    ];
                })
                ->toArray();
        });

        $lifecycleEvents = $this->whenLoaded('lifecycleEvents', function () {
            return $this->lifecycleEvents
                ->sortBy('event_at')
                ->values()
                ->map(function ($event) {
                    $actor = $event->relationLoaded('actor') ? $event->actor : null;

                    return [
                        'id' => $event->id,
                        'event_key' => $event->event_key,
                        'title' => $event->title,
                        'from_status' => $event->from_status,
                        'to_status' => $event->to_status,
                        'from_payment_status' => $event->from_payment_status,
                        'to_payment_status' => $event->to_payment_status,
                        'reason' => $event->reason,
                        'meta' => $event->meta,
                        'event_at' => optional($event->event_at ?? $event->created_at)->toIso8601String(),
                        'created_at' => optional($event->created_at)->toIso8601String(),
                        'actor' => $actor
                            ? [
                                'id' => $actor->id,
                                'name' => $actor->name,
                                'email' => $actor->email,
                            ]
                            : null,
                    ];
                })
                ->toArray();
        });

        $creator = $this->relationLoaded('createdBy') ? $this->createdBy : null;

        $currentUserView = null;
        $isUnviewedForCurrentUser = null;

        if ($request->user() && $this->relationLoaded('views')) {
            $currentUserView = $this->views->first();
            $isUnviewedForCurrentUser = $currentUserView === null;

            $trackingStartedAt = $request->user()->bookings_view_tracking_started_at ?? null;
            if ($trackingStartedAt && $this->created_at && $this->created_at->lt($trackingStartedAt)) {
                $isUnviewedForCurrentUser = false;
            }
        }

        $hasProof =
            ! empty($this->survey_proof_image) ||
            ! empty($this->survey_proof_image_path) ||
            ! empty($this->survey_proof_image_name);

        $proofUrl = null;
        if ($hasProof) {
            $routeName = WorkspacePage::routeName($request, 'bookings.survey-proof-image');
            $base = route($routeName, $this->id, false);
            $v = $this->updated_at ? $this->updated_at->getTimestamp() : time();
            $proofUrl = $base . '?v=' . $v;
        }

        $itemsTotal = is_array($items)
            ? array_sum(array_map(fn ($i) => (float) ($i['line_total'] ?? 0), $items))
            : null;

        $submittedPaymentsTotal = is_array($payments)
            ? array_sum(array_map(fn ($p) => (float) ($p['amount'] ?? 0), $payments))
            : null;

        $confirmedPaymentsTotal = is_array($payments)
            ? array_sum(array_map(
                fn ($p) => ($p['status'] ?? '') === 'confirmed' ? (float) ($p['amount'] ?? 0) : 0,
                $payments
            ))
            : null;

        return [
            'id' => $this->id,
            'service_id' => $this->service_id,
            'service_name' => $this->service?->name,

            'company_name' => $this->company_name,
            'client_name' => $this->client_name,
            'client_contact_number' => $this->client_contact_number,
            'client_email' => $this->client_email,

            'survey_email' => $this->survey_email,
            'survey_proof_image_url' => $proofUrl,

            'client_address' => $this->client_address,
            'head_of_organization' => $this->head_of_organization,
            'type_of_event' => $this->type_of_event,

            'booking_date_from' => optional($this->booking_date_from)->toIso8601String(),
            'booking_date_to' => optional($this->booking_date_to)->toIso8601String(),
            'flexible_date_from' => optional($this->flexible_date_from)->toIso8601String(),
            'flexible_date_to' => optional($this->flexible_date_to)->toIso8601String(),

            'number_of_guests' => $this->number_of_guests,
            'booking_status' => $this->booking_status,
            'payment_status' => $this->payment_status,

            'created_by_user_id' => $this->created_by_user_id,
            'created_by' => $creator
                ? [
                    'id' => $creator->id,
                    'name' => $creator->name,
                    'email' => $creator->email,
                ]
                : null,
            'created_by_name' => $creator?->name,
            'created_by_email' => $creator?->email,

            'is_unviewed_for_current_user' => $isUnviewedForCurrentUser,
            'current_user_viewed_at' => $currentUserView?->viewed_at?->toIso8601String(),

            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),

            'items' => $items,
            'payments' => $payments,
            'lifecycle_events' => $lifecycleEvents,

            'totals' => [
                'items_total' => $itemsTotal,
                'payments_total' => $confirmedPaymentsTotal,
                'submitted_payments_total' => $submittedPaymentsTotal,
                'confirmed_payments_total' => $confirmedPaymentsTotal,
                'remaining_balance' => max(0, (float) ($itemsTotal ?? 0) - (float) ($confirmedPaymentsTotal ?? 0)),
            ],
        ];
    }
    private function paymentProofUrl(Request $request, $payment): ?string
{
    if (empty($payment->proof_image_path) || empty($payment->id) || empty($payment->booking_id)) {
        return null;
    }

    $routeName = WorkspacePage::routeName($request, 'bookings.payments.proof');

    if (! route($routeName, [
        'booking' => $payment->booking_id,
        'payment' => $payment->id,
    ], false)) {
        return null;
    }

    $base = route($routeName, [
        'booking' => $payment->booking_id,
        'payment' => $payment->id,
    ], false);

    $version = $payment->updated_at?->timestamp ?? $payment->created_at?->timestamp ?? time();

    return $base . '?v=' . $version;
}
}
