<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminInquiryController;
use App\Http\Controllers\AdminPublicContentController;
use App\Http\Controllers\AdminSortController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\CalendarBlockController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PublicAvailabilityController;
use App\Http\Controllers\PublicInquiryController;
use App\Http\Controllers\PublicSiteController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ServiceTypeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserRoleController;
use App\Models\Booking;
use App\Models\CalendarBlock;
use App\Models\PublicEvent;
use App\Services\BookingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\BookingAuditController;
use App\Http\Controllers\BookingAnalyticsController;
use App\Http\Controllers\CalendarAnalyticsController;
use App\Http\Controllers\CalendarManagementController;
use App\Http\Requests\BulkCalendarBlockRequest;
use App\Http\Controllers\PaymentReviewController;
use App\Http\Controllers\BookingOperationsController;
use App\Http\Controllers\AdminGuidelinesContactController;
use App\Http\Controllers\MiceRegistryController;

/*
|--------------------------------------------------------------------------
| Public Marketing Routes
|--------------------------------------------------------------------------
*/

Route::post('/public/availability-check', [PublicAvailabilityController::class, 'check'])
    ->middleware('throttle:30,1')
    ->name('public.availability.check');

Route::get('/public/calendar-month', [PublicAvailabilityController::class, 'month'])
    ->name('public.calendar.month');

Route::post('/inquiries', [PublicInquiryController::class, 'store'])
    ->middleware('throttle:5,1')
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

    Route::get('/bookings/audit', [BookingAuditController::class, 'index'])
    ->middleware('role:admin|manager')
    ->name('bookings.audit');

    Route::middleware('role:admin|manager')
        ->prefix('admin/sort')
        ->name('admin.sort.')
        ->group(function () {
            Route::post('/events', [AdminSortController::class, 'events'])->name('events');
            Route::post('/packages', [AdminSortController::class, 'packages'])->name('packages');
            Route::post('/spaces', [AdminSortController::class, 'spaces'])->name('spaces');
            Route::post('/stats', [AdminSortController::class, 'stats'])->name('stats');
        });
        Route::get('/admin/guidelines-contacts', [AdminGuidelinesContactController::class, 'index'])
    ->name('admin.guidelines-contacts');

Route::post('/admin/guidelines-contacts', [AdminGuidelinesContactController::class, 'update'])
    ->name('admin.guidelines-contacts.update');
    Route::get('/calendar/analytics', [CalendarAnalyticsController::class, 'index'])
        ->middleware('role:admin|manager')
        ->name('calendar.analytics');

    Route::get('/calendar/analytics/export', [CalendarAnalyticsController::class, 'export'])
        ->middleware('role:admin|manager')
        ->name('calendar.analytics.export');

    Route::get('/calendar/analytics/print', [CalendarAnalyticsController::class, 'print'])
        ->middleware('role:admin|manager')
        ->name('calendar.analytics.print');

    Route::get('/bookings/analytics', [BookingAnalyticsController::class, 'index'])
        ->middleware('permission:bookings.view')
        ->name('bookings.analytics');

    Route::get('/bookings/analytics/export', [BookingAnalyticsController::class, 'export'])
        ->middleware('permission:bookings.view')
        ->name('bookings.analytics.export');

    Route::get('/bookings/analytics/print', [BookingAnalyticsController::class, 'print'])
        ->middleware('permission:bookings.view')
        ->name('bookings.analytics.print');


    Route::get('/reports/mice-registry', [MiceRegistryController::class, 'index'])
        ->middleware('permission:bookings.view')
        ->name('reports.mice-registry');

    Route::get('/reports/mice-registry/create', [MiceRegistryController::class, 'create'])
        ->middleware('role:admin|manager')
        ->name('reports.mice-registry.create');

    Route::post('/reports/mice-registry', [MiceRegistryController::class, 'store'])
        ->middleware('role:admin|manager')
        ->name('reports.mice-registry.store');

    Route::get('/reports/mice-registry/print', [MiceRegistryController::class, 'print'])
        ->middleware('permission:bookings.view')
        ->name('reports.mice-registry.print');

    Route::get('/reports/mice-registry/export', [MiceRegistryController::class, 'export'])
        ->middleware('permission:bookings.view')
        ->name('reports.mice-registry.export');

    Route::get('/reports/mice-registry/{miceRecord}/edit', [MiceRegistryController::class, 'edit'])
        ->middleware('role:admin|manager')
        ->name('reports.mice-registry.edit');

    Route::put('/reports/mice-registry/{miceRecord}', [MiceRegistryController::class, 'update'])
        ->middleware('role:admin|manager')
        ->name('reports.mice-registry.update');

    Route::delete('/reports/mice-registry/{miceRecord}', [MiceRegistryController::class, 'destroy'])
        ->middleware('role:admin|manager')
        ->name('reports.mice-registry.destroy');


        Route::get('/bookings/operations', [BookingOperationsController::class, 'index'])
    ->middleware('permission:bookings.view')
    ->name('bookings.operations');

Route::post('/bookings/operations/payments/{payment}/approve', [BookingOperationsController::class, 'approvePayment'])
    ->middleware('permission:payments.manage')
    ->name('bookings.operations.payments.approve');

