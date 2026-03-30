<?php

namespace App\Http\Middleware;

use App\Models\Inquiry;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return array_merge(parent::share($request), [
            'survey' => [
                'url' => config('survey.url'),
                'qr_image_url' => config('survey.qr_image_url'),
            ],

            'features' => [
                'googleAuthEnabled' => filled(config('services.google.client_id'))
                    && filled(config('services.google.client_secret'))
                    && filled(config('services.google.redirect')),
            ],

            'auth' => [
                'user' => $user
                    ? [
                        'id' => $user->id,
                        'name' => $user->name,
                        'display_name' => $user->display_name,
                        'first_name' => $user->first_name,
                        'middle_name' => $user->middle_name,
                        'last_name' => $user->last_name,
                        'email' => $user->email,
                        'phone_number' => $user->phone_number,
                        'organization_name' => $user->organization_name,
                        'organization_type' => $user->organization_type,
                        'position_title' => $user->position_title,
                        'address_line1' => $user->address_line1,
                        'barangay' => $user->barangay,
                        'city_municipality' => $user->city_municipality,
                        'province' => $user->province,
                        'postal_code' => $user->postal_code,
                        'country' => $user->country,
                        'google_avatar' => $user->google_avatar,
                        'email_verified_at' => optional($user->email_verified_at)->toIso8601String(),
                        'last_login_at' => optional($user->last_login_at)->toIso8601String(),
                    ]
                    : null,
                'roles' => $user
                    ? $user->getRoleNames()->toArray()
                    : [],
                'permissions' => $user
                    ? $user->getAllPermissions()->pluck('name')->toArray()
                    : [],
            ],

            'notifications' => function () use ($user) {
                if (! $user) {
                    return [
                        'unread_count' => 0,
                        'latest' => [],
                    ];
                }

                $notifications = $user->notifications()
                    ->latest()
                    ->limit(10)
                    ->get()
                    ->map(function (UserNotification $notification) {
                        return [
                            'id' => $notification->id,
                            'type' => $notification->type,
                            'title' => $notification->title,
                            'message' => $notification->message,
                            'link' => $notification->link,
                            'read_at' => optional($notification->read_at)->toIso8601String(),
                            'created_at' => optional($notification->created_at)->toIso8601String(),
                        ];
                    });

                return [
                    'unread_count' => $user->notifications()->whereNull('read_at')->count(),
                    'latest' => $notifications,
                ];
            },

            'adminInquiryCounts' => function () use ($user) {
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
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ]);
    }
}
