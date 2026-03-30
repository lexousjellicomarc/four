<?php

namespace App\Http\Controllers;

use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicAvailabilityController extends Controller
{
    public function __construct(
        private readonly BookingService $bookings
    ) {
    }

    public function check(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'venue' => ['required', 'string', 'max:255'],
            'event_type' => ['nullable', 'string', 'max:255'],
            'guests' => ['nullable', 'integer', 'min:1'],
        ]);

        $result = $this->bookings->getPublicDayStatus(
            $data['date'],
            $data['venue'],
            null,
            isset($data['event_type']) ? (string) $data['event_type'] : null,
            isset($data['guests']) ? (int) $data['guests'] : null,
        );

        return response()->json($result);
    }
}
