<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookingPayment;
use App\Support\WorkspaceAccess;
use App\Support\WorkspacePage;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator as LengthAwarePaginatorContract;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class PaymentReviewController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user(), 403);
        abort_unless(WorkspaceAccess::canManagePayments($request), 403);

        $filters = [
            'q' => trim((string) $request->string('q')->value('')),
            'status' => trim((string) $request->string('status')->value('')),
            'gateway' => trim((string) $request->string('gateway')->value('')),
            'payment_type' => trim((string) $request->string('payment_type')->value('')),
            'booking_status' => trim((string) $request->string('booking_status')->value('')),
            'deadline' => trim((string) $request->string('deadline')->value('')),
            'proof' => trim((string) $request->string('proof')->value('')),
        ];

        $query = BookingPayment::query()
            ->with([
                'booking' => function ($query) {
                    $query->with([
                        'service.serviceType',
                        'bookingServices.service.serviceType',
                        'payments',
                        'createdBy',
                    ]);
                },
            ])
            ->latest('created_at');

        $this->applyDirectFilters($query, $filters);

        $directMatches = $query->get();

        $visiblePayments = $directMatches
            ->filter(fn (BookingPayment $payment) => $this->matchesDerivedFilters($payment, $filters))
            ->values();

        $paginator = $this->paginateCollection(
            $visiblePayments,
            max(1, (int) $request->integer('page', 1)),
            10,
            $request,
        );

        $paginator->setCollection(
            $paginator
                ->getCollection()
                ->map(fn (BookingPayment $payment) => $this->transformPayment($request, $payment))
                ->values()
        );

        $statsBase = BookingPayment::query()
            ->with([
                'booking' => function ($query) {
                    $query->with([
                        'service.serviceType',
                        'bookingServices.service.serviceType',
                        'payments',
                        'createdBy',
                    ]);
                },
            ]);

        $this->applyDirectFilters($statsBase, array_merge($filters, [
            'status' => '',
            'deadline' => '',
            'proof' => '',
        ]));

        $statsPayments = $statsBase->get();

        $statusCounts = $statsPayments
            ->groupBy(fn (BookingPayment $payment) => strtolower((string) ($payment->status ?? 'unknown')))
            ->map(fn (Collection $rows) => $rows->count());

        $reviewNeeded = $statsPayments
            ->filter(fn (BookingPayment $payment) => strtolower((string) $payment->status) === 'pending')
            ->count();

        $dueSoon = $statsPayments
            ->filter(fn (BookingPayment $payment) => $this->deadlineBucket($payment) === 'due_soon')
            ->count();

        $overdue = $statsPayments
            ->filter(fn (BookingPayment $payment) => $this->deadlineBucket($payment) === 'overdue')
            ->count();

        $withProof = $statsPayments
            ->filter(fn (BookingPayment $payment) => ! empty($payment->proof_image_path))
            ->count();

        return Inertia::render(WorkspacePage::resolve($request, 'payments/review'), [
            'workspaceRole' => WorkspaceAccess::role($request),
            'isStaffWorkspace' => WorkspaceAccess::isStaffLike($request),
            'filters' => $filters,
            'payments' => $paginator,
            'stats' => [
                'all' => $statsPayments->count(),
                'pending' => (int) ($statusCounts['pending'] ?? 0),
                'confirmed' => (int) ($statusCounts['confirmed'] ?? 0),
                'verified' => (int) ($statusCounts['verified'] ?? 0),
                'paid' => (int) ($statusCounts['paid'] ?? 0),
                'failed' => (int) ($statusCounts['failed'] ?? 0),
                'declined' => (int) ($statusCounts['declined'] ?? 0),
                'refunded' => (int) ($statusCounts['refunded'] ?? 0),
                'review_needed' => $reviewNeeded,
                'due_soon' => $dueSoon,
                'overdue' => $overdue,
                'with_proof' => $withProof,
            ],
        ]);
    }

    protected function applyDirectFilters(Builder $query, array $filters): void
    {
        $query->when($filters['q'] ?? null, function (Builder $builder, string $search) {
            $builder->where(function (Builder $nested) use ($search) {
                $nested
                    ->where('transaction_reference', 'like', "%{$search}%")
                    ->orWhere('payer_name', 'like', "%{$search}%")
                    ->orWhere('remarks', 'like', "%{$search}%")
                    ->orWhereHas('booking', function (Builder $booking) use ($search) {
                        $booking
                            ->where('client_name', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%")
                            ->orWhere('client_email', 'like', "%{$search}%")
                            ->orWhere('type_of_event', 'like', "%{$search}%");
                    });
            });
        });

        $query->when($filters['status'] ?? null, fn (Builder $builder, string $status) => $builder->where('status', $status));

        $query->when($filters['gateway'] ?? null, fn (Builder $builder, string $gateway) => $builder->where('payment_gateway', $gateway));

        $query->when($filters['payment_type'] ?? null, fn (Builder $builder, string $type) => $builder->where('payment_type', $type));

        $query->when($filters['booking_status'] ?? null, function (Builder $builder, string $status) {
            $builder->whereHas('booking', fn (Builder $booking) => $booking->where('booking_status', $status));
        });
    }

    protected function matchesDerivedFilters(BookingPayment $payment, array $filters): bool
    {
        $deadline = $filters['deadline'] ?? '';

        if ($deadline !== '') {
            if ($deadline === 'review' && strtolower((string) $payment->status) !== 'pending') {
                return false;
            }

            if ($deadline !== 'review' && $this->deadlineBucket($payment) !== $deadline) {
                return false;
            }
        }

        $proof = $filters['proof'] ?? '';

        if ($proof === 'with_proof' && empty($payment->proof_image_path)) {
            return false;
        }

        if ($proof === 'without_proof' && ! empty($payment->proof_image_path)) {
            return false;
        }

        return true;
    }

    protected function deadlineBucket(BookingPayment $payment): string
    {
        $summary = $this->bookingDeadlineSummary($payment->booking);

        return match ($summary['state'] ?? 'not_applicable') {
            'first_due_soon',
            'final_due_soon' => 'due_soon',

            'first_overdue',
            'final_overdue' => 'overdue',

            'fulfilled',
            'not_applicable' => 'closed',

            default => 'normal',
        };
    }

    protected function bookingDeadlineSummary(?Booking $booking): array
    {
        if (! $booking) {
            return ['state' => 'not_applicable'];
        }

        $itemsTotal = $this->itemsTotal($booking);
        $submittedTotal = $this->submittedPaymentsTotal($booking);
        $confirmedTotal = $this->confirmedPaymentsTotal($booking);

        $status = strtolower((string) ($booking->booking_status ?? 'pending'));

        if (in_array($status, ['cancelled', 'declined', 'completed'], true)) {
            return ['state' => 'not_applicable'];
        }

        $createdAt = $booking->created_at instanceof Carbon
            ? $booking->created_at->copy()
            : ($booking->created_at ? Carbon::parse($booking->created_at) : null);

        if (! $createdAt || $itemsTotal <= 0 || $confirmedTotal + 0.00001 >= $itemsTotal) {
            return [
                'state' => 'fulfilled',
                'submitted_total' => $submittedTotal,
                'confirmed_total' => $confirmedTotal,
            ];
        }

        $firstDeadline = $createdAt->copy()->addHours(24);
        $finalDeadline = $createdAt->copy()->addHours(48);
        $now = now();
        $halfRequired = round($itemsTotal * 0.5, 2);

        if ($confirmedTotal + 0.00001 < $halfRequired) {
            if ($now->greaterThan($firstDeadline)) {
                return [
                    'state' => 'first_overdue',
                    'down_deadline' => $firstDeadline->toIso8601String(),
                    'full_deadline' => $finalDeadline->toIso8601String(),
                    'submitted_total' => $submittedTotal,
                    'confirmed_total' => $confirmedTotal,
                ];
            }

            if ($now->diffInHours($firstDeadline, false) <= 6) {
                return [
                    'state' => 'first_due_soon',
                    'down_deadline' => $firstDeadline->toIso8601String(),
                    'full_deadline' => $finalDeadline->toIso8601String(),
                    'submitted_total' => $submittedTotal,
                    'confirmed_total' => $confirmedTotal,
                ];
            }

            return [
                'state' => 'monitoring',
                'down_deadline' => $firstDeadline->toIso8601String(),
                'full_deadline' => $finalDeadline->toIso8601String(),
                'submitted_total' => $submittedTotal,
                'confirmed_total' => $confirmedTotal,
            ];
        }

        if ($confirmedTotal + 0.00001 < $itemsTotal) {
            if ($now->greaterThan($finalDeadline)) {
                return [
                    'state' => 'final_overdue',
                    'down_deadline' => $firstDeadline->toIso8601String(),
                    'full_deadline' => $finalDeadline->toIso8601String(),
                    'submitted_total' => $submittedTotal,
                    'confirmed_total' => $confirmedTotal,
                ];
            }

            if ($now->diffInHours($finalDeadline, false) <= 8) {
                return [
                    'state' => 'final_due_soon',
                    'down_deadline' => $firstDeadline->toIso8601String(),
                    'full_deadline' => $finalDeadline->toIso8601String(),
                    'submitted_total' => $submittedTotal,
                    'confirmed_total' => $confirmedTotal,
                ];
            }
        }

        return [
            'state' => 'monitoring',
            'down_deadline' => $firstDeadline->toIso8601String(),
            'full_deadline' => $finalDeadline->toIso8601String(),
            'submitted_total' => $submittedTotal,
            'confirmed_total' => $confirmedTotal,
        ];
    }

    protected function transformPayment(Request $request, BookingPayment $payment): array
    {
        $booking = $payment->booking;

        $itemsTotal = $booking ? $this->itemsTotal($booking) : 0.0;
        $submittedTotal = $booking ? $this->submittedPaymentsTotal($booking) : 0.0;
        $confirmedTotal = $booking ? $this->confirmedPaymentsTotal($booking) : 0.0;
        $deadline = $this->bookingDeadlineSummary($booking);

        return [
            'id' => $payment->id,
            'status' => $payment->status,
            'payment_method' => $payment->payment_method,
            'payment_gateway' => $payment->payment_gateway,
            'payment_type' => $payment->payment_type,
            'amount' => (float) $payment->amount,
            'transaction_reference' => $payment->transaction_reference,
            'remarks' => $payment->remarks,
            'payer_name' => $payment->payer_name,
            'card_holder_name' => $payment->card_holder_name,
            'card_last_four' => $payment->card_last_four,
            'marketing_consent' => (bool) $payment->marketing_consent,
            'proof_image_url' => $this->paymentProofUrl($request, $payment),
            'paid_at' => optional($payment->paid_at)->toIso8601String(),
            'verified_at' => optional($payment->verified_at)->toIso8601String(),
            'approved_at' => optional($payment->approved_at)->toIso8601String(),
            'declined_at' => optional($payment->declined_at)->toIso8601String(),
            'failed_at' => optional($payment->failed_at)->toIso8601String(),
            'created_at' => optional($payment->created_at)->toIso8601String(),
            'updated_at' => optional($payment->updated_at)->toIso8601String(),

            'booking' => $booking ? [
                'id' => $booking->id,
                'company_name' => $booking->company_name,
                'client_name' => $booking->client_name,
                'client_email' => $booking->client_email,
                'type_of_event' => $booking->type_of_event,
                'booking_status' => $booking->booking_status,
                'payment_status' => $booking->payment_status,
                'booking_date_from' => optional($booking->booking_date_from)->toIso8601String(),
                'booking_date_to' => optional($booking->booking_date_to)->toIso8601String(),
                'created_at' => optional($booking->created_at)->toIso8601String(),
                'created_by_name' => $booking->createdBy?->name,
                'service_name' => $booking->service?->name,
                'service_type_name' => $booking->service?->serviceType?->name,
                'items' => $this->bookingItems($booking),
                'totals' => [
                    'items_total' => round($itemsTotal, 2),
                    'submitted_payments_total' => round($submittedTotal, 2),
                    'confirmed_payments_total' => round($confirmedTotal, 2),
                    'remaining_balance' => round(max(0, $itemsTotal - $confirmedTotal), 2),
                    'down_payment_required' => round($itemsTotal * 0.5, 2),
                ],
                'deadline' => $deadline,
            ] : null,
        ];
    }

    protected function bookingItems(Booking $booking): array
    {
        return collect($booking->bookingServices ?? [])
            ->map(function ($item) {
                $service = $item->service;
                $serviceType = $service?->serviceType;
                $quantity = max(1, (int) ($item->quantity ?? 1));
                $unitPrice = (float) ($item->unit_price ?? $item->price ?? $service?->price ?? 0);

                return [
                    'id' => $item->id,
                    'service_id' => $item->service_id,
                    'service_name' => $service?->name,
                    'area' => $serviceType?->name,
                    'quantity' => $quantity,
                    'unit_price' => round($unitPrice, 2),
                    'line_total' => round($unitPrice * $quantity, 2),
                ];
            })
            ->values()
            ->all();
    }

    protected function itemsTotal(Booking $booking): float
    {
        return collect($this->bookingItems($booking))
            ->reduce(fn (float $sum, array $item) => $sum + (float) ($item['line_total'] ?? 0), 0.0);
    }

    protected function submittedPaymentsTotal(Booking $booking): float
    {
        return collect($booking->payments ?? [])
            ->filter(fn ($payment) => in_array(strtolower((string) $payment->status), ['pending', 'confirmed', 'verified', 'paid'], true))
            ->reduce(fn (float $sum, $payment) => $sum + (float) ($payment->amount ?? 0), 0.0);
    }

    protected function confirmedPaymentsTotal(Booking $booking): float
    {
        return collect($booking->payments ?? [])
            ->filter(fn ($payment) => in_array(strtolower((string) $payment->status), ['confirmed', 'verified', 'paid'], true))
            ->reduce(fn (float $sum, $payment) => $sum + (float) ($payment->amount ?? 0), 0.0);
    }

    protected function paymentProofUrl(Request $request, BookingPayment $payment): ?string
    {
        if (empty($payment->proof_image_path) || empty($payment->id) || empty($payment->booking_id)) {
            return null;
        }

        try {
            $routeName = WorkspacePage::routeName($request, 'bookings.payments.proof');

            $base = route($routeName, [
                'booking' => $payment->booking_id,
                'payment' => $payment->id,
            ], false);

            $version = $payment->updated_at?->timestamp ?? $payment->created_at?->timestamp ?? time();

            return $base . '?v=' . $version;
        } catch (\Throwable) {
            return $payment->proof_image_url;
        }
    }

    protected function paginateCollection(Collection $items, int $page, int $perPage, Request $request): LengthAwarePaginator
    {
        $page = max(1, $page);
        $results = $items->forPage($page, $perPage)->values();

        return new LengthAwarePaginator(
            $results,
            $items->count(),
            $perPage,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ],
        );
    }
}
