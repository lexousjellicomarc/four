<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookingPaymentRequest;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingPaymentRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Http\Resources\BookingResource;
use App\Http\Resources\ServiceResource;
use App\Http\Resources\ServiceTypeResource;
use App\Models\Booking;
use App\Models\BookingPayment;
use App\Models\MiceRecord;
use App\Models\Service;
use App\Models\ServiceType;
use App\Services\Contracts\BookingServiceInterface;
use App\Services\NotificationService;
use App\Support\WorkspaceAccess;
use App\Support\WorkspacePage;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function __construct(
        private readonly BookingServiceInterface $bookings,
        private readonly NotificationService $notifications,
    ) {
    }

    public function index(Request $request): Response
    {
        abort_unless($request->user(), 403);

        $perPage = (int) $request->integer('per_page', 10);
        $perPage = max(5, min($perPage, 100));

        $rawFilters = $request->only([
            'booking_status',
            'status',
            'payment_status',
            'service_id',
            'q',
            'date_from',
            'date_to',
            'sort',
        ]);

        if (empty($rawFilters['booking_status']) && ! empty($rawFilters['status'])) {
            $rawFilters['booking_status'] = $rawFilters['status'];
        }

        $filters = WorkspaceAccess::isStaffLike($request)
            ? WorkspaceAccess::staffFilters($rawFilters)
            : WorkspaceAccess::clientSafeFilters($rawFilters);

        if (empty($filters['sort'])) {
            $filters['sort'] = WorkspaceAccess::isClient($request) ? 'newest' : 'upcoming';
        }

        $paginated = $this->bookings->paginate($filters, $perPage);

        $paginated->getCollection()->loadMissing([
            'service.serviceType',
            'bookingServices.service.serviceType',
            'payments',
            'createdBy',
            'miceRecord',
        ]);

        $statusCounts = $this->bookings->getStatusCounts($filters);

        $services = WorkspaceAccess::isStaffLike($request)
            ? ServiceResource::collection(
                Service::with('serviceType')->orderBy('name')->get()
            )->resolve($request)
            : [];

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/index'), [
            'bookings' => BookingResource::collection($paginated)
                ->response()
                ->getData(true),
            'services' => $services,
            'filters' => $filters,
            'statusCounts' => $statusCounts,
            'workspaceRole' => WorkspaceAccess::role($request),
            'isStaffWorkspace' => WorkspaceAccess::isStaffLike($request),
            'canCreateBooking' => WorkspaceAccess::canCreateBooking($request),
            'canManagePayments' => WorkspaceAccess::canManagePayments($request),
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user(), 403);
        abort_unless(WorkspaceAccess::canCreateBooking($request), 403);

        $types = ServiceType::with([
            'services' => fn ($query) => $query
                ->with('serviceType')
                ->orderBy('name'),
        ])
            ->orderBy('name')
            ->get();

        $serviceTypesWithServices = ServiceTypeResource::collection($types)->resolve($request);

        $services = ServiceResource::collection(
            Service::with('serviceType')->orderBy('name')->get()
        )->resolve($request);

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/create'), [
            'serviceTypes' => $serviceTypesWithServices,
            'services' => $services,
            'unavailableDates' => [],
            'initialSchedule' => $this->extractInitialSchedule($request),
            'initialVenue' => trim((string) $request->query('venue', $request->query('area', ''))) ?: null,
            'initialEventType' => trim((string) $request->query('event_type', '')) ?: null,
            'initialGuests' => $request->filled('guests') ? (int) $request->query('guests') : null,
            'workspaceRole' => WorkspaceAccess::role($request),
            'isStaffWorkspace' => WorkspaceAccess::isStaffLike($request),
        ]);
    }

    public function store(StoreBookingRequest $request): RedirectResponse
    {
        abort_unless(WorkspaceAccess::canCreateBooking($request), 403);

        $data = $request->validated();

        /*
         * The old survey proof upload is no longer part of booking creation.
         * Every booking now continues to the built-in MICE report page.
         */
        unset(
            $data['survey_proof_image'],
            $data['survey_proof_image_path'],
            $data['survey_proof_image_name'],
            $data['survey_proof_image_mime']
        );

        if (WorkspaceAccess::isClient($request)) {
            $data = $this->forceClientBookingDefaults($request, $data);
        } elseif ($request->user()) {
            $data['created_by_user_id'] = $data['created_by_user_id'] ?? $request->user()->id;
        }

        $booking = $this->bookings->create($data);

        return redirect()
            ->route(WorkspacePage::routeName($request, 'bookings.survey'), $booking->id)
            ->with('success', 'Booking details saved. Complete the required MICE report.');
    }

    public function survey(Request $request, Booking $booking): Response
    {
        $this->ensureBookingAccess($request, $booking);

        $booking->loadMissing([
            'service.serviceType',
            'bookingServices.service.serviceType',
            'payments',
            'createdBy',
            'miceRecord',
        ]);

        $record = MiceRecord::query()
            ->where('booking_id', $booking->id)
            ->first();

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/survey'), [
            'workspaceRole' => WorkspaceAccess::role($request),
            'isStaffWorkspace' => WorkspaceAccess::isStaffLike($request),
            'booking' => $this->bookingMicePayload($booking),
            'miceRecord' => $record ? $this->micePayload($record) : null,
            'defaults' => $this->miceDefaultsFromBooking($booking),
            'formOptions' => [
                'eventCategories' => [
                    'Meeting',
                    'Incentive',
                    'Convention',
                    'Exhibition',
                    'Government',
                    'Cultural',
                    'Corporate',
                    'Social',
                    'Other',
                ],
                'organizerTypes' => [
                    'Private',
                    'Government',
                    'NGO',
                    'Academe',
                    'Religious',
                    'Corporate',
                    'Association',
                    'Other',
                ],
                'enterpriseGroups' => [
                    'PTE',
                    'STE',
                    'UNCLASSIFIED',
                ],
            ],
        ]);
    }

    public function storeSurvey(Request $request, Booking $booking): RedirectResponse
    {
        $this->ensureBookingAccess($request, $booking);

        $data = $request->validate([
            'year_recorded' => ['required', 'integer', 'min:2020', 'max:2100'],
            'enterprise_group' => ['nullable', 'string', 'max:50'],
            'btc_group_code' => ['nullable', 'string', 'max:50'],

            'event_name' => ['required', 'string', 'max:255'],
            'event_category' => ['required', 'string', 'max:255'],
            'type_of_event' => ['required', 'string', 'max:255'],
            'venue_area' => ['required', 'string', 'max:255'],
            'event_date_from' => ['required', 'date'],
            'event_date_to' => ['required', 'date', 'after_or_equal:event_date_from'],

            'organization_name' => ['required', 'string', 'max:255'],
            'organizer_name' => ['nullable', 'string', 'max:255'],
            'organizer_type' => ['nullable', 'string', 'max:255'],
            'contact_person' => ['required', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],

            'local_male_participants' => ['nullable', 'integer', 'min:0'],
            'local_female_participants' => ['nullable', 'integer', 'min:0'],
            'domestic_male_participants' => ['nullable', 'integer', 'min:0'],
            'domestic_female_participants' => ['nullable', 'integer', 'min:0'],
            'foreign_male_participants' => ['nullable', 'integer', 'min:0'],
            'foreign_female_participants' => ['nullable', 'integer', 'min:0'],

            'main_origin_country' => ['nullable', 'string', 'max:255'],
            'main_origin_province' => ['nullable', 'string', 'max:255'],
            'main_origin_city' => ['nullable', 'string', 'max:255'],

            'same_day_visitors' => ['nullable', 'integer', 'min:0'],
            'overnight_visitors' => ['nullable', 'integer', 'min:0'],
            'estimated_room_nights' => ['nullable', 'integer', 'min:0'],
            'estimated_tourism_receipts' => ['nullable', 'numeric', 'min:0'],

            'total_employees' => ['nullable', 'integer', 'min:0'],
            'female_employees' => ['nullable', 'integer', 'min:0'],
            'male_employees' => ['nullable', 'integer', 'min:0'],

            'permit_to_engage' => ['nullable', 'boolean'],
            'dot_accredited' => ['nullable', 'boolean'],
            'active_member' => ['nullable', 'boolean'],

            'remarks' => ['nullable', 'string', 'max:2000'],
            'certified' => ['accepted'],
        ], [
            'certified.accepted' => 'Please certify that the MICE report information is accurate.',
        ]);

        unset($data['certified']);

        foreach ([
            'local_male_participants',
            'local_female_participants',
            'domestic_male_participants',
            'domestic_female_participants',
            'foreign_male_participants',
            'foreign_female_participants',
            'same_day_visitors',
            'overnight_visitors',
            'estimated_room_nights',
            'total_employees',
            'female_employees',
            'male_employees',
        ] as $field) {
            $data[$field] = max(0, (int) ($data[$field] ?? 0));
        }

        $totalParticipants =
            $data['local_male_participants']
            + $data['local_female_participants']
            + $data['domestic_male_participants']
            + $data['domestic_female_participants']
            + $data['foreign_male_participants']
            + $data['foreign_female_participants'];

        if ($totalParticipants < 1) {
            return back()
                ->withErrors(['total_participants' => 'At least one participant must be encoded.'])
                ->withInput();
        }

        $from = Carbon::parse($data['event_date_from'])->startOfDay();
        $to = Carbon::parse($data['event_date_to'])->startOfDay();

        $existing = MiceRecord::query()
            ->where('booking_id', $booking->id)
            ->first();

        $data['booking_id'] = $booking->id;
        $data['record_no'] = $existing?->record_no ?: $this->nextMiceRecordNumber((int) $data['year_recorded']);
        $data['event_days'] = max(1, $from->diffInDays($to) + 1);
        $data['total_participants'] = $totalParticipants;
        $data['estimated_tourism_receipts'] = round((float) ($data['estimated_tourism_receipts'] ?? 0), 2);
        $data['permit_to_engage'] = (bool) ($data['permit_to_engage'] ?? false);
        $data['dot_accredited'] = (bool) ($data['dot_accredited'] ?? false);
        $data['active_member'] = (bool) ($data['active_member'] ?? false);
        $data['status'] = 'submitted';
        $data['submitted_at'] = now();
        $data['updated_by_user_id'] = $request->user()?->id;

        if (! $existing) {
            $data['submitted_by_user_id'] = $request->user()?->id;
        }

        MiceRecord::query()->updateOrCreate(
            ['booking_id' => $booking->id],
            $data,
        );

        return redirect()
            ->route(WorkspacePage::routeName($request, 'bookings.show'), $booking->id)
            ->with('success', 'MICE report submitted successfully.');
    }

    public function show(Request $request, Booking $booking): Response
    {
        $this->ensureBookingAccess($request, $booking);

        $this->markAsViewed($request, $booking);
        $this->bookings->syncLifecycleStatus($booking);

        $booking->refresh()->loadMissing([
            'service.serviceType',
            'bookingServices.service.serviceType',
            'payments',
            'createdBy',
            'lifecycleEvents.actor',
            'miceRecord',
        ]);

        $services = WorkspaceAccess::isStaffLike($request)
            ? ServiceResource::collection(
                Service::with('serviceType')->orderBy('name')->get()
            )->resolve($request)
            : [];

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/show'), [
            'booking' => (new BookingResource($booking))->resolve($request),
            'services' => $services,
            'unavailableDates' => $this->bookings->getUnavailableDates($booking->id),
            'workspaceRole' => WorkspaceAccess::role($request),
            'isStaffWorkspace' => WorkspaceAccess::isStaffLike($request),
            'canUpdateBooking' => WorkspaceAccess::canUpdateBooking($request, $booking),
            'canDeleteBooking' => WorkspaceAccess::canDeleteBooking($request, $booking),
            'canManagePayments' => WorkspaceAccess::canManagePayments($request),
        ]);
    }

    public function surveyProofImage(Request $request, Booking $booking)
    {
        $this->ensureBookingAccess($request, $booking);

        $file = $this->locateStoredFile($booking->survey_proof_image_path);

        if (! $file) {
            abort(404);
        }

        $ext = pathinfo($file['path'], PATHINFO_EXTENSION);
        $filename = 'legacy-survey-proof-' . $booking->id . ($ext ? ('.' . $ext) : '');
        $filename = preg_replace('/[^A-Za-z0-9._-]+/', '_', $filename) ?: 'legacy-survey-proof';

        return $this->streamStoredFile($file['disk'], $file['path'], $filename);
    }

    public function paymentProofImage(Request $request, Booking $booking, BookingPayment $payment)
    {
        $this->ensureBookingAccess($request, $booking);

        if ((int) $payment->booking_id !== (int) $booking->id) {
            abort(404);
        }

        $file = $this->locateStoredFile($payment->proof_image_path);

        if (! $file) {
            abort(404);
        }

        $ext = pathinfo($file['path'], PATHINFO_EXTENSION);
        $filename = 'payment-proof-' . $booking->id . '-' . $payment->id . ($ext ? ('.' . $ext) : '');
        $filename = preg_replace('/[^A-Za-z0-9._-]+/', '_', $filename) ?: 'payment-proof';

        return $this->streamStoredFile($file['disk'], $file['path'], $filename);
    }

    public function edit(Request $request, Booking $booking): Response
    {
        $this->ensureBookingAccess($request, $booking);
        abort_unless(WorkspaceAccess::canUpdateBooking($request, $booking), 403);

        $this->markAsViewed($request, $booking);
        $this->bookings->syncLifecycleStatus($booking);

        $booking->refresh()->loadMissing([
            'service.serviceType',
            'bookingServices.service.serviceType',
            'payments',
            'createdBy',
            'lifecycleEvents.actor',
            'miceRecord',
        ]);

        $types = ServiceType::with([
            'services' => fn ($query) => $query
                ->with('serviceType')
                ->orderBy('name'),
        ])
            ->orderBy('name')
            ->get();

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/edit'), [
            'booking' => (new BookingResource($booking))->resolve($request),
            'serviceTypes' => ServiceTypeResource::collection($types)->resolve($request),
            'services' => ServiceResource::collection(
                Service::with('serviceType')->orderBy('name')->get()
            )->resolve($request),
            'unavailableDates' => $this->bookings->getUnavailableDates($booking->id),
            'workspaceRole' => WorkspaceAccess::role($request),
            'isStaffWorkspace' => WorkspaceAccess::isStaffLike($request),
        ]);
    }

    public function update(UpdateBookingRequest $request, Booking $booking): RedirectResponse
    {
        $this->ensureBookingAccess($request, $booking);
        abort_unless(WorkspaceAccess::canUpdateBooking($request, $booking), 403);

        $data = $request->validated();

        unset(
            $data['survey_proof_image'],
            $data['survey_proof_image_path'],
            $data['survey_proof_image_name'],
            $data['survey_proof_image_mime']
        );

        if (WorkspaceAccess::isClient($request)) {
            $data = $this->clientSafeUpdatePayload($request, $data);
        }

        $data = $this->managerSafeUpdatePayload($request, $data);

        $booking = $this->bookings->update($booking, $data);

        return redirect()
            ->route(WorkspacePage::routeName($request, 'bookings.show'), $booking->id)
            ->with('success', 'Booking updated.');
    }

    public function destroy(Request $request, Booking $booking): RedirectResponse
    {
        $this->ensureBookingAccess($request, $booking);
        abort_unless(WorkspaceAccess::canDeleteBooking($request, $booking), 403);

        $this->bookings->delete($booking);

        return redirect()
            ->route(WorkspacePage::routeName($request, 'bookings.index'))
            ->with('success', 'Booking deleted successfully.');
    }

    public function storePayment(StoreBookingPaymentRequest $request, Booking $booking): RedirectResponse
    {
        $this->ensureBookingAccess($request, $booking);

        $data = $request->validated();
        $canManage = WorkspaceAccess::canManagePayments($request);
        $data = $this->normalizePaymentPayload($request, $data, $canManage);

        try {
            $booking->payments()->create($data);
        } catch (\Throwable $exception) {
            if (! empty($data['proof_image_path'])) {
                $this->deleteStoredFile($data['proof_image_path']);
            }

            throw $exception;
        }

        $this->bookings->recalculatePaymentStatus($booking->refresh());

        return redirect()
            ->back()
            ->with('success', $canManage ? 'Payment recorded successfully.' : 'Payment proof submitted for review.');
    }

    public function updatePayment(
        UpdateBookingPaymentRequest $request,
        Booking $booking,
        BookingPayment $payment,
    ): RedirectResponse {
        $this->ensureBookingAccess($request, $booking);
        abort_unless(WorkspaceAccess::canManagePayments($request), 403);

        if ((int) $payment->booking_id !== (int) $booking->id) {
            abort(404);
        }

        $data = $request->validated();
        $oldProofPath = $payment->proof_image_path;

        $data = $this->normalizePaymentPayload($request, $data, true, $payment);

        if (! array_key_exists('proof_image_path', $data)) {
            $data['proof_image_path'] = $oldProofPath;
            $data['proof_image_name'] = $payment->proof_image_name;
            $data['proof_image_mime'] = $payment->proof_image_mime;
        }

        $newProofPath = $data['proof_image_path'] ?? null;

        try {
            $payment->update($data);
        } catch (\Throwable $exception) {
            if ($newProofPath && $newProofPath !== $oldProofPath) {
                $this->deleteStoredFile($newProofPath);
            }

            throw $exception;
        }

        if ($newProofPath && $newProofPath !== $oldProofPath) {
            $this->deleteStoredFile($oldProofPath);
        }

        $this->bookings->recalculatePaymentStatus($booking->refresh());

        return redirect()
            ->back()
            ->with('success', 'Payment updated successfully.');
    }

    public function availability(Request $request): JsonResponse
    {
        $date = trim((string) $request->query('date', ''));

        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return response()->json([
                'message' => 'Invalid date. Use YYYY-MM-DD format.',
            ], 422);
        }

        $excludeIdRaw = $request->query('exclude_booking_id');
        $excludeId = is_numeric($excludeIdRaw) ? (int) $excludeIdRaw : null;

        $area = trim((string) $request->query('venue', $request->query('area', '')));
        $availability = $this->bookings->getDailyAvailability($date, $excludeId, $area !== '' ? $area : null);

        if (! isset($availability['busy']) || ! is_array($availability['busy'])) {
            $availability['busy'] = [];
        }

        if (! isset($availability['free']) || ! is_array($availability['free'])) {
            $availability['free'] = [];
        }

        if (! isset($availability['blocks']) || ! is_array($availability['blocks'])) {
            $availability['blocks'] = [];
        }

        if (! isset($availability['is_fully_booked'])) {
            $availability['is_fully_booked'] = false;
        }

        $availability['venue'] = $area !== '' ? $area : null;

        if (! WorkspaceAccess::isStaffLike($request)) {
            return response()->json([
                'date' => $availability['date'] ?? $date,
                'venue' => $availability['venue'] ?? null,
                'blocks' => $availability['blocks'] ?? [],
                'is_fully_booked' => (bool) ($availability['is_fully_booked'] ?? false),
            ]);
        }

        return response()->json($availability);
    }

    private function normalizePaymentPayload(
        Request $request,
        array $data,
        bool $canManage,
        ?BookingPayment $existingPayment = null,
    ): array {
        $amount = round((float) ($data['amount'] ?? 0), 2);

        $gateway = strtolower(trim((string) ($data['payment_gateway'] ?? '')));
        $method = strtolower(trim((string) ($data['payment_method'] ?? 'online')));
        $paymentType = strtolower(trim((string) ($data['payment_type'] ?? 'down')));
        $status = strtolower(trim((string) ($data['status'] ?? 'pending')));

        if ($gateway === 'cash') {
            $method = 'cash';
        } elseif ($gateway === 'card') {
            $method = 'card';
        } elseif ($gateway === 'manual') {
            $method = 'manual';
        } elseif ($method === '') {
            $method = 'online';
        }

        $status = match ($status) {
            'verified' => 'verified',
            'paid' => 'paid',
            'confirmed' => 'confirmed',
            'failed' => 'failed',
            'declined' => 'declined',
            'refunded' => 'refunded',
            default => 'pending',
        };

        if (! $canManage) {
            $status = 'pending';
        }

        $normalized = [
            'amount' => $amount,
            'payment_method' => $method,
            'payment_gateway' => $gateway !== '' ? $gateway : null,
            'payment_type' => $paymentType !== '' ? $paymentType : 'down',
            'transaction_reference' => trim((string) ($data['transaction_reference'] ?? '')) ?: null,
            'remarks' => trim((string) ($data['remarks'] ?? '')) ?: null,
            'status' => $status,
            'payer_name' => trim((string) ($data['payer_name'] ?? '')) ?: null,
            'card_holder_name' => trim((string) ($data['card_holder_name'] ?? '')) ?: null,
            'card_expiration' => trim((string) ($data['card_expiration'] ?? '')) ?: null,
            'marketing_consent' => (bool) ($data['marketing_consent'] ?? false),
        ];

        $cardNumber = preg_replace('/\D+/', '', (string) $request->input('card_number', ''));

        $normalized['card_last_four'] = $cardNumber !== ''
            ? substr($cardNumber, -4)
            : ($existingPayment?->card_last_four);

        if ($request->hasFile('proof_image')) {
            $proofFile = $request->file('proof_image');

            if ($proofFile instanceof UploadedFile) {
                $stored = $proofFile->store('booking-payment-proofs', 'local');

                if ($stored) {
                    $normalized['proof_image_path'] = $stored;
                    $normalized['proof_image_name'] = $proofFile->getClientOriginalName();
                    $normalized['proof_image_mime'] = $proofFile->getClientMimeType() ?: $proofFile->getMimeType();
                }
            }
        }

        $normalized['payment_meta'] = array_filter([
            'gateway' => $gateway !== '' ? $gateway : null,
            'payment_type' => $paymentType !== '' ? $paymentType : null,
            'card_holder_name' => trim((string) $request->input('card_holder_name', '')) ?: null,
            'card_expiration' => trim((string) $request->input('card_expiration', '')) ?: null,
            'marketing_consent' => (bool) $request->boolean('marketing_consent'),
            'submitted_by_user_id' => $request->user()?->id,
        ], static fn ($value) => $value !== null && $value !== '');

        $now = now();

        $normalized['paid_at'] = $existingPayment?->paid_at;
        $normalized['verified_at'] = $existingPayment?->verified_at;
        $normalized['approved_at'] = $existingPayment?->approved_at;
        $normalized['declined_at'] = $existingPayment?->declined_at;
        $normalized['failed_at'] = $existingPayment?->failed_at;

        if (in_array($status, ['confirmed', 'verified', 'paid'], true)) {
            $normalized['paid_at'] = $normalized['paid_at'] ?: $now;
            $normalized['verified_at'] = $normalized['verified_at'] ?: $now;
            $normalized['approved_at'] = $normalized['approved_at'] ?: $now;
            $normalized['declined_at'] = null;
            $normalized['failed_at'] = null;
        } elseif ($status === 'declined') {
            $normalized['declined_at'] = $now;
            $normalized['failed_at'] = null;
        } elseif ($status === 'failed') {
            $normalized['failed_at'] = $now;
            $normalized['declined_at'] = null;
        } elseif ($status === 'pending') {
            $normalized['declined_at'] = null;
            $normalized['failed_at'] = null;

            if (! $existingPayment) {
                $normalized['paid_at'] = null;
                $normalized['verified_at'] = null;
                $normalized['approved_at'] = null;
            }
        }

        return $normalized;
    }

    private function ensureBookingAccess(Request $request, Booking $booking): void
    {
        abort_unless(WorkspaceAccess::canViewBooking($request, $booking), 403);
    }

    private function forceClientBookingDefaults(Request $request, array $data): array
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $data['client_email'] = strtolower(trim((string) $user->email));
        $data['created_by_user_id'] = $user->id;
        $data['booking_status'] = 'pending';
        $data['payment_status'] = 'unpaid';

        unset(
            $data['approved_by_user_id'],
            $data['cancelled_by_user_id'],
            $data['declined_by_user_id'],
            $data['completed_by_user_id']
        );

        return $data;
    }

    private function clientSafeUpdatePayload(Request $request, array $data): array
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $allowed = [
            'client_name',
            'company_name',
            'client_contact_number',
            'client_email',
            'client_address',
            'client_region',
            'client_province',
            'client_city_municipality',
            'client_barangay',
            'client_zip_code',
            'client_street_address',
            'head_of_organization',
            'organization_type',
            'type_of_event',
            'number_of_guests',
        ];

        $safe = array_intersect_key($data, array_flip($allowed));
        $safe['client_email'] = strtolower(trim((string) $user->email));

        return $safe;
    }

    private function managerSafeUpdatePayload(Request $request, array $data): array
    {
        if (WorkspaceAccess::role($request) !== 'manager') {
            return $data;
        }

        unset(
            $data['created_by_user_id'],
            $data['approved_by_user_id'],
            $data['cancelled_by_user_id'],
            $data['declined_by_user_id'],
            $data['completed_by_user_id']
        );

        return $data;
    }

    private function markAsViewed(Request $request, Booking $booking): void
    {
        $user = $request->user();

        if (! $user || ! method_exists($booking, 'views')) {
            return;
        }

        try {
            $booking->views()->updateOrCreate(
                ['user_id' => $user->id],
                ['viewed_at' => now()],
            );
        } catch (\Throwable) {
            // View tracking should never block booking access.
        }
    }

    private function bookingMicePayload(Booking $booking): array
    {
        return (new BookingResource($booking))->resolve(request());
    }

    private function miceDefaultsFromBooking(Booking $booking): array
    {
        $start = $booking->booking_date_from ? Carbon::parse($booking->booking_date_from) : now();
        $end = $booking->booking_date_to ? Carbon::parse($booking->booking_date_to) : $start;

        $venueArea = $booking->service?->serviceType?->name
            ?: $booking->bookingServices->first()?->service?->serviceType?->name
            ?: $booking->service?->name
            ?: 'Baguio Convention and Cultural Center';

        return [
            'year_recorded' => $start->year,
            'event_name' => $booking->type_of_event,
            'event_category' => $this->guessMiceCategory((string) $booking->type_of_event),
            'type_of_event' => $booking->type_of_event,
            'venue_area' => $venueArea,
            'event_date_from' => $start->toDateString(),
            'event_date_to' => $end->toDateString(),

            'organization_name' => $booking->company_name ?: $booking->client_name,
            'organizer_name' => $booking->head_of_organization,
            'organizer_type' => $booking->organization_type,
            'contact_person' => $booking->client_name,
            'contact_number' => $booking->client_contact_number,
            'email' => $booking->client_email,
            'address' => $booking->client_address,

            'total_participants' => (int) ($booking->number_of_guests ?? 0),
        ];
    }

    private function micePayload(MiceRecord $record): array
    {
        return [
            'id' => $record->id,
            'booking_id' => $record->booking_id,
            'record_no' => $record->record_no,
            'year_recorded' => $record->year_recorded,
            'status' => $record->status,

            'enterprise_group' => $record->enterprise_group,
            'btc_group_code' => $record->btc_group_code,

            'event_name' => $record->event_name,
            'event_category' => $record->event_category,
            'type_of_event' => $record->type_of_event,
            'venue_area' => $record->venue_area,
            'event_date_from' => optional($record->event_date_from)->toDateString(),
            'event_date_to' => optional($record->event_date_to)->toDateString(),
            'event_days' => $record->event_days,

            'organization_name' => $record->organization_name,
            'organizer_name' => $record->organizer_name,
            'organizer_type' => $record->organizer_type,
            'contact_person' => $record->contact_person,
            'contact_number' => $record->contact_number,
            'email' => $record->email,
            'address' => $record->address,

            'local_male_participants' => $record->local_male_participants,
            'local_female_participants' => $record->local_female_participants,
            'domestic_male_participants' => $record->domestic_male_participants,
            'domestic_female_participants' => $record->domestic_female_participants,
            'foreign_male_participants' => $record->foreign_male_participants,
            'foreign_female_participants' => $record->foreign_female_participants,
            'total_participants' => $record->total_participants,

            'main_origin_country' => $record->main_origin_country,
            'main_origin_province' => $record->main_origin_province,
            'main_origin_city' => $record->main_origin_city,

            'same_day_visitors' => $record->same_day_visitors,
            'overnight_visitors' => $record->overnight_visitors,
            'estimated_room_nights' => $record->estimated_room_nights,
            'estimated_tourism_receipts' => $record->estimated_tourism_receipts,

            'total_employees' => $record->total_employees,
            'female_employees' => $record->female_employees,
            'male_employees' => $record->male_employees,

            'permit_to_engage' => (bool) $record->permit_to_engage,
            'dot_accredited' => (bool) $record->dot_accredited,
            'active_member' => (bool) $record->active_member,

            'remarks' => $record->remarks,
            'submitted_at' => optional($record->submitted_at)->toIso8601String(),
        ];
    }

    private function guessMiceCategory(string $eventType): string
    {
        $value = strtolower($eventType);

        if (str_contains($value, 'exhibit') || str_contains($value, 'expo') || str_contains($value, 'fair')) {
            return 'Exhibition';
        }

        if (str_contains($value, 'convention') || str_contains($value, 'conference') || str_contains($value, 'summit')) {
            return 'Convention';
        }

        if (str_contains($value, 'meeting') || str_contains($value, 'seminar') || str_contains($value, 'training') || str_contains($value, 'workshop')) {
            return 'Meeting';
        }

        if (str_contains($value, 'government')) {
            return 'Government';
        }

        if (str_contains($value, 'cultural') || str_contains($value, 'concert')) {
            return 'Cultural';
        }

        if (str_contains($value, 'corporate')) {
            return 'Corporate';
        }

        return 'Other';
    }

    private function nextMiceRecordNumber(int $year): int
    {
        return ((int) MiceRecord::query()
            ->where('year_recorded', $year)
            ->max('record_no')) + 1;
    }

    private function extractInitialSchedule(Request $request): array
    {
        $date = trim((string) $request->query('date', ''));
        $start = trim((string) $request->query('start', ''));
        $end = trim((string) $request->query('end', ''));

        $dateFrom = trim((string) $request->query('date_from', ''));
        $dateTo = trim((string) $request->query('date_to', ''));

        $startDate = trim((string) $request->query('start_date', ''));
        $endDate = trim((string) $request->query('end_date', ''));

        if (
            preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)
            && preg_match('/^\d{2}:\d{2}$/', $start)
            && preg_match('/^\d{2}:\d{2}$/', $end)
        ) {
            return [
                'date' => $date,
                'start_time' => $start,
                'end_time' => $end,
                'date_from' => "{$date}T{$start}",
                'date_to' => "{$date}T{$end}",
                'booking_date_from' => "{$date}T{$start}",
                'booking_date_to' => "{$date}T{$end}",
                'from' => "{$date}T{$start}",
                'to' => "{$date}T{$end}",
            ];
        }

        if (
            preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $dateFrom)
            && preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $dateTo)
        ) {
            return [
                'date' => substr($dateFrom, 0, 10),
                'start_time' => substr($dateFrom, 11, 5),
                'end_time' => substr($dateTo, 11, 5),
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'booking_date_from' => $dateFrom,
                'booking_date_to' => $dateTo,
                'from' => $dateFrom,
                'to' => $dateTo,
            ];
        }

        if (
            preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate)
            && preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)
        ) {
            return [
                'date' => $startDate,
                'start_time' => '06:00',
                'end_time' => '23:59',
                'date_from' => "{$startDate}T06:00",
                'date_to' => "{$endDate}T23:59",
                'booking_date_from' => "{$startDate}T06:00",
                'booking_date_to' => "{$endDate}T23:59",
                'from' => "{$startDate}T06:00",
                'to' => "{$endDate}T23:59",
            ];
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return [
                'date' => $date,
                'start_time' => '06:00',
                'end_time' => '12:00',
                'date_from' => "{$date}T06:00",
                'date_to' => "{$date}T12:00",
                'booking_date_from' => "{$date}T06:00",
                'booking_date_to' => "{$date}T12:00",
                'from' => "{$date}T06:00",
                'to' => "{$date}T12:00",
            ];
        }

        return [
            'date' => null,
            'start_time' => null,
            'end_time' => null,
            'date_from' => null,
            'date_to' => null,
            'booking_date_from' => null,
            'booking_date_to' => null,
            'from' => null,
            'to' => null,
        ];
    }

    private function locateStoredFile(?string $path): ?array
    {
        if (! $path) {
            return null;
        }

        foreach (['local', 'public'] as $disk) {
            if (Storage::disk($disk)->exists($path)) {
                return [
                    'disk' => $disk,
                    'path' => $path,
                ];
            }
        }

        return null;
    }

    private function streamStoredFile(string $disk, string $path, string $filename)
    {
        $storage = Storage::disk($disk);

        return response()->streamDownload(function () use ($storage, $path) {
            echo $storage->get($path);
        }, $filename, [
            'Content-Type' => $storage->mimeType($path) ?: 'application/octet-stream',
        ]);
    }

    private function deleteStoredFile(?string $path): void
    {
        if (! $path) {
            return;
        }

        foreach (['local', 'public'] as $disk) {
            try {
                if (Storage::disk($disk)->exists($path)) {
                    Storage::disk($disk)->delete($path);
                }
            } catch (\Throwable) {
                // File cleanup should not block the main transaction.
            }
        }
    }
}
