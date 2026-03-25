<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
            'price' => $price,
            'quantity' => 1,
            'line_total' => $price,
        ];
    })->toArray();
});


        $payments = $this->whenLoaded('payments', function () {
            return $this->payments->map(function ($p) {
                return [
                    'id' => $p->id,
                    'status' => $p->status,
                    'payment_method' => $p->payment_method,
                    'amount' => $p->amount,
                    'transaction_reference' => $p->transaction_reference,
                    'payment_gateway' => $p->payment_gateway,
                    'remarks' => $p->remarks,
                    'created_at' => $p->created_at,
                ];
            })->toArray();
        });

        // ✅ Creator (avoid lazy-loading)
        $creator = $this->relationLoaded('createdBy') ? $this->createdBy : null;

        // ✅ Per-user view state (used for “NEW” highlight in bookings index)
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

        /**
         * ✅ IMPORTANT:
         * - Proof may exist as DB BLOB OR disk path.
         * - We add a cache-busting query param (?v=updated_at_timestamp) so the browser fetches the NEW image after replace.
         */
        $hasProof =
            !empty($this->survey_proof_image) ||
            !empty($this->survey_proof_image_path) ||
            !empty($this->survey_proof_image_name);

        $proofUrl = null;
        if ($hasProof) {
            $base = route('bookings.survey-proof-image', $this->id, false);
            $v = $this->updated_at ? $this->updated_at->getTimestamp() : time();
            $proofUrl = $base . '?v=' . $v;
        }

        return [
            'id' => $this->id,
            'service_id' => $this->service_id,
            'service_name' => $this->service?->name,

            'company_name' => $this->company_name,
            'client_name' => $this->client_name,
            'client_contact_number' => $this->client_contact_number,
            'client_email' => $this->client_email,

            // ✅ Required Google Survey
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

            // ✅ Created-by fields for UI (index/show)
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

            // ✅ “NEW” indicator (per current user)
            'is_unviewed_for_current_user' => $isUnviewedForCurrentUser,
            'current_user_viewed_at' => $currentUserView?->viewed_at?->toIso8601String(),

            'created_at' => $this->created_at,

            'items' => $items,
            'payments' => $payments,

            'totals' => [
                'items_total' => is_array($items) ? array_sum(array_map(fn ($i) => $i['line_total'] ?? 0, $items)) : null,
                'payments_total' => is_array($payments) ? array_sum(array_map(fn ($p) => (float) ($p['amount'] ?? 0), $payments)) : null,
            ],
        ];
    }
}
