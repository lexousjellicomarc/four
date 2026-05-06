<?php

namespace App\Http\Controllers;

use App\Services\Contracts\BookingServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PublicAvailabilityController extends Controller
{
    public function __construct(
        private readonly BookingServiceInterface $bookings,
    ) {
    }

    public function check(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d'],
            'date_from' => ['nullable'],
            'date_to' => ['nullable'],
            'venue' => ['required', 'string', 'max:255'],
            'area' => ['nullable', 'string', 'max:255'],
            'event_type' => ['nullable', 'string', 'max:255'],
            'guests' => ['nullable', 'integer', 'min:1', 'max:2000'],
            'exclude_booking_id' => ['nullable', 'integer', 'min:1'],
        ]);

        [$from, $to] = $this->resolveDateRange($data);

        if (! $from || ! $to) {
            throw ValidationException::withMessages([
                'date' => 'Please provide a valid date or date range.',
            ]);
        }

        if ($to->lt($from)) {
            throw ValidationException::withMessages([
                'end_date' => 'The end date must be the same as or later than the start date.',
            ]);
        }

        $days = $from->diffInDays($to) + 1;

        if ($days > 31) {
            throw ValidationException::withMessages([
                'end_date' => 'Please limit public availability checks to 31 days or fewer.',
            ]);
        }

        $venue = trim((string) ($data['venue'] ?? $data['area'] ?? ''));
        $eventType = isset($data['event_type']) ? trim((string) $data['event_type']) : null;
        $guests = isset($data['guests']) ? (int) $data['guests'] : null;
        $excludeBookingId = isset($data['exclude_booking_id']) ? (int) $data['exclude_booking_id'] : null;

        $results = [];

        for ($cursor = $from->copy(); $cursor->lte($to); $cursor->addDay()) {
            $results[] = $this->normalizeDayResult(
                $this->bookings->getPublicDayStatus(
                    $cursor->format('Y-m-d'),
                    $venue,
                    $excludeBookingId,
                    $eventType,
                    $guests,
                ),
                $cursor->format('Y-m-d'),
                $venue,
            );
        }

        if (count($results) === 1 && ! $this->isRangeRequest($request)) {
            return response()->json($results[0]);
        }

        return response()->json($this->summarizeRange(
            $results,
            $from,
            $to,
            $venue,
            $eventType,
            $guests,
        ));
    }

    public function month(Request $request): JsonResponse
    {
        $data = $request->validate([
            'month' => ['required', 'regex:/^\d{4}-\d{2}$/'],
            'venue' => ['nullable', 'string', 'max:255'],
            'area' => ['nullable', 'string', 'max:255'],
        ]);

        $venue = trim((string) ($data['venue'] ?? $data['area'] ?? ''));

        try {
            $days = $this->bookings->getPublicMonthCalendar(
                $data['month'],
                $venue !== '' ? $venue : null,
            );
        } catch (\Throwable) {
            return response()->json([
                'message' => 'Invalid month format. Use YYYY-MM.',
            ], 422);
        }

        return response()->json([
            'month' => $data['month'],
            'venue' => $venue !== '' ? $venue : null,
            'days' => $days,
        ]);
    }

    protected function resolveDateRange(array $data): array
    {
        $date = $this->dateOnly($data['date'] ?? null);

        $from = $this->dateOnly(
            $data['start_date']
            ?? $data['date_from']
            ?? $date
        );

        $to = $this->dateOnly(
            $data['end_date']
            ?? $data['date_to']
            ?? $date
        );

        return [$from, $to];
    }

    protected function dateOnly(mixed $value): ?Carbon
    {
        if ($value === null || trim((string) $value) === '') {
            return null;
        }

        $value = trim((string) $value);

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return Carbon::createFromFormat('Y-m-d', $value)->startOfDay();
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/', $value)) {
            return Carbon::parse(substr($value, 0, 10))->startOfDay();
        }

        try {
            return Carbon::parse($value)->startOfDay();
        } catch (\Throwable) {
            return null;
        }
    }

    protected function isRangeRequest(Request $request): bool
    {
        return $request->filled('start_date')
            || $request->filled('end_date')
            || $request->filled('date_from')
            || $request->filled('date_to');
    }

    protected function normalizeDayResult(array $result, string $date, string $venue): array
    {
        $blocks = $this->normalizeBlocks($result['blocks'] ?? []);

        return [
            'date' => (string) ($result['date'] ?? $date),
            'venue' => (string) ($result['venue'] ?? $venue),
            'event_type' => $result['event_type'] ?? null,
            'event_type_classification' => $result['event_type_classification'] ?? 'general',
            'guests' => $result['guests'] ?? null,

            'status' => $this->normalizeStatus((string) ($result['status'] ?? 'available')),
            'title' => (string) ($result['title'] ?? 'Selected date is currently available'),
            'description' => (string) ($result['description'] ?? ''),
            'note' => (string) ($result['note'] ?? ''),
            'recommended_action' => (string) ($result['recommended_action'] ?? ''),
            'can_proceed' => (bool) ($result['can_proceed'] ?? true),

            'blocks' => $blocks,
            'busy' => array_values((array) ($result['busy'] ?? [])),
            'free' => array_values((array) ($result['free'] ?? [])),
            'is_fully_booked' => (bool) ($result['is_fully_booked'] ?? false),

            'event_titles' => array_values((array) ($result['event_titles'] ?? [])),
            'calendar_blocks' => array_values((array) ($result['calendar_blocks'] ?? [])),

            'venue_capacity_ok' => $result['venue_capacity_ok'] ?? null,
            'venue_capacity_message' => $result['venue_capacity_message'] ?? null,
            'matching_services' => array_values((array) ($result['matching_services'] ?? [])),
            'capacity_reasons' => array_values((array) ($result['capacity_reasons'] ?? [])),
        ];
    }

    protected function normalizeBlocks(mixed $blocks): array
    {
        if (! is_array($blocks)) {
            return [];
        }

        $normalized = [];

        foreach ($blocks as $key => $block) {
            if (! is_array($block)) {
                continue;
            }

            $blockKey = strtoupper((string) ($block['key'] ?? $key));

            $normalized[] = [
                'key' => $blockKey,
                'label' => (string) ($block['label'] ?? $this->blockLabel($blockKey)),
                'from' => (string) ($block['from'] ?? $this->blockFrom($blockKey)),
                'to' => (string) ($block['to'] ?? $this->blockTo($blockKey)),
                'is_available' => (bool) ($block['is_available'] ?? true),
            ];
        }

        usort($normalized, function (array $a, array $b) {
            return $this->blockSort($a['key']) <=> $this->blockSort($b['key']);
        });

        return $normalized;
    }

    protected function summarizeRange(
        array $results,
        Carbon $from,
        Carbon $to,
        string $venue,
        ?string $eventType,
        ?int $guests,
    ): array {
        $status = $this->rangeStatus($results);
        $canProceed = collect($results)->every(fn (array $day) => ($day['can_proceed'] ?? false) !== false);
        $daysCount = count($results);

        $availableDays = collect($results)
            ->filter(fn (array $day) => ($day['status'] ?? '') === 'available')
            ->count();

        $limitedDays = collect($results)
            ->filter(fn (array $day) => ($day['status'] ?? '') === 'limited')
            ->count();

        $blockedDays = collect($results)
            ->filter(fn (array $day) => in_array(($day['status'] ?? ''), ['blocked', 'private_booked'], true))
            ->count();

        [$title, $description, $note, $recommendedAction] = $this->rangeCopy(
            $status,
            $canProceed,
            $daysCount,
            $availableDays,
            $limitedDays,
            $blockedDays,
        );

        return [
            'mode' => 'range',
            'from' => $from->format('Y-m-d'),
            'to' => $to->format('Y-m-d'),
            'date' => $from->format('Y-m-d'),
            'venue' => $venue,
            'event_type' => $eventType,
            'guests' => $guests,

            'status' => $status,
            'title' => $title,
            'description' => $description,
            'note' => $note,
            'recommended_action' => $recommendedAction,
            'can_proceed' => $canProceed,

            'days_count' => $daysCount,
            'available_days' => $availableDays,
            'limited_days' => $limitedDays,
            'blocked_days' => $blockedDays,

            'results' => array_values($results),
            'event_titles' => collect($results)
                ->flatMap(fn (array $day) => $day['event_titles'] ?? [])
                ->filter()
                ->unique()
                ->values()
                ->all(),
            'calendar_blocks' => collect($results)
                ->flatMap(fn (array $day) => $day['calendar_blocks'] ?? [])
                ->values()
                ->all(),
        ];
    }

    protected function rangeStatus(array $results): string
    {
        $statuses = collect($results)->pluck('status')->map(fn ($status) => (string) $status);

        if ($statuses->contains('blocked')) {
            return 'blocked';
        }

        if ($statuses->contains('private_booked')) {
            return 'private_booked';
        }

        if ($statuses->contains('public_booked')) {
            return 'public_booked';
        }

        if ($statuses->contains('limited')) {
            return 'limited';
        }

        return 'available';
    }

    protected function rangeCopy(
        string $status,
        bool $canProceed,
        int $daysCount,
        int $availableDays,
        int $limitedDays,
        int $blockedDays,
    ): array {
        if ($status === 'available') {
            return [
                'Selected range is open for booking',
                "All {$daysCount} selected date" . ($daysCount === 1 ? '' : 's') . ' currently show available public booking blocks.',
                'You may continue to the booking form after reviewing the day-by-day block status.',
                'Continue to the booking request flow.',
            ];
        }

        if ($status === 'limited') {
            return [
                'Selected range has limited availability',
                "{$availableDays} date" . ($availableDays === 1 ? '' : 's') . " appear open and {$limitedDays} date" . ($limitedDays === 1 ? '' : 's') . ' have partial availability.',
                $canProceed
                    ? 'Some blocks are still open. Review each day before continuing.'
                    : 'At least one selected date needs adjustment before booking.',
                'Choose an open AM, PM, or EVE block, or adjust the range.',
            ];
        }

        if ($status === 'public_booked') {
            return [
                'Selected range includes public activity',
                'At least one selected date has a public-facing event or visible calendar activity.',
                $canProceed
                    ? 'The date may still have usable blocks, but public activity is already present.'
                    : 'Review the public events and adjust the date if needed.',
                'Coordinate with the office or choose another date if you need exclusivity.',
            ];
        }

        if ($status === 'private_booked') {
            return [
                'Selected range includes private reservations',
                "{$blockedDays} selected date" . ($blockedDays === 1 ? '' : 's') . ' include private or fully reserved venue time.',
                'Private booking details are hidden, but occupied blocks are reflected in the availability result.',
                'Choose a different date or venue area.',
            ];
        }

        return [
            'Selected range includes blocked dates',
            'At least one selected date is blocked or unavailable for public requests.',
            'Blocked dates cannot proceed through the public booking flow.',
            'Choose another date or contact the office for clarification.',
        ];
    }

    protected function normalizeStatus(string $status): string
    {
        $status = strtolower(trim($status));

        return match ($status) {
            'available',
            'limited',
            'public_booked',
            'private_booked',
            'blocked' => $status,
            'partial',
            'partially_booked' => 'limited',
            'full',
            'fully_booked' => 'private_booked',
            default => 'available',
        };
    }

    protected function blockLabel(string $key): string
    {
        return match (strtoupper($key)) {
            'AM' => 'Morning',
            'PM' => 'Afternoon',
            'EVE' => 'Evening',
            default => 'Whole Day',
        };
    }

    protected function blockFrom(string $key): string
    {
        return match (strtoupper($key)) {
            'PM' => '12:00',
            'EVE' => '18:00',
            default => '06:00',
        };
    }

    protected function blockTo(string $key): string
    {
        return match (strtoupper($key)) {
            'AM' => '12:00',
            'PM' => '18:00',
            default => '23:59',
        };
    }

    protected function blockSort(string $key): int
    {
        return match (strtoupper($key)) {
            'AM' => 1,
            'PM' => 2,
            'EVE' => 3,
            default => 9,
        };
    }
}
