<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
{
    $minGuests = $this->min_guests;
    $maxGuests = $this->max_guests;

    return [
        'id' => $this->id,
        'name' => $this->name,
        'description' => $this->description,
        'uom' => $this->uom,
        'price' => $this->price,
        'quantity' => 1,
        'min_guests' => $minGuests,
        'max_guests' => $maxGuests,
        'capacity_note' => $this->capacity_note,
        'is_guest_restricted' => $minGuests !== null || $maxGuests !== null,
        'service_type_id' => $this->service_type_id,
        'service_type' => $this->whenLoaded(
            'serviceType',
            fn () => $this->serviceType?->name,
            $this->serviceType?->name
        ),
        'created_at' => $this->created_at,
    ];
}

}
