<?php

namespace App\Http\Controllers;

use App\Models\BookingPayment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

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

        $baseQuery = BookingPayment::query()
            ->with([
                'booking' => function ($query) {
                    $query->with(['bookingServices.service', 'payments', 'createdBy']);
                },
            ]);

        $this->applyFilters($baseQuery, $filters);

        $payments = $baseQuery
            ->latest('created_at')
            ->paginate(12)
            ->withQueryString()
            ->through(function (BookingPayment $payment) {
                $booking = $payment->booking;

                $itemsTotal = 0.0;
                $confirmedTotal = 0.0;
                $submittedTotal = 0.0;

                if ($booking) {
                    $itemsTotal = collect($booking->bookingServices ?? [])->reduce(function ($sum, $item) {
                        $price = (float) ($item->service->price ?? 0);
                        return $sum + $price;
                    }, 0.0);

                    $submittedTotal = collect($booking->payments ?? [])->reduce(function ($sum, $row) {
                        return $sum + (float) ($row->amount ?? 0);
                    }, 0.0);

                    $confirmedTotal = collect($booking->payments ?? [])->reduce(function ($sum, $row) {
                        return $sum + (($row->status ?? '') === 'confirmed' ? (float) ($row->amount ?? 0) : 0);
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
            });

        $countsQuery = BookingPayment::query();
        $this->applyFilters($countsQuery, array_merge($filters, ['status' => '', 'deadline' => '']));

        $statusCounts = (clone $countsQuery)
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $allCount = (clone $countsQuery)->count();

        $reviewQuery = BookingPayment::query();
        $this->applyFilters($reviewQuery, array_merge($filters, ['status' => '', 'deadline' => 'review']));

        $dueSoonQuery = BookingPayment::query();
        $this->applyFilters($dueSoonQuery, array_merge($filters, ['status' => '', 'deadline' => 'due_soon']));

        $overdueQuery = BookingPayment::query();
        $this->applyFilters($overdueQuery, array_merge($filters, ['status' => '', 'deadline' => 'overdue']));

        return Inertia::render('payments/review', [
            'filters' => $filters,
            'payments' => $payments,
            'stats' => [
                'all' => $allCount,
                'pending' => (int) ($statusCounts['pending'] ?? 0),
                'confirmed' => (int) ($statusCounts['confirmed'] ?? 0),
                'failed' => (int) ($statusCounts['failed'] ?? 0),
                'declined' => (int) ($statusCounts['declined'] ?? 0),
                'refunded' => (int) ($statusCounts['refunded'] ?? 0),
                'review_needed' => $reviewQuery->count(),
                'due_soon' => $dueSoonQuery->count(),
                'overdue' => $overdueQuery->count(),
            ],
        ]);
    }

    protected function applyFilters(Builder $query, array $filters): void
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

        $deadline = $filters['deadline'] ?? '';
        if ($deadline !== '') {
            $query->whereHas('booking', function (Builder $bookingQuery) use ($deadline) {
                $bookingQuery->whereNotIn('booking_status', ['cancelled', 'declined', 'completed']);

                $now = now();
                $firstDeadline = now()->subHours(24);
                $finalDeadline = now()->subHours(48);
                $soon24 = now()->addHours(2);
                $soon48 = now()->addHours(6);

                if ($deadline === 'review') {
                    $bookingQuery->where(function (Builder $nested) {
                        $nested->where('payment_status', '!=', 'paid')->orWhereNull('payment_status');
                    });
                    return;
                }

                if ($deadline === 'overdue') {
                    $bookingQuery->where(function (Builder $nested) use ($firstDeadline, $finalDeadline) {
                        $nested
                            ->where(function (Builder $q) use ($firstDeadline) {
                                $q->where('created_at', '<=', $firstDeadline)
                                    ->where(function (Builder $qq) {
                                        $qq->where('payment_status', 'unpaid')->orWhereNull('payment_status');
                                    });
                            })
                            ->orWhere(function (Builder $q) use ($finalDeadline) {
                                $q->where('created_at', '<=', $finalDeadline)
                                    ->where('payment_status', 'partial');
                            });
                    });
                    return;
                }

                if ($deadline === 'due_soon') {
                    $bookingQuery->where(function (Builder $nested) use ($now, $soon24, $soon48) {
                        $nested
                            ->where(function (Builder $q) use ($now, $soon24) {
                                $q->whereBetween('created_at', [$now->copy()->subHours(22), $soon24])
                                    ->where(function (Builder $qq) {
                                        $qq->where('payment_status', 'unpaid')->orWhereNull('payment_status');
                                    });
                            })
                            ->orWhere(function (Builder $q) use ($now, $soon48) {
                                $q->whereBetween('created_at', [$now->copy()->subHours(42), $soon48])
                                    ->where('payment_status', 'partial');
                            });
                    });
                }
            });
        }
    }
}
