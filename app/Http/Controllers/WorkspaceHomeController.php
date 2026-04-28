<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\CalendarBlock;
use App\Models\PublicEvent;
use App\Services\BookingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class WorkspaceHomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return $this->index($request);
    }

    public function index(Request $request): Response
    {
        $role = $this->resolveWorkspaceRole($request);

        return Inertia::render($this->resolvePage($role), [
            'workspaceRole' => $role,
            'workspaceStats' => $this->workspaceStats(),
            'recentBookings' => $this->recentBookings(),
            'todaySchedule' => $this->todaySchedule(),
            'workspaceSummary' => $this->workspaceSummary($role),
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

    private function resolvePage(string $role): string
    {
        return match ($role) {
            'admin' => 'admin/dashboard',
            'manager' => 'manager/dashboard',
            'staff' => 'staff/dashboard',
            default => 'user/dashboard',
        };
    }

    private function workspaceSummary(string $role): array
    {
        return match ($role) {
            'admin' => [
                'eyebrow' => 'Executive Control Center',
                'title' => 'Administrator Dashboard',
                'description' => 'Full authority workspace for public website content, bookings, users, reports, venue setup, and operational monitoring.',
            ],
            'manager' => [
                'eyebrow' => 'Review and Approval Workspace',
                'title' => 'Manager Dashboard',
                'description' => 'Focused workspace for reviewing bookings, payment compliance, MICE reporting, inquiries, and calendar activities.',
            ],
            'staff' => [
                'eyebrow' => 'Daily Operations Desk',
                'title' => 'Staff Dashboard',
                'description' => 'Fast operational workspace for assisting bookings, checking schedules, handling inquiries, and supporting clients.',
            ],
            default => [
                'eyebrow' => 'Client Booking Portal',
                'title' => 'My Booking Dashboard',
                'description' => 'Simple booking workspace for checking requests, starting reservations, and returning to the public BCCC website.',
            ],
        };
    }

    private function workspaceStats(): array
    {
        $statusCounts = [
            'pending' => 0,
            'confirmed' => 0,
            'active' => 0,
            'completed' => 0,
            'cancelled' => 0,
            'declined' => 0,
        ];

        try {
            /** @var BookingService $bookingService */
            $bookingService = app(BookingService::class);

            if (method_exists($bookingService, 'syncLifecycleStatuses')) {
                $bookingService->syncLifecycleStatuses();
            }

            if (method_exists($bookingService, 'getStatusCounts')) {
                $statusCounts = array_merge($statusCounts, $bookingService->getStatusCounts());
            }
        } catch (Throwable) {
            // Keep dashboard usable even if lifecycle syncing has an issue.
        }

        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        return [
            'pending' => (int) ($statusCounts['pending'] ?? 0),
            'confirmed' => (int) ($statusCounts['confirmed'] ?? 0),
            'active' => (int) ($statusCounts['active'] ?? 0),
            'completed' => (int) ($statusCounts['completed'] ?? 0),
            'cancelled' => (int) ($statusCounts['cancelled'] ?? 0),
            'declined' => (int) ($statusCounts['declined'] ?? 0),
            'total_bookings' => $this->safeCount(fn () => Booking::query()->count()),
            'today_bookings' => $this->safeCount(fn () => Booking::query()
                ->whereDate('booking_date_from', '<=', $today)
                ->whereDate('booking_date_to', '>=', $today)
                ->count()),
            'month_bookings' => $this->safeCount(fn () => Booking::query()
                ->whereDate('booking_date_to', '>=', $startOfMonth)
                ->whereDate('booking_date_from', '<=', $endOfMonth)
                ->count()),
            'month_blocks' => $this->safeCount(fn () => CalendarBlock::query()
                ->whereDate('date_to', '>=', $startOfMonth)
                ->whereDate('date_from', '<=', $endOfMonth)
                ->count()),
            'month_public_events' => $this->safeCount(fn () => PublicEvent::query()
                ->whereDate('event_date', '>=', $startOfMonth)
                ->whereDate('event_date', '<=', $endOfMonth)
                ->count()),
        ];
    }

    private function recentBookings(): array
    {
        try {
            $query = Booking::query()
                ->orderByDesc(Schema::hasColumn('bookings', 'created_at') ? 'created_at' : 'id')
                ->limit(8);

            $columns = [
                'id',
                'client_name',
                'company_name',
                'type_of_event',
                'booking_status',
                'booking_date_from',
                'booking_date_to',
            ];

            $availableColumns = array_values(array_filter(
                $columns,
                fn (string $column) => Schema::hasColumn('bookings', $column)
            ));

            return $query
                ->get($availableColumns)
                ->map(fn (Booking $booking) => [
                    'id' => $booking->id,
                    'client_name' => (string) ($booking->client_name ?? ''),
                    'company_name' => (string) ($booking->company_name ?? ''),
                    'type_of_event' => (string) ($booking->type_of_event ?? ''),
                    'booking_status' => (string) ($booking->booking_status ?? 'pending'),
                    'booking_date_from' => optional($booking->booking_date_from)->format('M d, Y h:i A'),
                    'booking_date_to' => optional($booking->booking_date_to)->format('M d, Y h:i A'),
                ])
                ->values()
                ->all();
        } catch (Throwable) {
            return [];
        }
    }

    private function todaySchedule(): array
    {
        try {
            $today = Carbon::today();

            return Booking::query()
                ->whereDate('booking_date_from', '<=', $today)
                ->whereDate('booking_date_to', '>=', $today)
                ->orderBy('booking_date_from')
                ->limit(8)
                ->get([
                    'id',
                    'client_name',
                    'company_name',
                    'type_of_event',
                    'booking_status',
                    'booking_date_from',
                    'booking_date_to',
                ])
                ->map(fn (Booking $booking) => [
                    'id' => $booking->id,
                    'title' => trim(($booking->type_of_event ?: 'Booking') . ' - ' . ($booking->company_name ?: $booking->client_name ?: 'Client')),
                    'status' => (string) ($booking->booking_status ?? 'pending'),
                    'time' => optional($booking->booking_date_from)->format('h:i A')
                        . ' - '
                        . optional($booking->booking_date_to)->format('h:i A'),
                ])
                ->values()
                ->all();
        } catch (Throwable) {
            return [];
        }
    }

    private function safeCount(callable $callback): int
    {
        try {
            return (int) $callback();
        } catch (Throwable) {
            return 0;
        }
    }
}
