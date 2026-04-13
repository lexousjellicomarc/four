<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookingPaymentRequest;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingPaymentRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Http\Resources\BookingResource;
use App\Http\Resources\ServiceResource;
use App\Models\Booking;
use App\Models\BookingPayment;
use App\Models\Service;
use App\Models\ServiceType;
use App\Services\Contracts\BookingServiceInterface;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Arr;

class BookingController extends Controller
{
    public function __construct(
        private readonly BookingServiceInterface $bookings,
        private readonly NotificationService $notifications,
        
    ) {
    }
    private function normalizePaymentPayload(Request $request, array $data, bool $canManage): array
{
    $data['amount'] = round((float) ($data['amount'] ?? 0), 2);

    $gateway = strtolower((string) ($data['payment_gateway'] ?? ''));
    $paymentType = strtolower((string) ($data['payment_type'] ?? ''));

    if ($request->hasFile('proof_image')) {
        $stored = $request->file('proof_image')?->store('booking-payment-proofs', 'public');
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

    $hasProof = !empty($data['proof_image_path']);
    $hasReference = !empty($data['transaction_reference']);
    $isTrialOnline = in_array($gateway, ['card', 'paypal', 'gcash'], true);

    // Important fix:
    // the old code always forced client payments to "pending".
    // that kept payment_status = unpaid and lifecycle status = pending.
    // for trial online flows with sufficient evidence, mark it confirmed immediately.
    $data['status'] = ($isTrialOnline && ($gateway === 'card' || ($hasProof && $hasReference)))
        ? 'confirmed'
        : 'pending';

    return $data;
}

    public function index(Request $request): Response
    {
        $perPage = (int) $request->integer('per_page', 10);

        $filters = $request->only([
            'booking_status',
            'payment_status',
            'service_id',
            'q',
            'date_from',
            'date_to',
            'sort',
        ]);

        if (empty($filters['sort'])) {
            $user = $request->user();
            $filters['sort'] = ($user && method_exists($user, 'hasRole') && $user->hasRole('user'))
                ? 'newest'
                : 'upcoming';
        }

        $paginated = $this->bookings->paginate($filters, $perPage);
        $statusCounts = $this->bookings->getStatusCounts($filters);

        $services = ServiceResource::collection(Service::orderBy('name')->get())
            ->resolve($request);

        return Inertia::render('bookings/index', [
            'bookings' => BookingResource::collection($paginated)
                ->response()
                ->getData(true),

            'services' => $services,
            'filters' => $filters,
            'statusCounts' => $statusCounts,
        ]);
    }

    public function create(Request $request): Response
    {
        $types = ServiceType::with(['services' => fn ($q) => $q->orderBy('name')])
            ->orderBy('name')
            ->get();

        $serviceTypesWithServices = \App\Http\Resources\ServiceTypeResource::collection($types)
            ->resolve($request);

        $initialSchedule = [
            'date'       => $request->query('date'),
            'start_time' => $request->query('start'),
            'end_time'   => $request->query('end'),
        ];

        $unavailableDates = $this->bookings->getUnavailableDates();

        return Inertia::render('bookings/create', [
            'serviceTypes'     => $serviceTypesWithServices,
            'unavailableDates' => $unavailableDates,
            'initialSchedule'  => $initialSchedule,
        ]);
    }

    public function store(StoreBookingRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $proofFile = $request->file('survey_proof_image');
        if (!$proofFile instanceof UploadedFile) {
            return redirect()->back()->withErrors([
                'survey_proof_image' => 'Proof image is required.',
            ]);
        }

        // ✅ DISK ONLY: store the uploaded proof on disk and save ONLY the path in DB.
        $storedDiskPath = $proofFile->store('booking-survey-proofs', 'public');
        if (!$storedDiskPath) {
            return redirect()->back()->withErrors([
                'survey_proof_image' => 'Unable to upload proof image. Please try again.',
            ]);
        }

        unset($data['survey_proof_image']);
        $data['survey_proof_image_path'] = $storedDiskPath;

        try {
            $booking = $this->bookings->create($data);
        } catch (\Throwable $e) {
            if ($storedDiskPath) {
                Storage::disk('public')->delete($storedDiskPath);
            }
            throw $e;
        }

        return redirect()
            ->route('bookings.show', $booking->id)
            ->with('success', 'Booking created.');
    }

    public function show(Request $request, Booking $booking): Response
    {
    $this->ensureBookingAccess($request, $booking);
    $this->markAsViewed($request, $booking);

    $this->bookings->syncLifecycleStatus($booking);
    $booking->refresh()->loadMissing([
    'service',
    'bookingServices.service',
    'payments',
    'createdBy',
    'lifecycleEvents.actor',
]);



        $services = ServiceResource::collection(Service::orderBy('name')->get())
            ->resolve($request);

        $unavailableDates = $this->bookings->getUnavailableDates($booking->id);

        return Inertia::render('bookings/show', [
            'booking'          => (new BookingResource($booking))->resolve($request),
            'services'         => $services,
            'unavailableDates' => $unavailableDates,
        ]);
    }

    public function surveyProofImage(Request $request, Booking $booking)
    {
        $this->ensureBookingAccess($request, $booking);

        $path = $booking->survey_proof_image_path;
        if (!$path || !Storage::disk('public')->exists($path)) {
            abort(404);
        }

        $ext = pathinfo($path, PATHINFO_EXTENSION);
        $filename = 'survey-proof-' . $booking->id . ($ext ? ('.' . $ext) : '');
        $filename = preg_replace('/[^A-Za-z0-9._-]+/', '_', $filename) ?: 'survey-proof';

        $headers = [
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ];

        $mime = Storage::disk('public')->mimeType($path) ?: 'application/octet-stream';
        $headers['Content-Type'] = $mime;

        return Storage::disk('public')->response($path, $filename, $headers);
    }

    public function edit(Request $request, Booking $booking): Response
{
    $this->ensureBookingAccess($request, $booking);
    $this->markAsViewed($request, $booking);
    $this->bookings->syncLifecycleStatus($booking);

    $booking->refresh()->loadMissing([
    'service',
    'bookingServices.service',
    'payments',
    'createdBy',
    'lifecycleEvents.actor',
]);


    $unavailableDates = $this->bookings->getUnavailableDates($booking->id);

    return Inertia::render('bookings/edit', [
        'booking' => (new BookingResource($booking))->resolve($request),
        'unavailableDates' => $unavailableDates,
    ]);
}


    public function update(UpdateBookingRequest $request, Booking $booking): RedirectResponse
    {
        $this->ensureBookingAccess($request, $booking);

        $data = $request->validated();

        $oldProofPath = $booking->survey_proof_image_path;

        if ($request->hasFile('survey_proof_image')) {
            $file = $request->file('survey_proof_image');

            if (!$file instanceof UploadedFile) {
                return redirect()->back()->withErrors([
                    'survey_proof_image' => 'Unable to read the uploaded file. Please try again.',
                ]);
            }

            // ✅ DISK ONLY: store the new proof on disk and save ONLY the path in DB.
            $newDiskPath = $file->store('booking-survey-proofs', 'public');
            if (!$newDiskPath) {
                return redirect()->back()->withErrors([
                    'survey_proof_image' => 'Unable to upload proof image. Please try again.',
                ]);
            }

            unset($data['survey_proof_image']);
            $data['survey_proof_image_path'] = $newDiskPath;

            try {
                $booking = $this->bookings->update($booking, $data);
            } catch (\Throwable $e) {
                if ($newDiskPath) {
                    Storage::disk('public')->delete($newDiskPath);
                }
                throw $e;
            }

            if (!empty($oldProofPath) && $oldProofPath !== $booking->survey_proof_image_path) {
                Storage::disk('public')->delete($oldProofPath);
            }

            return redirect()
                ->route('bookings.show', $booking->id)
                ->with('success', 'Booking updated.');
        }

        unset($data['survey_proof_image']);

        $booking = $this->bookings->update($booking, $data);

        return redirect()
            ->route('bookings.show', $booking->id)
            ->with('success', 'Booking updated.');
    }

    public function destroy(Request $request, Booking $booking): RedirectResponse
    {
        $this->ensureBookingAccess($request, $booking);

        $this->bookings->delete($booking);

        return redirect()
            ->back()
            ->with('success', 'Booking deleted successfully');
    }

    public function storePayment(StoreBookingPaymentRequest $request, Booking $booking): RedirectResponse
{
    $this->ensureBookingAccess($request, $booking);

    $data = $request->validated();
    $actor = $request->user();
    $canManage = $actor ? $actor->can('payments.manage') : false;

    $data = $this->normalizePaymentPayload($request, $data, $canManage);

    /** @var BookingPayment $payment */
    $payment = $booking->payments()->create($data);
    unset($payment);

    $this->bookings->recalculatePaymentStatus($booking->refresh());

    return redirect()
        ->back()
        ->with('success', 'Payment recorded.');
}

    public function updatePayment(UpdateBookingPaymentRequest $request, Booking $booking, BookingPayment $payment): RedirectResponse
{
    $this->ensureBookingAccess($request, $booking);

    if ($payment->booking_id !== $booking->id) {
        abort(404);
    }

    $data = $request->validated();
    $data = $this->normalizePaymentPayload($request, $data, true);

    if ($request->hasFile('proof_image') && !empty($payment->proof_image_path)) {
        Storage::disk('public')->delete($payment->proof_image_path);
    } else {
        $data['proof_image_path'] = $payment->proof_image_path;
    }
    $payment->update($data);

    $this->bookings->recalculatePaymentStatus($booking->refresh());

    return redirect()
        ->back()
        ->with('success', 'Payment updated.');
}

    public function availability(Request $request): JsonResponse
{
    $date = trim((string) $request->query('date', ''));

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        return response()->json([
            'message' => 'Invalid date. Use YYYY-MM-DD format.',
        ], 422);
    }

    $excludeIdRaw = $request->query('exclude_booking_id');
    $excludeId = is_numeric($excludeIdRaw) ? (int) $excludeIdRaw : null;

    $availability = $this->bookings->getDailyAvailability($date, $excludeId);

    if (!isset($availability['busy']) || !is_array($availability['busy'])) {
        $availability['busy'] = [];
    }

    if (!isset($availability['free']) || !is_array($availability['free'])) {
        $availability['free'] = [];
    }

    if (!isset($availability['blocks']) || !is_array($availability['blocks'])) {
        $availability['blocks'] = [];
    }

    if (!isset($availability['is_fully_booked'])) {
        $availability['is_fully_booked'] = false;
    }

    $user = $request->user();

    if ($user && $user->hasRole('user')) {
        $isStaffLike = method_exists($user, 'hasAnyRole')
            && $user->hasAnyRole(['admin', 'manager', 'staff']);

        if (! $isStaffLike) {
            return response()->json([
                'date' => $availability['date'] ?? $date,
                'blocks' => $availability['blocks'] ?? [],
                'is_fully_booked' => (bool) ($availability['is_fully_booked'] ?? false),
            ]);
        }
    }

    return response()->json($availability);
}


    private function ensureBookingAccess(Request $request, Booking $booking): void
    {
        $user = $request->user();
        if (!$user) abort(403);

        if (method_exists($user, 'hasRole') && $user->hasRole('user')) {
            $isStaffLike = method_exists($user, 'hasAnyRole')
                && $user->hasAnyRole(['admin', 'manager', 'staff']);

            if ($isStaffLike) return;

            $bookingEmail = strtolower((string) ($booking->client_email ?? ''));
            $userEmail = strtolower((string) ($user->email ?? ''));

            $creatorId = (int) ($booking->created_by_user_id ?? 0);
            if ($creatorId > 0 && $creatorId === (int) $user->id) {
                return;
            }

            if ($bookingEmail === '' || $bookingEmail !== $userEmail) {
                abort(403);
            }
        }
    }

    private function markAsViewed(Request $request, Booking $booking): void
    {
        $user = $request->user();
        if (!$user) return;

        $booking->views()->updateOrCreate(
            ['user_id' => $user->id],
            ['viewed_at' => now()]
        );
    }
}