Route::post('/bookings/operations/payments/{payment}/decline', [BookingOperationsController::class, 'declinePayment'])
    ->middleware('permission:payments.manage')
    ->name('bookings.operations.payments.decline');

Route::post('/bookings/operations/payments/{payment}/fail', [BookingOperationsController::class, 'failPayment'])
    ->middleware('permission:payments.manage')
    ->name('bookings.operations.payments.fail');

    Route::get('/calendar/manage', [CalendarManagementController::class, 'index'])
        ->middleware('role:admin|manager')
        ->name('calendar.manage');

    Route::post('/calendar-blocks/bulk', [CalendarBlockController::class, 'bulkStore'])
        ->middleware('role:admin|manager')
        ->name('calendar-blocks.bulk-store');

    Route::get('/payments/review', [PaymentReviewController::class, 'index'])
    ->middleware('permission:payments.manage')
    ->name('payments.review');

    Route::prefix('/bookings/audit')
    ->middleware('role:admin|manager')
    ->name('bookings.audit.')
    ->group(function () {
        Route::get('/', [BookingAuditController::class, 'index'])->name('index');
        Route::get('/export', [BookingAuditController::class, 'export'])->name('export');
        Route::get('/print', [BookingAuditController::class, 'printReport'])->name('print');
    });
    Route::middleware('role:admin|manager')
        ->prefix('admin')
        ->name('admin.')
        ->group(function () {
            Route::post('/tourism-members', [AdminPublicContentController::class, 'storeTourismMember'])
                ->name('tourism-members.store');

            Route::put('/tourism-members/{tourismMember}', [AdminPublicContentController::class, 'updateTourismMember'])
                ->name('tourism-members.update');

            Route::delete('/tourism-members/{tourismMember}', [AdminPublicContentController::class, 'destroyTourismMember'])
                ->name('tourism-members.destroy');

            Route::get('/inquiries', [AdminInquiryController::class, 'index'])
                ->name('inquiries.index');

            Route::put('/inquiries/{inquiry}', [AdminInquiryController::class, 'update'])
                ->name('inquiries.update');

            Route::delete('/inquiries/{inquiry}', [AdminInquiryController::class, 'destroy'])
                ->name('inquiries.destroy');

            Route::post('/events', [AdminPublicContentController::class, 'storeEvent'])
                ->name('events.store');

            Route::put('/events/{publicEvent}', [AdminPublicContentController::class, 'updateEvent'])
                ->name('events.update');

            Route::delete('/events/{publicEvent}', [AdminPublicContentController::class, 'destroyEvent'])
                ->name('events.destroy');

            Route::post('/packages', [AdminPublicContentController::class, 'storePackage'])
                ->name('packages.store');

            Route::put('/packages/{featurePackage}', [AdminPublicContentController::class, 'updatePackage'])
                ->name('packages.update');

            Route::delete('/packages/{featurePackage}', [AdminPublicContentController::class, 'destroyPackage'])
                ->name('packages.destroy');

            Route::post('/spaces', [AdminPublicContentController::class, 'storeSpace'])
                ->name('spaces.store');

            Route::put('/spaces/{venueSpace}', [AdminPublicContentController::class, 'updateSpace'])
                ->name('spaces.update');

            Route::delete('/spaces/{venueSpace}', [AdminPublicContentController::class, 'destroySpace'])
                ->name('spaces.destroy');

            Route::post('/stats', [AdminPublicContentController::class, 'storeStat'])
                ->name('stats.store');

            Route::put('/stats/{homepageStat}', [AdminPublicContentController::class, 'updateStat'])
                ->name('stats.update');

            Route::delete('/stats/{homepageStat}', [AdminPublicContentController::class, 'destroyStat'])
                ->name('stats.destroy');

            Route::put('/site-settings', [AdminPublicContentController::class, 'updateSiteSettings'])
                ->name('site-settings.update');
        });

    Route::get('/dashboard', function (Request $request) {
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

        $user = $request->user();
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
                    'title' => ($booking->type_of_event ? ($booking->type_of_event . ' – ') : '')
                        . ($booking->company_name ?? 'Booking'),
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
                    'title' => ($booking->type_of_event ? ($booking->type_of_event . ' – ') : '')
                        . ($booking->company_name ?? 'Booking'),
                    'start' => optional($booking->booking_date_from)->format('Y-m-d\TH:i'),
                    'end' => optional($booking->booking_date_to)->format('Y-m-d\TH:i'),
                    'status' => $booking->booking_status,
                    'groupKey' => substr(hash('sha1', $groupSeed), 0, 16),
                ];
            });

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

            $publicEventItems = $publicEvents->map(function (PublicEvent $event) {
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
                }

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

            $events = $bookingEvents
                ->concat($publicEventItems)
                ->concat($blockEvents)
                ->sortBy([
                    ['start', 'asc'],
                    ['title', 'asc'],
                ])
                ->values();
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


    Route::get('/bookings/{booking}/survey', [BookingController::class, 'survey'])
        ->middleware('permission:bookings.create')
        ->name('bookings.survey');

    Route::post('/bookings/{booking}/survey', [BookingController::class, 'storeSurvey'])
        ->middleware('permission:bookings.create')
        ->name('bookings.survey.store');


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
