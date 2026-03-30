<?php

use App\Http\Controllers\AdminPublicContentController;
use App\Http\Controllers\AdminSortController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\CalendarBlockController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PublicAvailabilityController;
use App\Http\Controllers\PublicSiteController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ServiceTypeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserRoleController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminInquiryController;
use App\Http\Controllers\PublicInquiryController;
use App\Models\TourismMember;
use App\Models\Booking;
use App\Models\CalendarBlock;
use App\Services\BookingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

/*
|--------------------------------------------------------------------------
| Public Marketing Routes
|--------------------------------------------------------------------------
*/

Route::post('/public/availability-check', [PublicAvailabilityController::class, 'check'])
    ->name('public.availability.check');

Route::post('/inquiries', [PublicInquiryController::class, 'store'])
    ->name('public.inquiries.store');

Route::get('/', [PublicSiteController::class, 'home'])
    ->name('home');

Route::get('/facilities', [PublicSiteController::class, 'facilities'])
    ->name('public.facilities');

Route::get('/facilities/{slug}', [PublicSiteController::class, 'facilityShow'])
    ->where('slug', '[A-Za-z0-9\-]+')
    ->name('public.facilities.show');

Route::get('/events', [PublicSiteController::class, 'events'])
    ->name('public.events');

Route::get('/calendar', [PublicSiteController::class, 'calendar'])
    ->name('public.calendar');

Route::get('/tourism-office', [PublicSiteController::class, 'tourismOffice'])
    ->name('public.tourism-office');

Route::get('/contact', [PublicSiteController::class, 'contact'])
    ->name('public.contact');

Route::get('/guidelines', [PublicSiteController::class, 'guidelines'])
    ->name('guidelines');

/*
|--------------------------------------------------------------------------
| Dedicated Admin Entry
|--------------------------------------------------------------------------
*/

Route::get('/admin', function (Request $request) {
    $user = $request->user();

    if ($user) {
        if ($user->hasAnyRole(['admin', 'manager'])) {
            return redirect()->route('admin.dashboard');
        }


        return redirect()->route('dashboard');
    }

    return Inertia::render('admin/login');
})->name('admin.login');

