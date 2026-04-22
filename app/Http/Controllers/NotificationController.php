<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserNotificationResource;
use App\Models\UserNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * JSON summary for bell polling.
     */
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        $base = $user->notifications();

        $unread = (clone $base)
            ->whereNull('read_at')
            ->count();

        $automationUnread = (clone $base)
            ->whereNull('read_at')
            ->where(function ($query) {
                $this->applyKindFilter($query, 'automation');
            })
            ->count();

        $latest = (clone $base)
            ->latest()
            ->limit(10)
            ->get();

        $latestPayload = UserNotificationResource::collection($latest)
            ->response()
            ->getData(true);

        return response()->json([
            'unread_count' => $unread,
            'automation_unread_count' => $automationUnread,
            'latest' => $latestPayload['data'] ?? [],
        ]);
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        $perPage = max(10, min(100, (int) $request->integer('per_page', 20)));
        $filters = [
            'q' => trim((string) $request->query('q', '')),
            'status' => strtolower(trim((string) $request->query('status', 'all'))),
            'kind' => strtolower(trim((string) $request->query('kind', 'all'))),
        ];

        if (! in_array($filters['status'], ['all', 'unread', 'read'], true)) {
            $filters['status'] = 'all';
        }

        if (! in_array($filters['kind'], ['all', 'automation', 'bookings', 'payments', 'calendar', 'services', 'users', 'system'], true)) {
            $filters['kind'] = 'all';
        }

        $base = $user->notifications();
        $filtered = $this->applyFilters(clone $base, $filters);

        $paginator = $filtered
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        $automationLatest = $this->applyFilters(clone $base, [
            'q' => '',
            'status' => 'all',
            'kind' => 'automation',
        ])
            ->latest()
            ->limit(6)
            ->get();

        return Inertia::render('notifications/index', [
            'notificationFeed' => UserNotificationResource::collection($paginator)
                ->response()
                ->getData(true),
            'notificationFilters' => $filters,
            'notificationStats' => $this->buildStats($base),
            'automationLatest' => UserNotificationResource::collection($automationLatest)
                ->response()
                ->getData(true),
        ]);
    }

    public function open(Request $request, UserNotification $notification): RedirectResponse
    {
        $user = $request->user();

        if (! $user || (int) $notification->user_id !== (int) $user->id) {
            abort(403);
        }

        $notification->markAsRead();

        $redirectTo = $notification->link ?: route('notifications.index');

        return redirect()->to($redirectTo);
    }

    public function markAllAsRead(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user) {
            $user->notifications()
                ->whereNull('read_at')
                ->update(['read_at' => now()]);
        }

        return back();
    }

    protected function applyFilters(Builder|Relation $query, array $filters): Builder|Relation
    {
        $q = trim((string) ($filters['q'] ?? ''));
        $status = strtolower((string) ($filters['status'] ?? 'all'));
        $kind = strtolower((string) ($filters['kind'] ?? 'all'));

        if ($status === 'unread') {
            $query->whereNull('read_at');
        } elseif ($status === 'read') {
            $query->whereNotNull('read_at');
        }

        if ($q !== '') {
            $query->where(function (Builder $inner) use ($q) {
                $inner->where('title', 'like', "%{$q}%")
                    ->orWhere('message', 'like', "%{$q}%")
                    ->orWhere('type', 'like', "%{$q}%");
            });
        }

        if ($kind !== 'all') {
            $query->where(function (Builder $inner) use ($kind) {
                $this->applyKindFilter($inner, $kind);
            });
        }

        return $query;
    }

    protected function applyKindFilter(Builder $query, string $kind): void
    {
        switch ($kind) {
            case 'automation':
                $query->where(function (Builder $inner) {
                    $inner->where('type', 'booking_lifecycle_maintenance')
                        ->orWhere('type', 'like', 'booking_auto_%')
                        ->orWhere('title', 'like', '%automatic%')
                        ->orWhere('title', 'like', '%lifecycle%')
                        ->orWhere('message', 'like', '%automatically%');
                });
                break;

            case 'bookings':
                $query->where('type', 'like', 'booking%')
                    ->where('type', '!=', 'booking_lifecycle_maintenance')
                    ->where('type', 'not like', 'booking_auto_%');
                break;

            case 'payments':
                $query->where('type', 'like', 'payment%');
                break;

            case 'calendar':
                $query->where('type', 'like', 'calendar_block%');
                break;

            case 'services':
                $query->where(function (Builder $inner) {
                    $inner->where('type', 'like', 'service_%')
                        ->orWhere('type', 'like', 'service_type_%');
                });
                break;

            case 'users':
                $query->where(function (Builder $inner) {
                    $inner->where('type', 'like', 'user_%')
                        ->orWhere('type', 'like', '%roles%');
                });
                break;

            case 'system':
                $query->where(function (Builder $inner) {
                    $inner->where(function (Builder $q) {
                        $q->whereNull('type')->orWhere('type', '');
                    })
                    ->orWhere(function (Builder $q) {
                        $q->where('type', 'not like', 'booking%')
                            ->where('type', 'not like', 'payment%')
                            ->where('type', 'not like', 'calendar_block%')
                            ->where('type', 'not like', 'service_%')
                            ->where('type', 'not like', 'service_type_%')
                            ->where('type', 'not like', 'user_%')
                            ->where('type', 'not like', '%roles%')
                            ->where('type', '!=', 'booking_lifecycle_maintenance')
                            ->where('type', 'not like', 'booking_auto_%');
                    });
                });
                break;
        }
    }

    protected function buildStats(Builder|Relation $base): array
    {
        $all = (clone $base)->count();
        $unread = (clone $base)->whereNull('read_at')->count();

        $kindCount = function (string $kind) use ($base) {
            return $this->applyFilters(clone $base, [
                'q' => '',
                'status' => 'all',
                'kind' => $kind,
            ])->count();
        };

        $kindUnreadCount = function (string $kind) use ($base) {
            return $this->applyFilters(clone $base, [
                'q' => '',
                'status' => 'unread',
                'kind' => $kind,
            ])->count();
        };

        return [
            'all' => $all,
            'unread' => $unread,
            'automation' => $kindCount('automation'),
            'automation_unread' => $kindUnreadCount('automation'),
            'bookings' => $kindCount('bookings'),
            'payments' => $kindCount('payments'),
            'calendar' => $kindCount('calendar'),
            'services' => $kindCount('services'),
            'users' => $kindCount('users'),
        ];
    }
}
