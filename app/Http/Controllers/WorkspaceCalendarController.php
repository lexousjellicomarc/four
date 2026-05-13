<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\CalendarBlock;
use App\Models\PublicEvent;
use App\Services\BookingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceCalendarController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return $this->index($request);
    }

    public function index(Request $request): Response
    {
        /** @var BookingService $bookingService */
        $bookingService = app(BookingService::class);
        $bookingService->syncLifecycleStatuses();

        $countsAll = $bookingService->getStatusCounts();
        $counts = [
            'pending' => $countsAll['pending'] ?? 0,
            'confirmed' => $countsAll['confirmed'] ?? 0,
            'active' => $countsAll['active'] ?? 0,
            'completed' => $countsAll['completed'] ?? 0,
        ];

        $monthParam = (string) $request->query('month', '');
        $start = preg_match('/^\d{4}-\d{2}$/', $monthParam)
            ? Carbon::createFromFormat('Y-m', $monthParam)->startOfMonth()
            : Carbon::now()->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $monthAvailability = [];

        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $dateKey = $d->format('Y-m-d');
            $dayStatus = $bookingService->getDashboardDayStatus($dateKey);

            $monthAvailability[$dateKey] = [
                'AM' => (bool) ($dayStatus['AM'] ?? true),
                'PM' => (bool) ($dayStatus['PM'] ?? true),
                'EVE' => (bool) ($dayStatus['EVE'] ?? true),
                'is_fully_booked' => (bool) ($dayStatus['is_fully_booked'] ?? false),
                'day_status' => (string) ($dayStatus['day_status'] ?? 'available'),
            ];
        }

        $workspaceRole = $this->resolveWorkspaceRole($request);
        $events = $this->buildCalendarEvents($request, $workspaceRole, $start, $end);

        return Inertia::render($this->resolvePage($request, $workspaceRole), [
            'workspaceRole' => $workspaceRole,
            'counts' => $counts,
            'events' => $events,
            'month' => $start->format('Y-m'),
            'monthAvailability' => $monthAvailability,
            'areaOptions' => $this->areaOptions(),
        ]);
    }

    private function resolveWorkspaceRole(Request $request): string
    {
        $routeName = (string) optional($request->route())->getName();

        if (str_starts_with($routeName, 'admin.')) {
            return 'admin';
        }

        if (str_starts_with($routeName, 'manager.')) {
            return 'manager';
        }

        if (str_starts_with($routeName, 'staff.')) {
            return 'staff';
        }

        if (str_starts_with($routeName, 'user.')) {
            return 'user';
        }

        $path = '/' . ltrim($request->path(), '/');

        if (str_starts_with($path, '/admin/')) {
            return 'admin';
        }

        if (str_starts_with($path, '/manager/')) {
            return 'manager';
        }

        if (str_starts_with($path, '/staff/')) {
            return 'staff';
        }

        $user = $request->user();

        if ($user && method_exists($user, 'hasRole')) {
            if ($user->hasRole('admin')) {
                return 'admin';
            }

            if ($user->hasRole('manager')) {
                return 'manager';
            }

            if ($user->hasRole('staff')) {
                return 'staff';
            }
        }

        return 'user';
    }

    private function resolvePage(Request $request, string $workspaceRole): string
    {
        $routeName = (string) optional($request->route())->getName();

        if (str_starts_with($routeName, 'admin.')) {
            return 'admin/calendar/index';
        }

        if (str_starts_with($routeName, 'manager.')) {
            return 'manager/calendar/index';
        }

        if (str_starts_with($routeName, 'staff.')) {
            return 'staff/calendar/index';
        }

        if ($workspaceRole === 'user') {
            return 'user/calendar/index';
        }

        return 'dashboard';
    }

    private function buildCalendarEvents(Request $request, string $workspaceRole, Carbon $start, Carbon $end)
    {
        $user = $request->user();

        if ($workspaceRole === 'user') {
            return $this->buildUserBookingEvents((string) ($user?->email ?? ''), (int) ($user?->id ?? 0), $start, $end);
        }

        return $this->buildBookingEvents($start, $end)
            ->concat($this->buildPublicEventItems($start, $end))
            ->concat($this->buildCalendarBlockEvents($start, $end))
            ->sortBy([
                ['start', 'asc'],
                ['title', 'asc'],
            ])
            ->values();
    }

    private function buildUserBookingEvents(string $email, int $userId, Carbon $start, Carbon $end)
    {
        $ownBookings = Booking::query()
            ->whereDate('booking_date_to', '>=', $start)
            ->whereDate('booking_date_from', '<=', $end)
            ->where(function ($query) use ($email, $userId): void {
                if ($email !== '') {
                    $query->orWhere('client_email', $email);
                }

                if ($userId > 0) {
                    $query->orWhere('created_by_user_id', $userId);
                }
            })
            ->orderBy('booking_date_from')
            ->get([
                'id',
                'client_email',
                'client_name',
                'company_name',
                'type_of_event',
                'booking_status',
                'booking_date_from',
                'booking_date_to',
            ]);

        return $ownBookings
            ->map(fn (Booking $booking) => $this->bookingToCalendarEvent($booking))
            ->values();
    }

    private function buildBookingEvents(Carbon $start, Carbon $end)
    {
        $bookings = Booking::query()
            ->whereDate('booking_date_to', '>=', $start)
            ->whereDate('booking_date_from', '<=', $end)
            ->orderBy('booking_date_from')
            ->get([
                'id',
                'client_email',
                'client_name',
                'company_name',
                'type_of_event',
                'booking_status',
                'booking_date_from',
                'booking_date_to',
            ]);

        return $bookings->map(fn (Booking $booking) => $this->bookingToCalendarEvent($booking));
    }

    private function bookingToCalendarEvent(Booking $booking): array
    {
        $groupSeed = strtolower(implode('|', array_map('trim', [
            (string) ($booking->client_email ?? ''),
            (string) ($booking->client_name ?? ''),
            (string) ($booking->company_name ?? ''),
            (string) ($booking->type_of_event ?? ''),
        ])));

        return [
            'id' => $booking->id,
            'kind' => 'booking',
            'title' => ($booking->type_of_event ? ($booking->type_of_event . ' – ') : '')
                . ($booking->company_name ?: $booking->client_name ?: 'Booking'),
            'start' => optional($booking->booking_date_from)->format('Y-m-d\TH:i'),
            'end' => optional($booking->booking_date_to)->format('Y-m-d\TH:i'),
            'status' => $booking->booking_status,
            'groupKey' => substr(hash('sha1', $groupSeed), 0, 16),
        ];
    }

    private function buildPublicEventItems(Carbon $start, Carbon $end)
    {
        $publicEvents = PublicEvent::query()
            ->where('is_public', true)
            ->whereDate('event_date', '>=', $start)
            ->whereDate('event_date', '<=', $end)
            ->orderBy('event_date')
            ->get([
                'id',
                'title',
                'venue',
                'event_date',
                'event_time',
            ]);

        return $publicEvents->map(function (PublicEvent $event) {
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
                'groupKey' => substr(hash('sha1', 'public-event|' . $event->id), 0, 16),
            ];
        });
    }

    private function buildCalendarBlockEvents(Carbon $start, Carbon $end)
    {
        $calendarBlocks = CalendarBlock::query()
            ->whereDate('date_to', '>=', $start->format('Y-m-d'))
            ->whereDate('date_from', '<=', $end->format('Y-m-d'))
            ->orderBy('date_from')
            ->get([
                'id',
                'title',
                'area',
                'block',
                'public_status',
                'date_from',
                'date_to',
            ]);

        return $calendarBlocks->map(function (CalendarBlock $calendarBlock) use ($start, $end) {
            $rangeStart = Carbon::parse($calendarBlock->date_from)->startOfDay();
            $rangeEnd = Carbon::parse($calendarBlock->date_to)->startOfDay();

            if ($rangeStart->lt($start)) {
                $rangeStart = $start->copy()->startOfDay();
            }

            if ($rangeEnd->gt($end)) {
                $rangeEnd = $end->copy()->startOfDay();
            }

            $from = match (strtoupper((string) $calendarBlock->block)) {
                'PM' => '12:00',
                'EVE' => '18:00',
                default => '06:00',
            };

            $startDt = $rangeStart->copy()->setTimeFromTimeString($from);

            $endDt = match (strtoupper((string) $calendarBlock->block)) {
                'AM' => $rangeEnd->copy()->setTime(12, 0),
                'PM' => $rangeEnd->copy()->setTime(18, 0),
                'EVE', 'DAY' => $rangeEnd->copy()->addDay()->startOfDay(),
                default => $rangeEnd->copy()->addDay()->startOfDay(),
            };

            return [
                'id' => 'block-' . $calendarBlock->id,
                'kind' => 'block',
                'block_id' => $calendarBlock->id,
                'block' => $calendarBlock->block,
                'area' => $calendarBlock->area,
                'title' => 'BLOCK: ' . $calendarBlock->title
                    . ($calendarBlock->area ? (' – ' . $calendarBlock->area) : ''),
                'start' => $startDt->format('Y-m-d\TH:i'),
                'end' => $endDt->format('Y-m-d\TH:i'),
                'status' => match (strtolower((string) ($calendarBlock->public_status ?? 'red'))) {
                    'blue' => 'public_booked',
                    'gold' => 'private_booked',
                    default => 'blocked',
                },
                'public_status' => strtolower((string) ($calendarBlock->public_status ?? 'red')),
                'groupKey' => substr(hash('sha1', 'block|' . $calendarBlock->id), 0, 16),
            ];
        });
    }

    private function areaOptions(): array
    {
        return [
            'FULL HALL',
            'MAIN HALL',
            'FOYER & LOBBY AREA',
            'VIP LOUNGE',
            'BOARD ROOM',
            'BASEMENT',
            'GALLERY2600',
            'LED WALL',
        ];
    }
}
