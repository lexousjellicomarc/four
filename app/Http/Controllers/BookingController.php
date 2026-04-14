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

        $initialSchedule = $this->extractInitialSchedule($request);

        return Inertia::render('bookings/create', [
            'serviceTypes' => $serviceTypesWithServices,
            'unavailableDates' => [],
            'initialSchedule' => $initialSchedule,
            'initialVenue' => trim((string) $request->query('venue', '')) ?: null,
            'initialEventType' => trim((string) $request->query('event_type', '')) ?: null,
            'initialGuests' => $request->filled('guests') ? (int) $request->query('guests') : null,
        ]);
    }

    public function store(StoreBookingRequest $request): RedirectResponse
    {
        $data = $request->validated();

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

        unset($data['survey_proof_image']);
        $data['survey_proof_image_path'] = $storedDiskPath;
        $data['survey_proof_image_name'] = $proofFile->getClientOriginalName();
        $data['survey_proof_image_mime'] = $proofFile->getClientMimeType() ?: $proofFile->getMimeType();

        try {
            $booking = $this->bookings->create($data);
        } catch (\Throwable $e) {
            $this->deleteStoredFile($storedDiskPath);
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
            'booking' => (new BookingResource($booking))->resolve($request),
            'services' => $services,
            'unavailableDates' => $unavailableDates,
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
            } catch (\Throwable $e) {
                $this->deleteStoredFile($newDiskPath);
                throw $e;
            }

            if (! empty($oldProofPath) && $oldProofPath !== $booking->survey_proof_image_path) {
                $this->deleteStoredFile($oldProofPath);
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
        } catch (\Throwable $e) {
            if ($newProofPath && $newProofPath !== $oldProofPath) {
                $this->deleteStoredFile($newProofPath);
            }
            throw $e;
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

        $user = $request->user();

        if ($user && method_exists($user, 'hasRole') && $user->hasRole('user')) {
            $isStaffLike = method_exists($user, 'hasAnyRole')
                && $user->hasAnyRole(['admin', 'manager', 'staff']);

            if (! $isStaffLike) {
                return response()->json([
                    'date' => $availability['date'] ?? $date,
                    'venue' => $availability['venue'] ?? null,
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
        if (! $user) {
            abort(403);
        }

        if (method_exists($user, 'hasRole') && $user->hasRole('user')) {
            $isStaffLike = method_exists($user, 'hasAnyRole')
                && $user->hasAnyRole(['admin', 'manager', 'staff']);

            if ($isStaffLike) {
                return;
            }

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
        if (! $user) {
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
