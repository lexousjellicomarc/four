<?php

use App\Http\Controllers\AdminGuidelinesContactController;
use App\Http\Controllers\AdminInquiryController;
use App\Http\Controllers\AdminPublicContentController;
use App\Http\Controllers\AdminSortController;
use App\Http\Controllers\BookingAnalyticsController;
use App\Http\Controllers\BookingAuditController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\BookingOperationsController;
use App\Http\Controllers\CalendarAnalyticsController;
use App\Http\Controllers\CalendarBlockController;
use App\Http\Controllers\CalendarManagementController;
use App\Http\Controllers\MiceRegistryController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentReviewController;
use App\Http\Controllers\PublicAvailabilityController;
use App\Http\Controllers\PublicInquiryController;
use App\Http\Controllers\PublicSiteController;
use App\Http\Controllers\RoleRedirectController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ServiceTypeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserRoleController;
use App\Http\Controllers\WorkspaceCalendarController;
use App\Http\Controllers\WorkspaceHomeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\BookingMiceSurveyController;
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

Route::get('/my-bookings/{booking}/survey', [BookingMiceSurveyController::class, 'show'])
    ->whereNumber('booking')
    ->name('user.bookings.survey');

Route::post('/my-bookings/{booking}/survey', [BookingMiceSurveyController::class, 'store'])
    ->whereNumber('booking')
    ->name('user.bookings.survey.store');
    
/*
|--------------------------------------------------------------------------
| Dedicated Role Entries
|--------------------------------------------------------------------------
*/

Route::get('/admin', function (Request $request) {
    if ($request->user()) {
        return redirect()->route('role.home');
    }

    return Inertia::render('admin/login');
})->name('admin.login');

Route::get('/manager', function (Request $request) {
    if ($request->user()) {
        return redirect()->route('role.home');
    }

    return redirect()->route('login', ['redirect_to' => '/manager/dashboard']);
})->name('manager.login');

Route::get('/staff', function (Request $request) {
    if ($request->user()) {
        return redirect()->route('role.home');
    }

    return redirect()->route('login', ['redirect_to' => '/staff/dashboard']);
})->name('staff.login');

