<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookingPayment;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use App\Support\WorkspacePage;

class PaymentReviewController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('payments.manage');

        $filters = [
            'q' => trim((string) $request->string('q')->value('')),
            'status' => trim((string) $request->string('status')->value('')),
            'gateway' => trim((string) $request->string('gateway')->value('')),
            'payment_type' => trim((string) $request->string('payment_type')->value('')),
            'booking_status' => trim((string) $request->string('booking_status')->value('')),
            'deadline' => trim((string) $request->string('deadline')->value('')),
        ];

        $query = BookingPayment::query()
            ->with([
                'booking' => function ($query) {
                    $query->with(['bookingServices.service', 'payments', 'createdBy']);
                },
            ])
            ->latest('created_at');

        $this->applyDirectFilters($query, $filters);

        $directMatches = $query->get();

        $visiblePayments = $directMatches
            ->filter(fn (BookingPayment $payment) => $this->matchesDeadlineFilter($payment, $filters['deadline'] ?? ''))
            ->values();

        $paginator = $this->paginateCollection(
            $visiblePayments,
            max(1, (int) $request->integer('page', 1)),
            12,
            $request
        );

        $paginator->setCollection(
            $paginator->getCollection()->map(fn (BookingPayment $payment) => $this->transformPayment($payment))->values()
        );

        $statsBase = BookingPayment::query()
            ->with([
                'booking' => function ($query) {
                    $query->with(['bookingServices.service', 'payments', 'createdBy']);
                },
            ]);

        $this->applyDirectFilters($statsBase, array_merge($filters, ['status' => '', 'deadline' => '']));

        $statsPayments = $statsBase->get();

        $statusCounts = $statsPayments
            ->groupBy(fn (BookingPayment $payment) => strtolower((string) ($payment->status ?? 'unknown')))
            ->map(fn (Collection $rows) => $rows->count());

        $reviewNeeded = $statsPayments->filter(fn (BookingPayment $payment) => strtolower((string) $payment->status) === 'pending')->count();
        $dueSoon = $statsPayments->filter(fn (BookingPayment $payment) => $this->deadlineBucket($payment) === 'due_soon')->count();
        $overdue = $statsPayments->filter(fn (BookingPayment $payment) => $this->deadlineBucket($payment) === 'overdue')->count();

        return Inertia::render(WorkspacePage::resolve($request, 'payments/review'), [
            'filters' => $filters,
            'payments' => $paginator,
            'stats' => [
                'all' => $statsPayments->count(),
                'pending' => (int) ($statusCounts['pending'] ?? 0),
                'confirmed' => (int) ($statusCounts['confirmed'] ?? 0),
                'failed' => (int) ($statusCounts['failed'] ?? 0),
                'declined' => (int) ($statusCounts['declined'] ?? 0),
                'refunded' => (int) ($statusCounts['refunded'] ?? 0),
                'review_needed' => $reviewNeeded,
                'due_soon' => $dueSoon,
                'overdue' => $overdue,
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

    protected function matchesDeadlineFilter(BookingPayment $payment, string $deadline): bool
    {
        if ($deadline === '') {
            return true;
        }

        if ($deadline === 'review') {
            return strtolower((string) $payment->status) === 'pending';
        }

        return $this->deadlineBucket($payment) === $deadline;
    }

    protected function deadlineBucket(BookingPayment $payment): string
    {
        $summary = $this->bookingDeadlineSummary($payment->booking);

        return match ($summary['state']) {
            'first_due_soon', 'final_due_soon' => 'due_soon',
            'first_overdue', 'final_overdue' => 'overdue',
            default => 'none',
        };
    }

    protected function bookingDeadlineSummary(?Booking $booking): array
    {
        if (! $booking) {
            return ['state' => 'not_applicable'];
        }

        $itemsTotal = collect($booking->bookingServices ?? [])->reduce(function ($sum, $item) {
            return $sum + (float) ($item->service->price ?? 0);
        }, 0.0);

        $submittedTotal = collect($booking->payments ?? [])->reduce(fn ($sum, $payment) => $sum + (float) ($payment->amount ?? 0), 0.0);
        $confirmedTotal = collect($booking->payments ?? [])->reduce(fn ($sum, $payment) => $sum + (($payment->status ?? '') === 'confirmed' ? (float) ($payment->amount ?? 0) : 0.0), 0.0);

        $status = strtolower((string) ($booking->booking_status ?? 'pending'));
        if (in_array($status, ['cancelled', 'declined', 'completed'], true)) {
            return ['state' => 'not_applicable'];
        }

        $createdAt = $booking->created_at instanceof Carbon
            ? $booking->created_at->copy()
            : ($booking->created_at ? Carbon::parse($booking->created_at) : null);

        if (! $createdAt || $itemsTotal <= 0 || $confirmedTotal + 0.00001 >= $itemsTotal) {
            return ['state' => 'fulfilled'];
        }

        $firstDeadline = $createdAt->copy()->addHours(24);
        $finalDeadline = $createdAt->copy()->addHours(48);
        $now = now();
        $halfRequired = round($itemsTotal * 0.5, 2);

        if ($confirmedTotal + 0.00001 < $halfRequired) {
            if ($now->greaterThan($firstDeadline)) {
                return [
                    'state' => 'first_overdue',
                    'submitted_total' => $submittedTotal,
                    'confirmed_total' => $confirmedTotal,
                ];
            }

            if ($now->diffInHours($firstDeadline, false) <= 2) {
                return [
                    'state' => 'first_due_soon',
                    'submitted_total' => $submittedTotal,
                    'confirmed_total' => $confirmedTotal,
                ];
            }

            return ['state' => 'monitoring'];
        }

        if ($confirmedTotal + 0.00001 < $itemsTotal) {
            if ($now->greaterThan($finalDeadline)) {
                return [
                    'state' => 'final_overdue',
                    'submitted_total' => $submittedTotal,
                    'confirmed_total' => $confirmedTotal,
                ];
            }

            if ($now->diffInHours($finalDeadline, false) <= 6) {
                return [
                    'state' => 'final_due_soon',
                    'submitted_total' => $submittedTotal,
                    'confirmed_total' => $confirmedTotal,
                ];
            }
        }

        return ['state' => 'fulfilled'];
    }

    protected function transformPayment(BookingPayment $payment): array
    {
        $booking = $payment->booking;

        $itemsTotal = 0.0;
        $confirmedTotal = 0.0;
        $submittedTotal = 0.0;

        if ($booking) {
            $itemsTotal = collect($booking->bookingServices ?? [])->reduce(function ($sum, $item) {
                return $sum + (float) ($item->service->price ?? 0);
            }, 0.0);

            $submittedTotal = collect($booking->payments ?? [])->reduce(function ($sum, $row) {
                return $sum + (float) ($row->amount ?? 0);
            }, 0.0);

            $confirmedTotal = collect($booking->payments ?? [])->reduce(function ($sum, $row) {
                return $sum + (($row->status ?? '') === 'confirmed' ? (float) ($row->amount ?? 0) : 0.0);
            }, 0.0);
        }

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
            'proof_image_url' => $payment->proof_image_url,
            'paid_at' => optional($payment->paid_at)->toIso8601String(),
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
                'items' => collect($booking->bookingServices ?? [])->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'service_name' => $item->service?->name,
                        'area' => $item->service?->serviceType?->name,
                        'line_total' => (float) ($item->service->price ?? 0),
                    ];
                })->values()->all(),
                'totals' => [
                    'items_total' => $itemsTotal,
                    'submitted_payments_total' => $submittedTotal,
                    'confirmed_payments_total' => $confirmedTotal,
                    'remaining_balance' => max(0, $itemsTotal - $confirmedTotal),
                ],
            ] : null,
        ];
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
            ]
        );
    }
}
