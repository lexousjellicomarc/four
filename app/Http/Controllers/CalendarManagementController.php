<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\CalendarBlock;
use App\Models\PublicEvent;
use App\Services\BookingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CalendarManagementController extends Controller
{
    public function index(Request $request, BookingService $bookingService): Response
    {
        abort_unless($request->user()?->hasAnyRole(['admin', 'manager']), 403);

        $monthParam = (string) $request->query('month', '');
        $month = preg_match('/^\d{4}-\d{2}$/', $monthParam)
            ? $monthParam
            : Carbon::now()->format('Y-m');

        $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $monthAvailability = [];
        for ($day = $start->copy(); $day->lte($end); $day->addDay()) {
            $dateKey = $day->format('Y-m-d');
            $monthAvailability[$dateKey] = $bookingService->getDashboardDayStatus($dateKey);
        }

        $bookingEvents = Booking::query()
            ->whereDate('booking_date_to', '>=', $start)
            ->whereDate('booking_date_from', '<=', $end)
            ->orderBy('booking_date_from')
            ->get([
                'id',
                'client_name',
                'client_email',
                'company_name',
                'type_of_event',
                'booking_status',
                'payment_status',
                'booking_date_from',
                'booking_date_to',
                'number_of_guests',
            ])
            ->map(function (Booking $booking) {
                return [
                    'id' => $booking->id,
                    'kind' => 'booking',
                    'title' => trim(((string) $booking->type_of_event ? $booking->type_of_event . ' – ' : '') . ((string) ($booking->company_name ?: $booking->client_name ?: 'Booking'))),
                    'start' => optional($booking->booking_date_from)->format('Y-m-d\TH:i') ?? (string) $booking->booking_date_from,
                    'end' => optional($booking->booking_date_to)->format('Y-m-d\TH:i') ?? (string) $booking->booking_date_to,
                    'status' => (string) $booking->booking_status,
                    'payment_status' => (string) ($booking->payment_status ?? ''),
                    'client_name' => (string) ($booking->client_name ?? ''),
                    'client_email' => (string) ($booking->client_email ?? ''),
                    'company_name' => (string) ($booking->company_name ?? ''),
                    'guest_count' => (int) ($booking->number_of_guests ?? 0),
                    'groupKey' => substr(hash('sha1', 'booking|' . $booking->id), 0, 16),
                ];
            })
            ->values();

        $publicEvents = PublicEvent::query()
            ->where('is_public', true)
            ->whereDate('event_date', '>=', $start)
            ->whereDate('event_date', '<=', $end)
            ->orderBy('event_date')
            ->get([
                'id',
                'title',
                'description',
                'note',
                'venue',
                'event_date',
                'event_time',
                'images',
            ]);

        $publicEventItems = $publicEvents->map(function ($event) {
            $eventDate = Carbon::parse($event->event_date);
            $time = trim((string) ($event->event_time ?? ''));
            $startAt = $eventDate->copy()->startOfDay();
            $endAt = $eventDate->copy()->endOfDay();

            if (preg_match('/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/', $time, $matches)) {
                $startAt = Carbon::parse($eventDate->format('Y-m-d') . ' ' . $matches[1]);
                $endAt = Carbon::parse($eventDate->format('Y-m-d') . ' ' . $matches[2]);
            }

            return [
                'id' => 'public-event-' . $event->id,
                'kind' => 'public_event',
                'title' => 'PUBLIC: ' . $event->title,
                'start' => $startAt->format('Y-m-d\TH:i'),
                'end' => $endAt->format('Y-m-d\TH:i'),
                'status' => 'public_booked',
                'area' => (string) ($event->venue ?? ''),
                'summary' => (string) (($event->note ?? '') !== '' ? $event->note : Str::limit((string) ($event->description ?? ''), 140)),
                'description' => (string) ($event->description ?? ''),
                'time' => (string) ($event->event_time ?? ''),
                'image' => (string) (is_array($event->images ?? null) && !empty($event->images) ? $event->images[0] : ''),
                'groupKey' => substr(hash('sha1', 'public-event|' . $event->id), 0, 16),
            ];
        })->values();

        $calendarBlocks = CalendarBlock::query()
            ->whereDate('date_to', '>=', $start->format('Y-m-d'))
            ->whereDate('date_from', '<=', $end->format('Y-m-d'))
            ->orderBy('date_from')
            ->get([
                'id',
                'title',
                'area',
                'notes',
                'block',
                'public_status',
                'date_from',
                'date_to',
            ]);

        $blockEvents = $calendarBlocks->map(function (CalendarBlock $calendarBlock) use ($start, $end) {
            $rangeStart = Carbon::parse($calendarBlock->date_from)->startOfDay();
            $rangeEnd = Carbon::parse($calendarBlock->date_to)->startOfDay();

            if ($rangeStart->lt($start)) {
                $rangeStart = $start->copy()->startOfDay();
            }
            if ($rangeEnd->gt($end)) {
                $rangeEnd = $end->copy()->startOfDay();
            }

            $from = '06:00';
            if ($calendarBlock->block === 'PM') {
                $from = '12:00';
            } elseif ($calendarBlock->block === 'EVE') {
                $from = '18:00';
            }

            $startDt = $rangeStart->copy()->setTimeFromTimeString($from);
            $endDt = match (strtoupper((string) $calendarBlock->block)) {
                'AM' => $rangeEnd->copy()->setTime(12, 0),
                'PM' => $rangeEnd->copy()->setTime(18, 0),
                default => $rangeEnd->copy()->addDay()->startOfDay(),
            };

            $normalizedStatus = match (strtolower((string) ($calendarBlock->public_status ?? 'red'))) {
                'blue' => 'public_booked',
                'gold' => 'private_booked',
                default => 'blocked',
            };

            return [
                'id' => 'block-' . $calendarBlock->id,
                'kind' => 'block',
                'block_id' => $calendarBlock->id,
                'title' => 'BLOCK: ' . $calendarBlock->title,
                'start' => $startDt->format('Y-m-d\TH:i'),
                'end' => $endDt->format('Y-m-d\TH:i'),
                'status' => $normalizedStatus,
                'public_status' => strtolower((string) ($calendarBlock->public_status ?? 'red')),
                'area' => (string) ($calendarBlock->area ?? ''),
                'note' => (string) ($calendarBlock->notes ?? ''),
                'block' => strtoupper((string) $calendarBlock->block),
                'dateFrom' => optional($calendarBlock->date_from)->format('Y-m-d') ?? (string) $calendarBlock->date_from,
                'dateTo' => optional($calendarBlock->date_to)->format('Y-m-d') ?? (string) $calendarBlock->date_to,
                'groupKey' => substr(hash('sha1', 'block|' . $calendarBlock->id), 0, 16),
            ];
        })->values();

        $highlights = [
            'bccc' => $publicEvents
                ->filter(fn ($event) => str_contains(strtolower((string) ($event->venue ?? '')), 'bccc')
                    || str_contains(strtolower((string) ($event->venue ?? '')), 'convention'))
                ->values()
                ->map(fn ($event) => $this->highlightRow($event, 'bccc')),
            'city' => $publicEvents
                ->filter(fn ($event) => ! (str_contains(strtolower((string) ($event->venue ?? '')), 'bccc')
                    || str_contains(strtolower((string) ($event->venue ?? '')), 'convention')))
                ->values()
                ->map(fn ($event) => $this->highlightRow($event, 'city')),
        ];

        return Inertia::render('calendar/manage', [
            'month' => $month,
            'monthAvailability' => $monthAvailability,
            'events' => $bookingEvents->concat($publicEventItems)->concat($blockEvents)->values(),
            'highlights' => $highlights,
            'areaOptions' => [
                'FULL HALL',
                'MAIN HALL',
                'FOYER & LOBBY AREA',
                'VIP LOUNGE',
                'BOARD ROOM',
                'BASEMENT',
                'GALLERY2600',
            ],
        ]);
    }

    protected function highlightRow($event, string $scope): array
    {
        return [
            'id' => (int) $event->id,
            'scope' => $scope,
            'title' => (string) ($event->title ?? ''),
            'venue' => (string) ($event->venue ?? ''),
            'date' => optional($event->event_date)->format('Y-m-d') ?? (string) ($event->event_date ?? ''),
            'time' => (string) ($event->event_time ?? ''),
            'summary' => (string) (($event->note ?? '') !== '' ? $event->note : Str::limit((string) ($event->description ?? ''), 140)),
            'description' => (string) ($event->description ?? ''),
            'image' => (string) (is_array($event->images ?? null) && !empty($event->images) ? $event->images[0] : ''),
        ];
    }
}