/*
|--------------------------------------------------------------------------
| Authenticated App Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/admin/home', [AdminPublicContentController::class, 'home'])
        ->middleware('role:admin|manager')
        ->name('admin.home');

    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])
    ->middleware('role:admin|manager')
    ->name('admin.dashboard');

    Route::middleware('role:admin|manager')
        ->prefix('admin/sort')
        ->name('admin.sort.')
        ->group(function () {
            Route::post('/events', [AdminSortController::class, 'events'])->name('events');
            Route::post('/packages', [AdminSortController::class, 'packages'])->name('packages');
            Route::post('/spaces', [AdminSortController::class, 'spaces'])->name('spaces');
            Route::post('/stats', [AdminSortController::class, 'stats'])->name('stats');
        });

    Route::middleware('role:admin|manager')
        ->prefix('admin')
        ->name('admin.')
        ->group(function () {


            Route::post('/tourism-members', [AdminPublicContentController::class, 'storeTourismMember'])->name('tourism-members.store');
            Route::put('/tourism-members/{tourismMember}', [AdminPublicContentController::class, 'updateTourismMember'])->name('tourism-members.update');
            Route::delete('/tourism-members/{tourismMember}', [AdminPublicContentController::class, 'destroyTourismMember'])->name('tourism-members.destroy');

            Route::get('/inquiries', [AdminInquiryController::class, 'index'])->name('inquiries.index');
            Route::put('/inquiries/{inquiry}', [AdminInquiryController::class, 'update'])->name('inquiries.update');
            Route::delete('/inquiries/{inquiry}', [AdminInquiryController::class, 'destroy'])->name('inquiries.destroy');

            Route::post('/events', [AdminPublicContentController::class, 'storeEvent'])->name('events.store');
            Route::put('/events/{publicEvent}', [AdminPublicContentController::class, 'updateEvent'])->name('events.update');
            Route::delete('/events/{publicEvent}', [AdminPublicContentController::class, 'destroyEvent'])->name('events.destroy');

            Route::post('/packages', [AdminPublicContentController::class, 'storePackage'])->name('packages.store');
            Route::put('/packages/{featurePackage}', [AdminPublicContentController::class, 'updatePackage'])->name('packages.update');
            Route::delete('/packages/{featurePackage}', [AdminPublicContentController::class, 'destroyPackage'])->name('packages.destroy');

            Route::post('/spaces', [AdminPublicContentController::class, 'storeSpace'])->name('spaces.store');
            Route::put('/spaces/{venueSpace}', [AdminPublicContentController::class, 'updateSpace'])->name('spaces.update');
            Route::delete('/spaces/{venueSpace}', [AdminPublicContentController::class, 'destroySpace'])->name('spaces.destroy');

            Route::post('/stats', [AdminPublicContentController::class, 'storeStat'])->name('stats.store');
            Route::put('/stats/{homepageStat}', [AdminPublicContentController::class, 'updateStat'])->name('stats.update');
            Route::delete('/stats/{homepageStat}', [AdminPublicContentController::class, 'destroyStat'])->name('stats.destroy');

            Route::put('/site-settings', [AdminPublicContentController::class, 'updateSiteSettings'])->name('site-settings.update');
        });

    Route::get('/dashboard', function (Request $request) {
        /** @var BookingService $bookingService */
        $bookingService = app(BookingService::class);

        $countsAll = $bookingService->getStatusCounts();

        $counts = [
            'pending' => $countsAll['pending'] ?? 0,
            'confirmed' => $countsAll['confirmed'] ?? 0,
            'active' => $countsAll['active'] ?? 0,
            'completed' => $countsAll['completed'] ?? 0,
        ];

        $user = $request->user();
        $monthParam = (string) $request->query('month', '');

        $start = preg_match('/^\d{4}-\d{2}$/', $monthParam)
            ? Carbon::createFromFormat('Y-m', $monthParam)->startOfMonth()
            : Carbon::now()->startOfMonth();

        $end = $start->copy()->endOfMonth();

        $monthAvailability = [];

        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $dateKey = $d->format('Y-m-d');
            $availability = $bookingService->getDailyAvailability($dateKey, null);
            $blocks = $availability['blocks'] ?? [];

            $monthAvailability[$dateKey] = [
                'AM' => (bool) data_get($blocks, 'AM.is_available', true),
                'PM' => (bool) data_get($blocks, 'PM.is_available', true),
                'EVE' => (bool) data_get($blocks, 'EVE.is_available', true),
                'is_fully_booked' => (bool) ($availability['is_fully_booked'] ?? false),
            ];
        }

        $events = collect();

        if ($user && $user->hasRole('user')) {
            $ownBookings = Booking::query()
                ->where('client_email', $user->email)
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

            $events = $ownBookings->map(function (Booking $booking) {
                $groupSeed = strtolower(implode('|', array_map('trim', [
                    (string) ($booking->client_email ?? ''),
                    (string) ($booking->client_name ?? ''),
                    (string) ($booking->company_name ?? ''),
                    (string) ($booking->type_of_event ?? ''),
                ])));

                return [
                    'id' => $booking->id,
                    'kind' => 'booking',
                    'title' => ($booking->type_of_event ? ($booking->type_of_event . ' – ') : '') .
                        ($booking->company_name ?? 'Booking'),
                    'start' => optional($booking->booking_date_from)->format('Y-m-d\TH:i'),
                    'end' => optional($booking->booking_date_to)->format('Y-m-d\TH:i'),
                    'status' => $booking->booking_status,
                    'groupKey' => substr(hash('sha1', $groupSeed), 0, 16),
                ];
            })->values();
        } else {
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

            $bookingEvents = $bookings->map(function (Booking $booking) {
                $groupSeed = strtolower(implode('|', array_map('trim', [
                    (string) ($booking->client_email ?? ''),
                    (string) ($booking->client_name ?? ''),
                    (string) ($booking->company_name ?? ''),
                    (string) ($booking->type_of_event ?? ''),
                ])));

                return [
                    'id' => $booking->id,
                    'kind' => 'booking',
                    'title' => ($booking->type_of_event ? ($booking->type_of_event . ' – ') : '') .
                        ($booking->company_name ?? 'Booking'),
                    'start' => optional($booking->booking_date_from)->format('Y-m-d\TH:i'),
                    'end' => optional($booking->booking_date_to)->format('Y-m-d\TH:i'),
                    'status' => $booking->booking_status,
                    'groupKey' => substr(hash('sha1', $groupSeed), 0, 16),
                ];
            });

            $calendarBlocks = CalendarBlock::query()
                ->whereDate('date_to', '>=', $start->format('Y-m-d'))
                ->whereDate('date_from', '<=', $end->format('Y-m-d'))
                ->orderBy('date_from')
                ->get([
                    'id',
                    'title',
                    'area',
                    'block',
                    'date_from',
                    'date_to',
                ]);

            $blockEvents = collect();

            foreach ($calendarBlocks as $calendarBlock) {
                $rangeStart = Carbon::parse($calendarBlock->date_from)->startOfDay();
                $rangeEnd = Carbon::parse($calendarBlock->date_to)->startOfDay();

                if ($rangeStart->lt($start)) {
                    $rangeStart = $start->copy()->startOfDay();
                }

                if ($rangeEnd->gt($end)) {
                    $rangeEnd = $end->copy()->startOfDay();
                }

                for ($d = $rangeStart->copy(); $d->lte($rangeEnd); $d->addDay()) {
                    $from = '06:00';
                    $to = '23:59';

                    if ($calendarBlock->block === 'AM') {
                        $from = '06:00';
                        $to = '12:00';
                    } elseif ($calendarBlock->block === 'PM') {
                        $from = '12:00';
                        $to = '18:00';
                    } elseif ($calendarBlock->block === 'EVE') {
                        $from = '18:00';
                        $to = '23:59';
                    } elseif ($calendarBlock->block === 'DAY') {
                        $from = '06:00';
                        $to = '23:59';
                    }

                    $startDt = $d->copy()->setTimeFromTimeString($from);
                    $endDt = ($calendarBlock->block === 'EVE' || $calendarBlock->block === 'DAY')
                        ? $d->copy()->addDay()->startOfDay()
                        : $d->copy()->setTimeFromTimeString($to);

                    $blockEvents->push([
                        'id' => 'block-' . $calendarBlock->id . '-' . $d->format('Ymd'),
                        'kind' => 'block',
                        'block_id' => $calendarBlock->id,
                        'block' => $calendarBlock->block,
                        'area' => $calendarBlock->area,
                        'title' => 'BLOCK: ' . $calendarBlock->title .
                            ($calendarBlock->area ? (' – ' . $calendarBlock->area) : ''),
                        'start' => $startDt->format('Y-m-d\TH:i'),
                        'end' => $endDt->format('Y-m-d\TH:i'),
                        'status' => 'unavailable',
                        'groupKey' => substr(hash('sha1', 'block|' . $calendarBlock->id), 0, 16),
                    ]);
                }
            }

            $events = $bookingEvents->concat($blockEvents)->values();
        }

        return Inertia::render('dashboard', [
            'counts' => $counts,
            'events' => $events,
            'month' => $start->format('Y-m'),
            'monthAvailability' => $monthAvailability,
        ]);
    })->middleware('permission:dashboard.view')->name('dashboard');

    Route::post('/calendar-blocks', [CalendarBlockController::class, 'store'])
        ->middleware('role:admin|manager')
        ->name('calendar-blocks.store');

    Route::put('/calendar-blocks/{calendarBlock}', [CalendarBlockController::class, 'update'])
        ->middleware('role:admin|manager')
        ->name('calendar-blocks.update');

    Route::delete('/calendar-blocks/{calendarBlock}', [CalendarBlockController::class, 'destroy'])
        ->middleware('role:admin|manager')
        ->name('calendar-blocks.destroy');

    Route::resource('services', ServiceController::class)
        ->middleware('permission:services.manage');

    Route::resource('service-types', ServiceTypeController::class)
        ->middleware('permission:service_types.manage');

    Route::get('/bookings/availability', [BookingController::class, 'availability'])
        ->middleware('permission:bookings.view')
        ->name('bookings.availability');

    Route::get('/bookings', [BookingController::class, 'index'])
        ->middleware('permission:bookings.view')
        ->name('bookings.index');

    Route::get('/bookings/create', [BookingController::class, 'create'])
        ->middleware('permission:bookings.create')
        ->name('bookings.create');

    Route::post('/bookings', [BookingController::class, 'store'])
        ->middleware('permission:bookings.create')
        ->name('bookings.store');

    Route::get('/bookings/{booking}', [BookingController::class, 'show'])
        ->middleware('permission:bookings.view')
        ->name('bookings.show');

    Route::get('/bookings/{booking}/survey-proof-image', [BookingController::class, 'surveyProofImage'])
        ->middleware('permission:bookings.view')
        ->name('bookings.survey-proof-image');

    Route::get('/bookings/{booking}/edit', [BookingController::class, 'edit'])
        ->middleware('permission:bookings.update')
        ->name('bookings.edit');

    Route::put('/bookings/{booking}', [BookingController::class, 'update'])
        ->middleware('permission:bookings.update')
        ->name('bookings.update');

    Route::delete('/bookings/{booking}', [BookingController::class, 'destroy'])
        ->middleware('permission:bookings.delete')
        ->name('bookings.destroy');

    Route::post('/bookings/{booking}/payments', [BookingController::class, 'storePayment'])
        ->middleware('permission:bookings.view')
        ->name('bookings.payments.store');

    Route::put('/bookings/{booking}/payments/{payment}', [BookingController::class, 'updatePayment'])
        ->middleware('permission:payments.manage')
        ->name('bookings.payments.update');

    Route::get('/notifications', [NotificationController::class, 'index'])
        ->name('notifications.index');

    Route::get('/notifications/summary', [NotificationController::class, 'summary'])
        ->name('notifications.summary');

    Route::get('/notifications/{notification}/open', [NotificationController::class, 'open'])
        ->name('notifications.open');

    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])
        ->name('notifications.read-all');

    Route::resource('users', UserController::class)
        ->middleware('permission:users.manage');

    Route::get('/users/roles', [UserRoleController::class, 'index'])
        ->middleware('permission:users.manage')
        ->name('users.roles.index');

    Route::put('/users/{user}/roles', [UserRoleController::class, 'update'])
        ->middleware('permission:users.manage')
        ->name('users.roles.update');
        
    Route::get('/users/roles', [UserRoleController::class, 'index'])
                ->middleware('permission:users.manage')
                ->name('users.roles.index');

    Route::put('/users/{user}/roles', [UserRoleController::class, 'update'])
                ->middleware('permission:users.manage')
                ->whereNumber('user')
                ->name('users.roles.update');

    Route::resource('users', UserController::class)
                ->middleware('permission:users.manage')
                ->where(['user' => '[0-9]+']);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
