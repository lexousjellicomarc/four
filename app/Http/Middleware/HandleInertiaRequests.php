<?php

namespace App\Http\Middleware;

use App\Models\UserNotification;
use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Inquiry;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        
        return array_merge(parent::share($request), [
            'survey' => [
                'url' => config('survey.url'),
                'qr_image_url' => config('survey.qr_image_url'),
            ],
            
            'auth' => [
                'user' => $request->user()
                    ? [
                        'id'    => $request->user()->id,
                        'name'  => $request->user()->name,
                        'email' => $request->user()->email,
                    ]
                    : null,
                'roles' => $request->user()
                    ? $request->user()->getRoleNames()->toArray()
                    : [],
                'permissions' => $request->user()
                    ? $request->user()->getAllPermissions()->pluck('name')->toArray()
                    : [],
            ],
    
            'notifications' => function () use ($request) {
                $user = $request->user();
    
                if (! $user) {
                    return [
                        'unread_count' => 0,
                        'latest'       => [],
                    ];
                }
    
                $notifications = $user->notifications()
                    ->latest()
                    ->limit(10)
                    ->get()
                    ->map(function (UserNotification $notification) {
                        return [
                            'id'         => $notification->id,
                            'type'       => $notification->type,
                            'title'      => $notification->title,
                            'message'    => $notification->message,
                            'link'       => $notification->link,
                            'read_at'    => optional($notification->read_at)->toIso8601String(),
                            'created_at' => optional($notification->created_at)->toIso8601String(),
                        ];
                    });
    
                return [
                    'unread_count' => $user->notifications()->whereNull('read_at')->count(),
                    'latest'       => $notifications,
                ];
            },
            'adminInquiryCounts' => function () use ($request) {
            $user = $request->user();

            if (! $user || ! $user->hasAnyRole(['admin', 'manager'])) {
                return [
                    'total' => 0,
                    'new' => 0,
                ];
            }

                return [
                    'total' => Inquiry::query()->count(),
                    'new' => Inquiry::query()->where('status', 'new')->count(),
                ];
            },

            'flash' => [
                'success' => function () use ($request) {
                    return $request->session()->get('success');
                },
                'error' => function () use ($request) {
                    return $request->session()->get('error');
                },
            ],
        ]);
    }
}
