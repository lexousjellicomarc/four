<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookingLifecycleEvent;
use App\Models\BookingPayment;
use App\Services\BookingService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class BookingOperationsController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('bookings.view');

        $filters = [
            'q' => trim((string) $request->string('q')->value('')),
            'booking_status' => trim((string) $request->string('booking_status')->value('')),
            'payment_status' => trim((string) $request->string('payment_status')->value('')),
            'risk' => trim((string) $request->string('risk')->value('')),
            'attention' => trim((string) $request->string('attention')->value('')),
            'gateway' => trim((string) $request->string('gateway')->value('')),
        ];

        $baseQuery = Booking::query()
            ->with([
                'bookingServices.service.serviceType',
                'payments' => fn ($query) => $query->latest('created_at'),
                'createdBy',
            ])
            ->latest('created_at');

        $this->applyBookingFilters($baseQuery, $filters);

        $bookings = $baseQuery
            ->paginate(10)
            ->withQueryString()
            ->through(function (Booking $booking) {
                $itemsTotal = collect($booking->bookingServices ?? [])->reduce(function ($sum, $item) {
                    return $sum + (float) ($item->service->price ?? 0);
                }, 0.0);

                $submittedTotal = collect($booking->payments ?? [])->reduce(function ($sum, $payment) {
                    return $sum + (float) ($payment->amount ?? 0);
                }, 0.0);

                $confirmedTotal = collect($booking->payments ?? [])->reduce(function ($sum, $payment) {
                    return $sum + (($payment->status ?? '') === 'confirmed' ? (float) ($payment->amount ?? 0) : 0.0);
                }, 0.0);

                $deadline = $this->deadlineState($booking, $itemsTotal, $submittedTotal, $confirmedTotal);

                return [
                    'id' => $booking->id,
                    'client_name' => $booking->client_name,
                    'company_name' => $booking->company_name,
                    'client_email' => $booking->client_email,
                    'client_contact_number' => $booking->client_contact_number,
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
                    'latest_payment' => optional(collect($booking->payments ?? [])->first(), function ($payment) {
                        return [
                            'id' => $payment->id,
                            'status' => $payment->status,
                            'amount' => (float) $payment->amount,
                            'payment_gateway' => $payment->payment_gateway,
                            'payment_type' => $payment->payment_type,
                            'transaction_reference' => $payment->transaction_reference,
                            'proof_image_url' => $payment->proof_image_url,
                            'created_at' => optional($payment->created_at)->toIso8601String(),
                        ];
                    }),
                    'totals' => [
                        'items_total' => $itemsTotal,
                        'submitted_payments_total' => $submittedTotal,
                        'confirmed_payments_total' => $confirmedTotal,
                        'remaining_balance' => max(0, $itemsTotal - $confirmedTotal),
                        'down_payment_required' => $itemsTotal > 0 ? round($itemsTotal * 0.5, 2) : 0.0,
                    ],
                    'deadline' => $deadline,
                ];
            });

        $allBookingsQuery = Booking::query()->with(['bookingServices.service', 'payments']);
        $this->applyBookingFilters($allBookingsQuery, array_merge($filters, ['attention' => '', 'risk' => '', 'gateway' => '']));
        $allVisibleBookings = $allBookingsQuery->get();

        $summary = $this->summarizeBookings($allVisibleBookings);

        $pendingPayments = BookingPayment::query()
            ->with(['booking'])
            ->where('status', 'pending')
            ->latest('created_at')
            ->limit(8)
            ->get()
            ->map(function (BookingPayment $payment) {
                return [
                    'id' => $payment->id,
                    'amount' => (float) $payment->amount,
                    'status' => $payment->status,
                    'payment_gateway' => $payment->payment_gateway,
                    'payment_type' => $payment->payment_type,
                    'transaction_reference' => $payment->transaction_reference,
                    'payer_name' => $payment->payer_name,
                    'proof_image_url' => $payment->proof_image_url,
                    'created_at' => optional($payment->created_at)->toIso8601String(),
                    'booking' => $payment->booking ? [
                        'id' => $payment->booking->id,
                        'client_name' => $payment->booking->client_name,
                        'company_name' => $payment->booking->company_name,
                        'booking_status' => $payment->booking->booking_status,
                        'payment_status' => $payment->booking->payment_status,
                    ] : null,
                ];
            })
            ->values();

        $automationEvents = collect();
        try {
            if (class_exists(BookingLifecycleEvent::class)) {
                $automationEvents = BookingLifecycleEvent::query()
                    ->with(['booking'])
                    ->where(function (Builder $query) {
                        $query->where('event_key', 'booking_auto_deleted')
                            ->orWhere('event_key', 'booking_status_changed')
                            ->orWhere('event_key', 'payment_status_changed');
                    })
                    ->latest('event_at')
                    ->limit(10)
                    ->get()
                    ->map(function (BookingLifecycleEvent $event) {
                        return [
                            'id' => $event->id,
                            'event_key' => $event->event_key,
                            'title' => $event->title,
                            'reason' => $event->reason,
                            'from_status' => $event->from_status,
                            'to_status' => $event->to_status,
                            'from_payment_status' => $event->from_payment_status,
                            'to_payment_status' => $event->to_payment_status,
                            'event_at' => optional($event->event_at)->toIso8601String(),
                            'meta' => $event->meta,
                            'booking' => $event->booking ? [
                                'id' => $event->booking->id,
                                'client_name' => $event->booking->client_name,
                                'company_name' => $event->booking->company_name,
                            ] : null,
                        ];
                    })
                    ->values();
            }
        } catch (Throwable) {
            $automationEvents = collect();
        }

        return Inertia::render('bookings/operations', [
            'filters' => $filters,
            'bookings' => $bookings,
            'summary' => $summary,
            'pendingPayments' => $pendingPayments,
            'automationEvents' => $automationEvents,
        ]);
    }

    public function approvePayment(Request $request, BookingPayment $payment, BookingService $bookingService): RedirectResponse
    {
        Gate::authorize('payments.manage');

        DB::transaction(function () use ($request, $payment, $bookingService) {
            $payment->forceFill([
                'status' => 'confirmed',
                'remarks' => $this->mergeRemarks($payment->remarks, $request->string('remarks')->value('Approved from operations center.')),
                'paid_at' => $payment->paid_at ?: now(),
            ])->save();

            if ($payment->booking) {
                $bookingService->recalculatePaymentStatus($payment->booking->fresh(['bookingServices.service', 'payments']));
            }
        });

        return back()->with('success', 'Payment approved successfully.');
    }

    public function declinePayment(Request $request, BookingPayment $payment, BookingService $bookingService): RedirectResponse
    {
        Gate::authorize('payments.manage');

        DB::transaction(function () use ($request, $payment, $bookingService) {
            $payment->forceFill([
                'status' => 'declined',
                'remarks' => $this->mergeRemarks($payment->remarks, $request->string('remarks')->value('Declined from operations center.')),
            ])->save();

            if ($payment->booking) {
                $bookingService->recalculatePaymentStatus($payment->booking->fresh(['bookingServices.service', 'payments']));
            }
        });

        return back()->with('success', 'Payment declined successfully.');
    }

    public function failPayment(Request $request, BookingPayment $payment, BookingService $bookingService): RedirectResponse
    {
        Gate::authorize('payments.manage');

        DB::transaction(function () use ($request, $payment, $bookingService) {
            $payment->forceFill([
                'status' => 'failed',
                'remarks' => $this->mergeRemarks($payment->remarks, $request->string('remarks')->value('Marked failed from operations center.')),
            ])->save();

            if ($payment->booking) {
                $bookingService->recalculatePaymentStatus($payment->booking->fresh(['bookingServices.service', 'payments']));
            }
        });

        return back()->with('success', 'Payment marked as failed.');
    }

    protected function applyBookingFilters(Builder $query, array $filters): void
    {
        $query->when($filters['q'] ?? null, function (Builder $builder, string $search) {
            $builder->where(function (Builder $nested) use ($search) {
                $nested
                    ->where('client_name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('client_email', 'like', "%{$search}%")
                    ->orWhere('type_of_event', 'like', "%{$search}%");
            });
        });

        $query->when($filters['booking_status'] ?? null, fn (Builder $builder, string $value) => $builder->where('booking_status', $value));
        $query->when($filters['payment_status'] ?? null, fn (Builder $builder, string $value) => $builder->where('payment_status', $value));

        $query->when($filters['gateway'] ?? null, function (Builder $builder, string $gateway) {
            $builder->whereHas('payments', fn (Builder $paymentQuery) => $paymentQuery->where('payment_gateway', $gateway));
        });

        if (($filters['risk'] ?? '') !== '') {
            $risk = $filters['risk'];
            $bookings = Booking::query()->with(['bookingServices.service', 'payments'])->get();
            $ids = $bookings
                ->filter(fn (Booking $booking) => ($this->deadlineStateFromModel($booking)['risk'] ?? 'normal') === $risk)
                ->pluck('id')
                ->all();
            $query->whereIn('id', count($ids) > 0 ? $ids : [0]);
        }

        if (($filters['attention'] ?? '') !== '') {
            $attention = $filters['attention'];

            if ($attention === 'needs_review') {
                $query->whereHas('payments', fn (Builder $payments) => $payments->where('status', 'pending'));
            } elseif ($attention === 'with_proof') {
                $query->whereHas('payments', fn (Builder $payments) => $payments->whereNotNull('proof_image_path'));
            } elseif ($attention === 'outstanding') {
                $query->where(function (Builder $bookingQuery) {
                    $bookingQuery->whereNull('payment_status')->orWhereIn('payment_status', ['unpaid', 'partial', 'owing']);
                });
            }
        }
    }

    protected function summarizeBookings($bookings): array
    {
        $visible = $bookings->count();
        $reviewNeeded = 0;
        $dueSoon = 0;
        $overdue = 0;
        $outstandingTotal = 0.0;
        $submittedTotal = 0.0;
        $confirmedTotal = 0.0;

        foreach ($bookings as $booking) {
            $itemsTotal = collect($booking->bookingServices ?? [])->reduce(function ($sum, $item) {
                return $sum + (float) ($item->service->price ?? 0);
            }, 0.0);

            $submitted = collect($booking->payments ?? [])->reduce(fn ($sum, $payment) => $sum + (float) ($payment->amount ?? 0), 0.0);
            $confirmed = collect($booking->payments ?? [])->reduce(fn ($sum, $payment) => $sum + (($payment->status ?? '') === 'confirmed' ? (float) ($payment->amount ?? 0) : 0.0), 0.0);

            $submittedTotal += $submitted;
            $confirmedTotal += $confirmed;
            $outstandingTotal += max(0, $itemsTotal - $confirmed);

            if (collect($booking->payments ?? [])->contains(fn ($payment) => ($payment->status ?? '') === 'pending')) {
                $reviewNeeded++;
            }

            $deadline = $this->deadlineState($booking, $itemsTotal, $submitted, $confirmed);
            if (($deadline['risk'] ?? '') === 'due_soon') {
                $dueSoon++;
            } elseif (($deadline['risk'] ?? '') === 'overdue') {
                $overdue++;
            }
        }

        return [
            'visible' => $visible,
            'review_needed' => $reviewNeeded,
            'due_soon' => $dueSoon,
            'overdue' => $overdue,
            'submitted_total' => $submittedTotal,
            'confirmed_total' => $confirmedTotal,
            'outstanding_total' => $outstandingTotal,
        ];
    }

    protected function deadlineStateFromModel(Booking $booking): array
    {
        $itemsTotal = collect($booking->bookingServices ?? [])->reduce(function ($sum, $item) {
            return $sum + (float) ($item->service->price ?? 0);
        }, 0.0);

        $submitted = collect($booking->payments ?? [])->reduce(fn ($sum, $payment) => $sum + (float) ($payment->amount ?? 0), 0.0);
        $confirmed = collect($booking->payments ?? [])->reduce(fn ($sum, $payment) => $sum + (($payment->status ?? '') === 'confirmed' ? (float) ($payment->amount ?? 0) : 0.0), 0.0);

        return $this->deadlineState($booking, $itemsTotal, $submitted, $confirmed);
    }

    protected function deadlineState(Booking $booking, float $itemsTotal, float $submittedTotal, float $confirmedTotal): array
    {
        $createdAt = $booking->created_at ? now()->parse($booking->created_at) : now();
        $downRequired = $itemsTotal > 0 ? round($itemsTotal * 0.5, 2) : 0.0;
        $downDeadline = $createdAt->copy()->addHours(24);
        $fullDeadline = $createdAt->copy()->addHours(48);
        $now = now();

        $risk = 'normal';
        $label = 'On track';
        $recommended = 'No immediate action required.';

        if (in_array((string) $booking->booking_status, ['cancelled', 'declined', 'completed'], true)) {
            return [
                'risk' => 'closed',
                'label' => 'Closed',
                'recommended' => 'This booking is no longer inside the payment-rule watch list.',
                'down_deadline' => $downDeadline->toIso8601String(),
                'full_deadline' => $fullDeadline->toIso8601String(),
                'down_required' => $downRequired,
                'submitted_total' => $submittedTotal,
                'confirmed_total' => $confirmedTotal,
            ];
        }

        if ($submittedTotal + 0.00001 < $downRequired) {
            if ($downDeadline->isPast()) {
                $risk = 'overdue';
                $label = '24H overdue';
                $recommended = 'Review immediately. 50% down payment was not submitted within the first 24 hours.';
            } elseif ($downDeadline->diffInHours($now) <= 6) {
                $risk = 'due_soon';
                $label = '24H due soon';
                $recommended = 'Follow up now. The booking is still waiting for the required 50% down payment.';
            } else {
                $risk = 'watch';
                $label = 'Awaiting 50%';
                $recommended = 'Monitor the initial down payment window.';
            }
        } elseif ($confirmedTotal + 0.00001 < $itemsTotal) {
            if ($fullDeadline->isPast()) {
                $risk = 'overdue';
                $label = '48H overdue';
                $recommended = 'Review immediately. The booking has not reached full compliance within 48 hours.';
            } elseif ($fullDeadline->diffInHours($now) <= 8) {
                $risk = 'due_soon';
                $label = '48H due soon';
                $recommended = 'Follow up for the remaining balance before the final payment window closes.';
            } else {
                $risk = 'watch';
                $label = 'Balance pending';
                $recommended = 'The 50% threshold is met, but the booking still has an outstanding balance.';
            }
        } else {
            $risk = 'normal';
            $label = 'Payment covered';
            $recommended = 'Payment already satisfies the current automation thresholds.';
        }

        return [
            'risk' => $risk,
            'label' => $label,
            'recommended' => $recommended,
            'down_deadline' => $downDeadline->toIso8601String(),
            'full_deadline' => $fullDeadline->toIso8601String(),
            'down_required' => $downRequired,
            'submitted_total' => $submittedTotal,
            'confirmed_total' => $confirmedTotal,
        ];
    }

    protected function mergeRemarks(?string $existing, string $message): string
    {
        $existing = trim((string) $existing);
        $message = trim($message);

        if ($existing === '') {
            return $message;
        }

        return $existing . "\n" . '[' . now()->format('Y-m-d H:i') . '] ' . $message;
    }
}
