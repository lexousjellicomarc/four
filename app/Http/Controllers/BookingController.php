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
use App\Models\Service;
use App\Models\ServiceType;
use App\Services\Contracts\BookingServiceInterface;
use App\Services\NotificationService;
use App\Support\WorkspaceAccess;
use App\Support\WorkspacePage;
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
            'payment_status',
            'service_id',
            'q',
            'date_from',
            'date_to',
            'sort',
        ]);

        $filters = WorkspaceAccess::isStaffLike($request)
            ? WorkspaceAccess::staffFilters($rawFilters)
            : WorkspaceAccess::clientSafeFilters($rawFilters);

        if (empty($filters['sort'])) {
            $filters['sort'] = WorkspaceAccess::isClient($request) ? 'newest' : 'upcoming';
        }

        $paginated = $this->bookings->paginate($filters, $perPage);
        $statusCounts = $this->bookings->getStatusCounts($filters);

        $services = WorkspaceAccess::isStaffLike($request)
            ? ServiceResource::collection(Service::orderBy('name')->get())->resolve($request)
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

        $types = ServiceType::with(['services' => fn ($query) => $query->orderBy('name')])
            ->orderBy('name')
            ->get();

        $serviceTypesWithServices = ServiceTypeResource::collection($types)
            ->resolve($request);

        $initialSchedule = $this->extractInitialSchedule($request);

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/create'), [
            'serviceTypes' => $serviceTypesWithServices,
            'unavailableDates' => [],
            'initialSchedule' => $initialSchedule,
            'initialVenue' => trim((string) $request->query('venue', '')) ?: null,
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

        unset($data['survey_proof_image']);

        if (WorkspaceAccess::isClient($request)) {
            $data = $this->forceClientBookingDefaults($request, $data);
        }

        $booking = $this->bookings->create($data);

        return redirect()
            ->route(WorkspacePage::routeName($request, 'bookings.survey'), $booking->id)
            ->with('success', 'Booking details saved. Continue to the survey reference page.');
    }

    public function survey(Request $request, Booking $booking): Response
    {
        $this->ensureBookingAccess($request, $booking);

        $booking->loadMissing([
            'service',
            'bookingServices.service.serviceType',
            'payments',
            'createdBy',
        ]);

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/survey'), [
            'booking' => (new BookingResource($booking))->resolve($request),
            'workspaceRole' => WorkspaceAccess::role($request),
            'isStaffWorkspace' => WorkspaceAccess::isStaffLike($request),
        ]);
    }

    public function storeSurvey(Request $request, Booking $booking): RedirectResponse
    {
        $this->ensureBookingAccess($request, $booking);

        $data = $request->validate([
            'survey_email' => ['required', 'string', 'email', 'max:255'],
            'survey_proof_image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $proofFile = $request->file('survey_proof_image');

        if (! $proofFile instanceof UploadedFile) {
            return redirect()->back()->withErrors([
                'survey_proof_image' => 'Proof image is required.',
            ]);
        }

        $storedDiskPath = $proofFile->store('booking-survey-proofs', 'local');

        if (! $storedDiskPath) {
            return redirect()->back()->withErrors([
                'survey_proof_image' => 'Unable to upload proof image. Please try again.',
            ]);
        }

        $oldProofPath = $booking->survey_proof_image_path;

        $booking->update([
            'survey_email' => strtolower(trim((string) $data['survey_email'])),
            'survey_proof_image_path' => $storedDiskPath,
            'survey_proof_image_name' => $proofFile->getClientOriginalName(),
            'survey_proof_image_mime' => $proofFile->getClientMimeType() ?: $proofFile->getMimeType(),
        ]);

        if (! empty($oldProofPath) && $oldProofPath !== $storedDiskPath) {
            $this->deleteStoredFile($oldProofPath);
        }

        return redirect()
            ->route(WorkspacePage::routeName($request, 'bookings.show'), $booking->id)
            ->with('success', 'Survey reference saved successfully.');
    }

    public function show(Request $request, Booking $booking): Response
    {
        $this->ensureBookingAccess($request, $booking);
        $this->markAsViewed($request, $booking);

        $this->bookings->syncLifecycleStatus($booking);

        $booking->refresh()->loadMissing([
            'service',
            'bookingServices.service.serviceType',
            'payments',
            'createdBy',
            'lifecycleEvents.actor',
        ]);

        $services = WorkspaceAccess::isStaffLike($request)
            ? ServiceResource::collection(Service::orderBy('name')->get())->resolve($request)
            : [];

        $unavailableDates = $this->bookings->getUnavailableDates($booking->id);

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/show'), [
            'booking' => (new BookingResource($booking))->resolve($request),
            'services' => $services,
            'unavailableDates' => $unavailableDates,
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
        $filename = 'survey-proof-' . $booking->id . ($ext ? ('.' . $ext) : '');
        $filename = preg_replace('/[^A-Za-z0-9._-]+/', '_', $filename) ?: 'survey-proof';

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
            'service',
            'bookingServices.service.serviceType',
            'payments',
            'createdBy',
            'lifecycleEvents.actor',
        ]);

        $unavailableDates = $this->bookings->getUnavailableDates($booking->id);

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/edit'), [
            'booking' => (new BookingResource($booking))->resolve($request),
            'serviceTypes' => ServiceTypeResource::collection(
                ServiceType::with(['services' => fn ($query) => $query->orderBy('name')])
                    ->orderBy('name')
                    ->get()
            )->resolve($request),
            'services' => ServiceResource::collection(Service::orderBy('name')->get())->resolve($request),
            'unavailableDates' => $unavailableDates,
            'workspaceRole' => WorkspaceAccess::role($request),
            'isStaffWorkspace' => WorkspaceAccess::isStaffLike($request),
        ]);
    }

    public function update(UpdateBookingRequest $request, Booking $booking): RedirectResponse
    {
        $this->ensureBookingAccess($request, $booking);

        abort_unless(WorkspaceAccess::canUpdateBooking($request, $booking), 403);

        $data = $request->validated();

        if (WorkspaceAccess::isClient($request)) {
            $data = $this->clientSafeUpdatePayload($request, $data);
        }

        $data = $this->managerSafeUpdatePayload($request, $data);
        $oldProofPath = $booking->survey_proof_image_path;

        if ($request->hasFile('survey_proof_image')) {
            $file = $request->file('survey_proof_image');

            if (! $file instanceof UploadedFile) {
                return redirect()->back()->withErrors([
                    'survey_proof_image' => 'Unable to read the uploaded file. Please try again.',
                ]);
            }

            $newDiskPath = $file->store('booking-survey-proofs', 'local');

            if (! $newDiskPath) {
                return redirect()->back()->withErrors([
                    'survey_proof_image' => 'Unable to upload proof image. Please try again.',
                ]);
            }

            unset($data['survey_proof_image']);

            $data['survey_proof_image_path'] = $newDiskPath;
            $data['survey_proof_image_name'] = $file->getClientOriginalName();
            $data['survey_proof_image_mime'] = $file->getClientMimeType() ?: $file->getMimeType();

            try {
                $booking = $this->bookings->update($booking, $data);
            } catch (\Throwable $exception) {
                $this->deleteStoredFile($newDiskPath);
                throw $exception;
            }

            if (! empty($oldProofPath) && $oldProofPath !== $booking->survey_proof_image_path) {
                $this->deleteStoredFile($oldProofPath);
            }

            return redirect()
                ->route(WorkspacePage::routeName($request, 'bookings.show'), $booking->id)
                ->with('success', 'Booking updated.');
        }

        unset($data['survey_proof_image']);

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

        /** @var BookingPayment $payment */
        $payment = $booking->payments()->create($data);
        unset($payment);

        $this->bookings->recalculatePaymentStatus($booking->refresh());

        return redirect()
            ->back()
            ->with('success', $canManage ? 'Payment recorded.' : 'Payment proof submitted for review.');
    }

    public function updatePayment(UpdateBookingPaymentRequest $request, Booking $booking, BookingPayment $payment): RedirectResponse
    {
        $this->ensureBookingAccess($request, $booking);

        abort_unless(WorkspaceAccess::canManagePayments($request), 403);

        if ((int) $payment->booking_id !== (int) $booking->id) {
            abort(404);
        }

        $data = $request->validated();
        $oldProofPath = $payment->proof_image_path;

        $data = $this->normalizePaymentPayload($request, $data, true);

        if (! array_key_exists('proof_image_path', $data)) {
            $data['proof_image_path'] = $oldProofPath;
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
            ->with('success', 'Payment updated.');
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

    private function normalizePaymentPayload(Request $request, array $data, bool $canManage): array
    {
        $data['amount'] = round((float) ($data['amount'] ?? 0), 2);

        $gateway = strtolower((string) ($data['payment_gateway'] ?? ''));
        $paymentType = strtolower((string) ($data['payment_type'] ?? ''));

        if ($request->hasFile('proof_image')) {
            $stored = $request->file('proof_image')?->store('booking-payment-proofs', 'local');

            if ($stored) {
                $data['proof_image_path'] = $stored;
            }
        }

        $cardNumber = preg_replace('/\D+/', '', (string) $request->input('card_number', ''));
        $cardLastFour = $cardNumber !== '' ? substr($cardNumber, -4) : null;

        $data['payer_name'] = trim((string) ($data['payer_name'] ?? '')) ?: null;
        $data['card_holder_name'] = trim((string) ($data['card_holder_name'] ?? '')) ?: null;
        $data['card_last_four'] = $cardLastFour;
        $data['card_expiration'] = trim((string) ($data['card_expiration'] ?? '')) ?: null;
        $data['marketing_consent'] = (bool) ($data['marketing_consent'] ?? false);
        $data['payment_type'] = $paymentType !== '' ? $paymentType : null;
        $data['payment_gateway'] = $gateway !== '' ? $gateway : null;
        $data['paid_at'] = now();

        $data['payment_meta'] = array_filter([
            'gateway' => $gateway !== '' ? $gateway : null,
            'payment_type' => $paymentType !== '' ? $paymentType : null,
            'card_holder_name' => trim((string) $request->input('card_holder_name', '')) ?: null,
            'card_expiration' => trim((string) $request->input('card_expiration', '')) ?: null,
            'marketing_consent' => (bool) $request->boolean('marketing_consent'),
        ], static fn ($value) => $value !== null && $value !== '');

        if ($canManage) {
            $data['status'] = strtolower((string) ($data['status'] ?? 'pending'));

            return $data;
        }

        $data['status'] = 'pending';

        unset(
            $data['verified_at'],
            $data['approved_at'],
            $data['declined_at'],
            $data['failed_at'],
            $data['reviewed_by_user_id']
        );

        return $data;
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
            'survey_email',
            'survey_proof_image_path',
            'survey_proof_image',
            'survey_proof_image_mime',
            'survey_proof_image_name',
            'client_address',
            'client_region',
            'client_province',
            'client_city_municipality',
            'client_barangay',
            'client_zip_code',
            'client_street_address',
            'head_of_organization',
            'type_of_event',
            'number_of_guests',
        ];

        $data = array_intersect_key($data, array_flip($allowed));
        $data['client_email'] = strtolower(trim((string) $user->email));

        return $data;
    }

    private function managerSafeUpdatePayload(Request $request, array $data): array
{
    if (WorkspaceAccess::role($request) !== 'manager') {
        return $data;
    }

    unset(
        $data['booking_status'],
        $data['payment_status'],
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

        $booking->views()->updateOrCreate(
            ['user_id' => $user->id],
            ['viewed_at' => now()]
        );
    }

    private function extractInitialSchedule(Request $request): array
    {
        $date = trim((string) $request->query('date', ''));
        $start = trim((string) $request->query('start', ''));
        $end = trim((string) $request->query('end', ''));

        if (
            preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)
            && preg_match('/^\d{2}:\d{2}$/', $start)
            && preg_match('/^\d{2}:\d{2}$/', $end)
        ) {
            return [
                'date' => $date,
                'start_time' => $start,
                'end_time' => $end,
            ];
        }

        $from = trim((string) $request->query('date_from', ''));
        $to = trim((string) $request->query('date_to', ''));

        if (
            preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $from)
            && preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $to)
        ) {
            return [
                'date' => substr($from, 0, 10),
                'start_time' => substr($from, 11, 5),
                'end_time' => substr($to, 11, 5),
            ];
        }

        return [
            'date' => null,
            'start_time' => null,
            'end_time' => null,
        ];
    }

    private function locateStoredFile(?string $path): ?array
    {
        if (! $path) {
            return null;
        }

        $candidates = array_values(array_unique(array_filter([
            ltrim((string) $path, '/'),
            ltrim((string) preg_replace('#^/?storage/#', '', (string) $path), '/'),
        ])));

        foreach (['local', 'public'] as $disk) {
            foreach ($candidates as $candidate) {
                if ($candidate !== '' && Storage::disk($disk)->exists($candidate)) {
                    return [
                        'disk' => $disk,
                        'path' => $candidate,
                    ];
                }
            }
        }

        return null;
    }

    private function deleteStoredFile(?string $path): void
    {
        $file = $this->locateStoredFile($path);

        if ($file) {
            Storage::disk($file['disk'])->delete($file['path']);
        }
    }

    private function streamStoredFile(string $disk, string $path, string $filename)
    {
        $headers = [
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
            'Content-Type' => Storage::disk($disk)->mimeType($path) ?: 'application/octet-stream',
        ];

        return Storage::disk($disk)->response($path, $filename, $headers);
    }
}
