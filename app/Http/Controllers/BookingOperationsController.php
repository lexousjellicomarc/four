<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookingLifecycleEvent;
use App\Models\BookingPayment;
use App\Services\BookingService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use App\Support\WorkspacePage;
use Inertia\Inertia;
use Inertia\Response;

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

        $this->applyDirectFilters($baseQuery, $filters);

        $bookings = $baseQuery
            ->get()
            ->filter(fn (Booking $booking) => $this->matchesDerivedFilters($booking, $filters))
            ->values();

        $paginated = $this->paginateCollection(
            $bookings,
            max(1, (int) $request->integer('page', 1)),
            10,
            $request
        );

        $paginated->setCollection(
            $paginated->getCollection()->map(fn (Booking $booking) => $this->transformBooking($booking))->values()
        );

        $summary = $this->summarizeBookings($bookings);

        $visibleIds = $bookings->pluck('id')->map(fn ($id) => (int) $id)->all();

        $pendingPayments = empty($visibleIds)
            ? collect()
            : BookingPayment::query()
                ->with(['booking'])
                ->where('status', 'pending')
                ->whereIn('booking_id', $visibleIds)
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

        $automationEvents = $this->automationEvents($filters);

        return Inertia::render(WorkspacePage::resolve($request, 'bookings/operations'), [
            'filters' => $filters,
            'bookings' => $paginated,
            'summary' => $summary,
            'pendingPayments' => $pendingPayments,
            'automationEvents' => $automationEvents,
        ]);
    }

    public function approvePayment(Request $request, BookingPayment $payment, BookingService $bookingService): RedirectResponse
    {
        Gate::authorize('payments.manage');

        $data = $request->validate([
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        if (! in_array((string) $payment->status, ['pending', 'failed'], true)) {
            return back()->with('error', 'Only pending or failed payments can be approved.');
        }

        DB::transaction(function () use ($data, $payment, $bookingService) {
            $payment->forceFill([
                'status' => 'confirmed',
                'remarks' => $this->mergeRemarks($payment->remarks, trim((string) ($data['remarks'] ?? 'Approved from operations center.'))),
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

        $data = $request->validate([
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        if ((string) $payment->status !== 'pending') {
            return back()->with('error', 'Only pending payments can be declined.');
        }

        DB::transaction(function () use ($data, $payment, $bookingService) {
            $payment->forceFill([
                'status' => 'declined',
                'remarks' => $this->mergeRemarks($payment->remarks, trim((string) ($data['remarks'] ?? 'Declined from operations center.'))),
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

        $data = $request->validate([
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        if ((string) $payment->status !== 'pending') {
            return back()->with('error', 'Only pending payments can be marked as failed.');
        }

        DB::transaction(function () use ($data, $payment, $bookingService) {
            $payment->forceFill([
                'status' => 'failed',
                'remarks' => $this->mergeRemarks($payment->remarks, trim((string) ($data['remarks'] ?? 'Marked failed from operations center.'))),
            ])->save();

            if ($payment->booking) {
                $bookingService->recalculatePaymentStatus($payment->booking->fresh(['bookingServices.service', 'payments']));
            }
        });

        return back()->with('success', 'Payment marked as failed.');
    }

    protected function applyDirectFilters(Builder $query, array $filters): void
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

    protected function matchesDerivedFilters(Booking $booking, array $filters): bool
    {
        $deadline = $this->deadlineStateFromModel($booking);

        if (($filters['risk'] ?? '') !== '' && ($deadline['risk'] ?? '') !== $filters['risk']) {
            return false;
        }

        return true;
    }

    protected function transformBooking(Booking $booking): array
    {
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
    }

    protected function summarizeBookings(Collection $bookings): array
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
            'submitted_total' => round($submittedTotal, 2),
            'confirmed_total' => round($confirmedTotal, 2),
            'outstanding_total' => round($outstandingTotal, 2),
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
        $createdAt = $booking->created_at instanceof Carbon
            ? $booking->created_at->copy()
            : ($booking->created_at ? Carbon::parse($booking->created_at) : now());

        $downRequired = $itemsTotal > 0 ? round($itemsTotal * 0.5, 2) : 0.0;
        $downDeadline = $createdAt->copy()->addHours(24);
        $fullDeadline = $createdAt->copy()->addHours(48);
        $now = now();

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

        if ($itemsTotal <= 0) {
            return [
                'risk' => 'normal',
                'label' => 'No payment gate',
                'recommended' => 'This booking has no billable amount blocking schedule progress.',
                'down_deadline' => $downDeadline->toIso8601String(),
                'full_deadline' => $fullDeadline->toIso8601String(),
                'down_required' => $downRequired,
                'submitted_total' => $submittedTotal,
                'confirmed_total' => $confirmedTotal,
            ];
        }

        $risk = 'normal';
        $label = 'On track';
        $recommended = 'No immediate action required.';

        if ($confirmedTotal + 0.00001 < $downRequired) {
            if ($downDeadline->isPast()) {
                $risk = 'overdue';
                $label = $submittedTotal > $confirmedTotal ? '24H awaiting review' : '24H overdue';
                $recommended = $submittedTotal > $confirmedTotal
                    ? 'A payment was submitted but is still pending review. Confirm or reject it immediately.'
                    : 'Review immediately. 50% down payment was not confirmed within the first 24 hours.';
            } elseif ($downDeadline->diffInHours($now) <= 6) {
                $risk = 'due_soon';
                $label = '24H due soon';
                $recommended = 'Follow up now. The booking is still waiting for the required 50% confirmed down payment.';
            } else {
                $risk = 'watch';
                $label = 'Awaiting 50%';
                $recommended = 'Monitor the initial down payment window.';
            }
        } elseif ($confirmedTotal + 0.00001 < $itemsTotal) {
            if ($fullDeadline->isPast()) {
                $risk = 'overdue';
                $label = $submittedTotal > $confirmedTotal ? '48H awaiting review' : '48H overdue';
                $recommended = $submittedTotal > $confirmedTotal
                    ? 'A remaining payment was submitted but is still pending review. Resolve it immediately.'
                    : 'Review immediately. The booking has not reached full confirmed compliance within 48 hours.';
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
            $recommended = 'Confirmed payment already satisfies the current automation thresholds.';
        }

        return [
            'risk' => $risk,
            'label' => $label,
            'recommended' => $recommended,
            'down_deadline' => $downDeadline->toIso8601String(),
            'full_deadline' => $fullDeadline->toIso8601String(),
            'down_required' => $downRequired,
            'submitted_total' => round($submittedTotal, 2),
            'confirmed_total' => round($confirmedTotal, 2),
        ];
    }

    protected function automationEvents(array $filters): Collection
    {
        if (! class_exists(BookingLifecycleEvent::class)) {
            return collect();
        }

        return BookingLifecycleEvent::query()
            ->with(['booking', 'actor:id,name,email'])
            ->when(($filters['booking_status'] ?? '') !== '', function (Builder $query) use ($filters) {
                $status = $filters['booking_status'];
                $query->where(function (Builder $nested) use ($status) {
                    $nested->where('to_status', $status)->orWhere('from_status', $status);
                });
            })
            ->when(($filters['payment_status'] ?? '') !== '', function (Builder $query) use ($filters) {
                $status = $filters['payment_status'];
                $query->where(function (Builder $nested) use ($status) {
                    $nested->where('to_payment_status', $status)->orWhere('from_payment_status', $status);
                });
            })
            ->when(($filters['q'] ?? '') !== '', function (Builder $query) use ($filters) {
                $search = '%' . $filters['q'] . '%';
                $query->where(function (Builder $nested) use ($search) {
                    $nested->where('title', 'like', $search)
                        ->orWhere('reason', 'like', $search)
                        ->orWhere('event_key', 'like', $search)
                        ->orWhereHas('actor', function (Builder $actor) use ($search) {
                            $actor->where('name', 'like', $search)
                                ->orWhere('email', 'like', $search);
                        });
                });
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
                    'event_at' => optional($event->event_at ?? $event->created_at)->toIso8601String(),
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