/*
|--------------------------------------------------------------------------
| Authenticated Role Redirects
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/home', RoleRedirectController::class)
        ->name('role.home');

    Route::get('/dashboard', RoleRedirectController::class)
        ->name('dashboard');
});

/*
|--------------------------------------------------------------------------
| Admin Workspace
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', [WorkspaceHomeController::class, 'index'])
            ->name('dashboard');

        Route::get('/content', [AdminPublicContentController::class, 'home'])
            ->name('content');

        Route::redirect('/home', '/admin/content')
            ->name('home');

        Route::get('/calendar', WorkspaceCalendarController::class)
            ->name('calendar');


        Route::get('/bookings/{booking}/survey', [BookingMiceSurveyController::class, 'show'])
            ->whereNumber('booking')
            ->name('bookings.survey');

        Route::post('/bookings/{booking}/survey', [BookingMiceSurveyController::class, 'store'])
            ->whereNumber('booking')
            ->name('bookings.survey.store');

        Route::get('/calendar/manage', [CalendarManagementController::class, 'index'])
            ->name('calendar.manage');

        Route::get('/calendar/analytics', [CalendarAnalyticsController::class, 'index'])
            ->name('calendar.analytics');

        Route::get('/calendar/analytics/export', [CalendarAnalyticsController::class, 'export'])
            ->name('calendar.analytics.export');

        Route::get('/calendar/analytics/print', [CalendarAnalyticsController::class, 'print'])
            ->name('calendar.analytics.print');

        Route::post('/calendar-blocks', [CalendarBlockController::class, 'store'])
            ->name('calendar-blocks.store');

        Route::post('/calendar-blocks/bulk', [CalendarBlockController::class, 'bulkStore'])
            ->name('calendar-blocks.bulk-store');

        Route::put('/calendar-blocks/{calendarBlock}', [CalendarBlockController::class, 'update'])
            ->name('calendar-blocks.update');

        Route::delete('/calendar-blocks/{calendarBlock}', [CalendarBlockController::class, 'destroy'])
            ->name('calendar-blocks.destroy');

        Route::get('/bookings/availability', [BookingController::class, 'availability'])
            ->name('bookings.availability');

        Route::get('/bookings/analytics', [BookingAnalyticsController::class, 'index'])
            ->name('bookings.analytics');

        Route::get('/bookings/analytics/export', [BookingAnalyticsController::class, 'export'])
            ->name('bookings.analytics.export');

        Route::get('/bookings/analytics/print', [BookingAnalyticsController::class, 'print'])
            ->name('bookings.analytics.print');

        Route::get('/bookings/operations', [BookingOperationsController::class, 'index'])
            ->name('bookings.operations');

        Route::post('/bookings/operations/payments/{payment}/approve', [BookingOperationsController::class, 'approvePayment'])
            ->name('bookings.operations.payments.approve');

        Route::post('/bookings/operations/payments/{payment}/decline', [BookingOperationsController::class, 'declinePayment'])
            ->name('bookings.operations.payments.decline');

        Route::post('/bookings/operations/payments/{payment}/fail', [BookingOperationsController::class, 'failPayment'])
            ->name('bookings.operations.payments.fail');

        Route::prefix('/bookings/audit')
            ->name('bookings.audit.')
            ->group(function () {
                Route::get('/', [BookingAuditController::class, 'index'])
                    ->name('index');

                Route::get('/export', [BookingAuditController::class, 'export'])
                    ->name('export');

                Route::get('/print', [BookingAuditController::class, 'printReport'])
                    ->name('print');
            });

        Route::get('/bookings/{booking}/survey', [BookingController::class, 'survey'])
            ->whereNumber('booking')
            ->name('bookings.survey');

        Route::post('/bookings/{booking}/survey', [BookingController::class, 'storeSurvey'])
            ->whereNumber('booking')
            ->name('bookings.survey.store');

        Route::get('/bookings/{booking}/survey-proof-image', [BookingController::class, 'surveyProofImage'])
            ->whereNumber('booking')
            ->name('bookings.survey-proof-image');

        Route::post('/bookings/{booking}/payments', [BookingController::class, 'storePayment'])
            ->whereNumber('booking')
            ->name('bookings.payments.store');

        Route::put('/bookings/{booking}/payments/{payment}', [BookingController::class, 'updatePayment'])
            ->whereNumber(['booking', 'payment'])
            ->name('bookings.payments.update');

        Route::get('/bookings/{booking}/payments/{payment}/proof', [BookingController::class, 'paymentProofImage'])
            ->whereNumber(['booking', 'payment'])
            ->name('bookings.payments.proof');

        Route::resource('/bookings', BookingController::class)
            ->where(['booking' => '[0-9]+']);

        Route::get('/payments/review', [PaymentReviewController::class, 'index'])
            ->name('payments.review');

        Route::get('/reports/mice-registry', [MiceRegistryController::class, 'index'])
            ->name('reports.mice-registry');

        Route::get('/reports/mice-registry/create', [MiceRegistryController::class, 'create'])
            ->name('reports.mice-registry.create');

        Route::post('/reports/mice-registry', [MiceRegistryController::class, 'store'])
            ->name('reports.mice-registry.store');

        Route::get('/reports/mice-registry/print', [MiceRegistryController::class, 'print'])
            ->name('reports.mice-registry.print');

        Route::get('/reports/mice-registry/export', [MiceRegistryController::class, 'export'])
            ->name('reports.mice-registry.export');

        Route::get('/reports/mice-registry/{miceRecord}/edit', [MiceRegistryController::class, 'edit'])
            ->whereNumber('miceRecord')
            ->name('reports.mice-registry.edit');

        Route::put('/reports/mice-registry/{miceRecord}', [MiceRegistryController::class, 'update'])
            ->whereNumber('miceRecord')
            ->name('reports.mice-registry.update');

        Route::delete('/reports/mice-registry/{miceRecord}', [MiceRegistryController::class, 'destroy'])
            ->whereNumber('miceRecord')
            ->name('reports.mice-registry.destroy');

        Route::resource('/venue-areas', ServiceTypeController::class)
            ->where(['venue_area' => '[0-9]+']);

        Route::resource('/rental-options', ServiceController::class)
            ->where(['rental_option' => '[0-9]+']);

        Route::get('/users/roles', [UserRoleController::class, 'index'])
            ->name('users.roles');

        Route::put('/users/{user}/roles', [UserRoleController::class, 'update'])
            ->whereNumber('user')
            ->name('users.roles.update');

        Route::resource('/users', UserController::class)
            ->where(['user' => '[0-9]+']);

        Route::get('/inquiries', [AdminInquiryController::class, 'index'])
            ->name('inquiries.index');

        Route::put('/inquiries/{inquiry}', [AdminInquiryController::class, 'update'])
            ->whereNumber('inquiry')
            ->name('inquiries.update');

        Route::delete('/inquiries/{inquiry}', [AdminInquiryController::class, 'destroy'])
            ->whereNumber('inquiry')
            ->name('inquiries.destroy');

        Route::get('/guidelines-contacts', [AdminGuidelinesContactController::class, 'index'])
            ->name('guidelines-contacts');

        Route::post('/guidelines-contacts', [AdminGuidelinesContactController::class, 'update'])
            ->name('guidelines-contacts.update');

        Route::prefix('sort')
            ->name('sort.')
            ->group(function () {
                Route::post('/events', [AdminSortController::class, 'events'])
                    ->name('events');

                Route::post('/packages', [AdminSortController::class, 'packages'])
                    ->name('packages');

                Route::post('/spaces', [AdminSortController::class, 'spaces'])
                    ->name('spaces');

                Route::post('/stats', [AdminSortController::class, 'stats'])
                    ->name('stats');
            });

        Route::post('/tourism-members', [AdminPublicContentController::class, 'storeTourismMember'])
            ->name('tourism-members.store');

        Route::put('/tourism-members/{tourismMember}', [AdminPublicContentController::class, 'updateTourismMember'])
            ->name('tourism-members.update');

        Route::delete('/tourism-members/{tourismMember}', [AdminPublicContentController::class, 'destroyTourismMember'])
            ->name('tourism-members.destroy');

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

/*
|--------------------------------------------------------------------------
| Manager Workspace
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:manager'])
    ->prefix('manager')
    ->name('manager.')
    ->group(function () {
        Route::get('/dashboard', [WorkspaceHomeController::class, 'index'])
            ->name('dashboard');

        Route::get('/calendar', WorkspaceCalendarController::class)
            ->name('calendar');

        Route::get('/calendar/manage', [CalendarManagementController::class, 'index'])
            ->name('calendar.manage');

        Route::post('/calendar-blocks', [CalendarBlockController::class, 'store'])
            ->name('calendar-blocks.store');

        Route::get('/bookings/{booking}/survey', [BookingMiceSurveyController::class, 'show'])
            ->whereNumber('booking')
            ->name('bookings.survey');

        Route::post('/bookings/{booking}/survey', [BookingMiceSurveyController::class, 'store'])
            ->whereNumber('booking')
            ->name('bookings.survey.store');

        Route::post('/calendar-blocks/bulk', [CalendarBlockController::class, 'bulkStore'])
            ->name('calendar-blocks.bulk-store');

        Route::put('/calendar-blocks/{calendarBlock}', [CalendarBlockController::class, 'update'])
            ->name('calendar-blocks.update');

        Route::delete('/calendar-blocks/{calendarBlock}', [CalendarBlockController::class, 'destroy'])
            ->name('calendar-blocks.destroy');

        Route::get('/calendar/analytics', [CalendarAnalyticsController::class, 'index'])
            ->name('calendar.analytics');

        Route::get('/calendar/analytics/export', [CalendarAnalyticsController::class, 'export'])
            ->name('calendar.analytics.export');

        Route::get('/calendar/analytics/print', [CalendarAnalyticsController::class, 'print'])
            ->name('calendar.analytics.print');

        Route::get('/bookings/availability', [BookingController::class, 'availability'])
            ->name('bookings.availability');

        Route::get('/bookings/analytics', [BookingAnalyticsController::class, 'index'])
            ->name('bookings.analytics');

        Route::get('/bookings/analytics/export', [BookingAnalyticsController::class, 'export'])
            ->name('bookings.analytics.export');

        Route::get('/bookings/analytics/print', [BookingAnalyticsController::class, 'print'])
            ->name('bookings.analytics.print');

        Route::get('/bookings/operations', [BookingOperationsController::class, 'index'])
            ->name('bookings.operations');

        Route::prefix('/bookings/audit')
            ->name('bookings.audit.')
            ->group(function () {
                Route::get('/', [BookingAuditController::class, 'index'])
                    ->name('index');

                Route::get('/export', [BookingAuditController::class, 'export'])
                    ->name('export');

                Route::get('/print', [BookingAuditController::class, 'printReport'])
                    ->name('print');
            });

        Route::get('/bookings/{booking}/survey', [BookingController::class, 'survey'])
            ->whereNumber('booking')
            ->name('bookings.survey');

        Route::post('/bookings/{booking}/survey', [BookingController::class, 'storeSurvey'])
            ->whereNumber('booking')
            ->name('bookings.survey.store');

        Route::get('/bookings/{booking}/survey-proof-image', [BookingController::class, 'surveyProofImage'])
            ->whereNumber('booking')
            ->name('bookings.survey-proof-image');

        Route::post('/bookings/{booking}/payments', [BookingController::class, 'storePayment'])
            ->whereNumber('booking')
            ->name('bookings.payments.store');

        Route::put('/bookings/{booking}/payments/{payment}', [BookingController::class, 'updatePayment'])
            ->whereNumber(['booking', 'payment'])
            ->name('bookings.payments.update');

        Route::get('/bookings/{booking}/payments/{payment}/proof', [BookingController::class, 'paymentProofImage'])
            ->whereNumber(['booking', 'payment'])
            ->name('bookings.payments.proof');

        Route::resource('/bookings', BookingController::class)
            ->only(['index', 'show', 'edit', 'update'])
            ->where(['booking' => '[0-9]+']);

        Route::get('/payments/review', [PaymentReviewController::class, 'index'])
            ->name('payments.review');

        Route::get('/reports/mice-registry', [MiceRegistryController::class, 'index'])
            ->name('reports.mice-registry');

        Route::get('/reports/mice-registry/print', [MiceRegistryController::class, 'print'])
            ->name('reports.mice-registry.print');

        Route::get('/reports/mice-registry/export', [MiceRegistryController::class, 'export'])
            ->name('reports.mice-registry.export');

        Route::get('/inquiries', [AdminInquiryController::class, 'index'])
            ->name('inquiries.index');

        Route::put('/inquiries/{inquiry}', [AdminInquiryController::class, 'update'])
            ->whereNumber('inquiry')
            ->name('inquiries.update');

        Route::get('/guidelines-contacts', [AdminGuidelinesContactController::class, 'index'])
            ->name('guidelines-contacts');

        Route::post('/guidelines-contacts', [AdminGuidelinesContactController::class, 'update'])
            ->name('guidelines-contacts.update');
    });

/*
|--------------------------------------------------------------------------
| Staff Workspace
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:staff'])
    ->prefix('staff')
    ->name('staff.')
    ->group(function () {
        Route::get('/dashboard', [WorkspaceHomeController::class, 'index'])
            ->name('dashboard');

        Route::get('/calendar', WorkspaceCalendarController::class)
            ->name('calendar');

        Route::get('/bookings/{booking}/survey', [BookingMiceSurveyController::class, 'show'])
            ->whereNumber('booking')
            ->name('bookings.survey');

        Route::post('/bookings/{booking}/survey', [BookingMiceSurveyController::class, 'store'])
            ->whereNumber('booking')
            ->name('bookings.survey.store');


        Route::get('/bookings/availability', [BookingController::class, 'availability'])
            ->name('bookings.availability');

        Route::get('/bookings/{booking}/survey', [BookingController::class, 'survey'])
            ->whereNumber('booking')
            ->name('bookings.survey');

        Route::post('/bookings/{booking}/survey', [BookingController::class, 'storeSurvey'])
            ->whereNumber('booking')
            ->name('bookings.survey.store');

        Route::get('/bookings/{booking}/survey-proof-image', [BookingController::class, 'surveyProofImage'])
            ->whereNumber('booking')
            ->name('bookings.survey-proof-image');

        Route::post('/bookings/{booking}/payments', [BookingController::class, 'storePayment'])
            ->whereNumber('booking')
            ->name('bookings.payments.store');

        Route::put('/bookings/{booking}/payments/{payment}', [BookingController::class, 'updatePayment'])
            ->whereNumber(['booking', 'payment'])
            ->name('bookings.payments.update');

        Route::get('/bookings/{booking}/payments/{payment}/proof', [BookingController::class, 'paymentProofImage'])
            ->whereNumber(['booking', 'payment'])
            ->name('bookings.payments.proof');

        Route::resource('/bookings', BookingController::class)
            ->only(['index', 'create', 'store', 'show', 'edit', 'update'])
            ->where(['booking' => '[0-9]+']);

        Route::get('/inquiries', [AdminInquiryController::class, 'index'])
            ->name('inquiries.index');

        Route::put('/inquiries/{inquiry}', [AdminInquiryController::class, 'update'])
            ->whereNumber('inquiry')
            ->name('inquiries.update');

        Route::get('/guidelines-contacts', [AdminGuidelinesContactController::class, 'index'])
            ->name('guidelines-contacts');
    });

/*
|--------------------------------------------------------------------------
| Public User / Client Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/my-dashboard', [WorkspaceHomeController::class, 'index'])
        ->name('user.dashboard');

    Route::get('/book', [BookingController::class, 'create'])
        ->name('user.bookings.create');

    Route::post('/book', [BookingController::class, 'store'])
        ->name('user.bookings.store');

    Route::get('/my-bookings', [BookingController::class, 'index'])
        ->name('user.bookings.index');

    Route::get('/my-bookings/{booking}', [BookingController::class, 'show'])
        ->whereNumber('booking')
        ->name('user.bookings.show');

    Route::get('/bookings/{booking}/survey', [BookingMiceSurveyController::class, 'show'])
        ->whereNumber('booking')
        ->name('bookings.survey');

    Route::post('/bookings/{booking}/survey', [BookingMiceSurveyController::class, 'store'])
        ->whereNumber('booking')
        ->name('bookings.survey.store');

    Route::get('/my-bookings/{booking}/survey', [BookingController::class, 'survey'])
        ->whereNumber('booking')
        ->name('user.bookings.survey');

    Route::post('/my-bookings/{booking}/survey', [BookingController::class, 'storeSurvey'])
        ->whereNumber('booking')
        ->name('user.bookings.survey.store');

    Route::get('/my-bookings/{booking}/edit', [BookingController::class, 'edit'])
        ->whereNumber('booking')
        ->name('user.bookings.edit');

    Route::put('/my-bookings/{booking}', [BookingController::class, 'update'])
        ->whereNumber('booking')
        ->name('user.bookings.update');

    Route::get('/my-bookings/{booking}/survey-proof-image', [BookingController::class, 'surveyProofImage'])
        ->whereNumber('booking')
        ->name('user.bookings.survey-proof-image');

    Route::post('/my-bookings/{booking}/payments', [BookingController::class, 'storePayment'])
        ->whereNumber('booking')
        ->name('user.bookings.payments.store');

    Route::get('/my-bookings/{booking}/payments/{payment}/proof', [BookingController::class, 'paymentProofImage'])
        ->whereNumber(['booking', 'payment'])
        ->name('user.bookings.payments.proof');
});

/*
|--------------------------------------------------------------------------
| Notifications
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index'])
        ->name('notifications.index');

    Route::get('/notifications/summary', [NotificationController::class, 'summary'])
        ->name('notifications.summary');

    Route::get('/notifications/{notification}/open', [NotificationController::class, 'open'])
        ->name('notifications.open');

    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])
        ->name('notifications.read-all');
});

/*
|--------------------------------------------------------------------------
| Legacy Compatibility Routes
|--------------------------------------------------------------------------
| Keep these only while older buttons/imports are still being cleaned.
| IMPORTANT: Do not create a legacy /calendar redirect here because /calendar
| belongs to the public website.
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/calendar/manage', [CalendarManagementController::class, 'index'])
        ->middleware('role:admin|manager')
        ->name('calendar.manage');

    Route::get('/calendar/analytics', [CalendarAnalyticsController::class, 'index'])
        ->middleware('role:admin|manager')
        ->name('calendar.analytics');

    Route::get('/calendar/analytics/export', [CalendarAnalyticsController::class, 'export'])
        ->middleware('role:admin|manager')
        ->name('calendar.analytics.export');

    Route::get('/calendar/analytics/print', [CalendarAnalyticsController::class, 'print'])
        ->middleware('role:admin|manager')
        ->name('calendar.analytics.print');

    Route::post('/calendar-blocks', [CalendarBlockController::class, 'store'])
        ->middleware('role:admin|manager')
        ->name('calendar-blocks.store');

    Route::post('/calendar-blocks/bulk', [CalendarBlockController::class, 'bulkStore'])
        ->middleware('role:admin|manager')
        ->name('calendar-blocks.bulk-store');

    Route::put('/calendar-blocks/{calendarBlock}', [CalendarBlockController::class, 'update'])
        ->middleware('role:admin|manager')
        ->name('calendar-blocks.update');

    Route::delete('/calendar-blocks/{calendarBlock}', [CalendarBlockController::class, 'destroy'])
        ->middleware('role:admin|manager')
        ->name('calendar-blocks.destroy');

    Route::get('/bookings/availability', [BookingController::class, 'availability'])
        ->middleware('permission:bookings.view')
        ->name('bookings.availability');

    Route::get('/bookings/analytics', [BookingAnalyticsController::class, 'index'])
        ->middleware('permission:bookings.view')
        ->name('bookings.analytics');

    Route::get('/bookings/analytics/export', [BookingAnalyticsController::class, 'export'])
        ->middleware('permission:bookings.view')
        ->name('bookings.analytics.export');

    Route::get('/bookings/analytics/print', [BookingAnalyticsController::class, 'print'])
        ->middleware('permission:bookings.view')
        ->name('bookings.analytics.print');

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

    Route::prefix('/bookings/audit')
        ->middleware('role:admin|manager')
        ->name('bookings.audit.')
        ->group(function () {
            Route::get('/', [BookingAuditController::class, 'index'])
                ->name('index');

            Route::get('/export', [BookingAuditController::class, 'export'])
                ->name('export');

            Route::get('/print', [BookingAuditController::class, 'printReport'])
                ->name('print');
        });

    Route::get('/bookings/{booking}/survey', [BookingController::class, 'survey'])
        ->middleware('permission:bookings.create')
        ->whereNumber('booking')
        ->name('bookings.survey');

    Route::post('/bookings/{booking}/survey', [BookingController::class, 'storeSurvey'])
        ->middleware('permission:bookings.create')
        ->whereNumber('booking')
        ->name('bookings.survey.store');

    Route::get('/bookings/{booking}/survey-proof-image', [BookingController::class, 'surveyProofImage'])
        ->middleware('permission:bookings.view')
        ->whereNumber('booking')
        ->name('bookings.survey-proof-image');

    Route::post('/bookings/{booking}/payments', [BookingController::class, 'storePayment'])
        ->middleware('permission:bookings.view')
        ->whereNumber('booking')
        ->name('bookings.payments.store');

    Route::put('/bookings/{booking}/payments/{payment}', [BookingController::class, 'updatePayment'])
        ->middleware('permission:payments.manage')
        ->whereNumber(['booking', 'payment'])
        ->name('bookings.payments.update');

    Route::get('/bookings/{booking}/payments/{payment}/proof', [BookingController::class, 'paymentProofImage'])
        ->middleware('permission:bookings.view')
        ->whereNumber(['booking', 'payment'])
        ->name('bookings.payments.proof');

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
        ->whereNumber('booking')
        ->name('bookings.show');

    Route::get('/bookings/{booking}/edit', [BookingController::class, 'edit'])
        ->middleware('permission:bookings.update')
        ->whereNumber('booking')
        ->name('bookings.edit');

    Route::put('/bookings/{booking}', [BookingController::class, 'update'])
        ->middleware('permission:bookings.update')
        ->whereNumber('booking')
        ->name('bookings.update');

    Route::delete('/bookings/{booking}', [BookingController::class, 'destroy'])
        ->middleware('permission:bookings.delete')
        ->whereNumber('booking')
        ->name('bookings.destroy');

    Route::get('/payments/review', [PaymentReviewController::class, 'index'])
        ->middleware('permission:payments.manage')
        ->name('payments.review');

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
        ->whereNumber('miceRecord')
        ->name('reports.mice-registry.edit');

    Route::put('/reports/mice-registry/{miceRecord}', [MiceRegistryController::class, 'update'])
        ->middleware('role:admin|manager')
        ->whereNumber('miceRecord')
        ->name('reports.mice-registry.update');

    Route::delete('/reports/mice-registry/{miceRecord}', [MiceRegistryController::class, 'destroy'])
        ->middleware('role:admin|manager')
        ->whereNumber('miceRecord')
        ->name('reports.mice-registry.destroy');

    Route::resource('services', ServiceController::class)
        ->middleware('permission:services.manage');

    Route::resource('service-types', ServiceTypeController::class)
        ->middleware('permission:service_types.manage');

    Route::get('/users/roles', [UserRoleController::class, 'index'])
        ->middleware('permission:users.manage')
        ->name('users.roles');

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
