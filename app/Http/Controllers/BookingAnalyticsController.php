<?php

namespace App\Http\Controllers;

use App\Models\BookingLifecycleEvent;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BookingAnalyticsController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        return Inertia::render('bookings/analytics', $this->buildPayload($request));
    }

    public function print(Request $request): InertiaResponse
    {
        return Inertia::render('bookings/analytics-print', [
            ...$this->buildPayload($request),
            'generatedAt' => now()->toIso8601String(),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $filters = $this->filters($request);

        $rows = $this->filteredBookingsWithTotalsQuery($filters)
            ->orderByDesc('bookings.created_at')
            ->get()
            ->map(function ($row) {
                $policy = $this->policySnapshot($row);

                return [
                    'Booking ID' => $row->id,
                    'Client' => $row->client_name,
                    'Company' => $row->company_name,
                    'Email' => $row->client_email,
                    'Event Type' => $row->type_of_event,
                    'Schedule From' => $row->booking_date_from,
                    'Schedule To' => $row->booking_date_to,
                    'Guests' => (int) ($row->number_of_guests ?? 0),
                    'Booking Status' => $row->booking_status,
                    'Payment Status' => $row->payment_status,
                    'Items Total' => number_format((float) ($row->items_total ?? 0), 2, '.', ''),
                    'Submitted Payments' => number_format((float) ($row->submitted_total ?? 0), 2, '.', ''),
                    'Confirmed Payments' => number_format((float) ($row->confirmed_total ?? 0), 2, '.', ''),
                    'Outstanding' => number_format(max(((float) ($row->items_total ?? 0)) - ((float) ($row->confirmed_total ?? 0)), 0), 2, '.', ''),
                    'Policy State' => $policy['state'],
                    'Down Payment Deadline' => $policy['down_payment_due_at'],
                    'Full Payment Deadline' => $policy['full_payment_due_at'],
                ];
            })
            ->values();

        $filename = 'booking-analytics-' . now()->format('Y-m-d-His') . '.csv';

        return response()->streamDownload(function () use ($rows) {
            $output = fopen('php://output', 'w');

            if ($output === false) {
                return;
            }

            if ($rows->isEmpty()) {
                fputcsv($output, ['No data']);
                fclose($output);
                return;
            }

            fputcsv($output, array_keys($rows->first()));
            foreach ($rows as $row) {
                fputcsv($output, array_values($row));
            }

            fclose($output);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function buildPayload(Request $request): array
    {
        $filters = $this->filters($request);
        $base = $this->filteredBookingsBaseQuery($filters);

        $summary = [
            'total_bookings' => (clone $base)->count('bookings.id'),
            'total_guests' => (int) ((clone $base)->sum('bookings.number_of_guests') ?: 0),
            'pending' => (clone $base)->where('bookings.booking_status', 'pending')->count('bookings.id'),
            'active' => (clone $base)->where('bookings.booking_status', 'active')->count('bookings.id'),
            'confirmed' => (clone $base)->where('bookings.booking_status', 'confirmed')->count('bookings.id'),
            'completed' => (clone $base)->where('bookings.booking_status', 'completed')->count('bookings.id'),
            'cancelled_declined' => (clone $base)->whereIn('bookings.booking_status', ['cancelled', 'declined'])->count('bookings.id'),
        ];

        $statusBreakdown = $this->normalizeBreakdown(
            (clone $base)
                ->selectRaw('COALESCE(bookings.booking_status, "unknown") as label, COUNT(DISTINCT bookings.id) as total')
                ->groupBy('bookings.booking_status')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($row) => ['label' => (string) $row->label, 'value' => (int) $row->total])
        );

        $paymentBreakdown = $this->normalizeBreakdown(
            (clone $base)
                ->selectRaw('COALESCE(bookings.payment_status, "unknown") as label, COUNT(DISTINCT bookings.id) as total')
                ->groupBy('bookings.payment_status')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($row) => ['label' => (string) $row->label, 'value' => (int) $row->total])
        );

        $rowsWithTotals = $this->filteredBookingsWithTotalsQuery($filters)
            ->orderByDesc('bookings.created_at')
            ->limit(400)
            ->get();

        $summary['submitted_revenue'] = round((float) $rowsWithTotals->sum(fn ($row) => (float) ($row->submitted_total ?? 0)), 2);
        $summary['confirmed_revenue'] = round((float) $rowsWithTotals->sum(fn ($row) => (float) ($row->confirmed_total ?? 0)), 2);
        $summary['outstanding_balance'] = round((float) $rowsWithTotals->sum(fn ($row) => max(((float) ($row->items_total ?? 0)) - ((float) ($row->confirmed_total ?? 0)), 0)), 2);

        $policySummary = [
            'due_24h_soon' => 0,
            'due_24h_overdue' => 0,
            'due_48h_soon' => 0,
            'due_48h_overdue' => 0,
            'half_paid_met' => 0,
            'fully_paid_met' => 0,
        ];

        $highRiskBookings = $rowsWithTotals
            ->map(function ($row) use (&$policySummary) {
                $policy = $this->policySnapshot($row);

                if ($policy['state'] === '24h_soon') $policySummary['due_24h_soon']++;
                if ($policy['state'] === '24h_overdue') $policySummary['due_24h_overdue']++;
                if ($policy['state'] === '48h_soon') $policySummary['due_48h_soon']++;
                if ($policy['state'] === '48h_overdue') $policySummary['due_48h_overdue']++;
                if ($policy['half_paid_met']) $policySummary['half_paid_met']++;
                if ($policy['fully_paid_met']) $policySummary['fully_paid_met']++;

                return [
                    'id' => (int) $row->id,
                    'client_name' => (string) ($row->client_name ?? ''),
                    'company_name' => (string) ($row->company_name ?? ''),
                    'type_of_event' => (string) ($row->type_of_event ?? ''),
                    'booking_status' => (string) ($row->booking_status ?? ''),
                    'payment_status' => (string) ($row->payment_status ?? ''),
                    'booking_date_from' => optional($this->safeCarbon($row->booking_date_from))->toIso8601String(),
                    'booking_date_to' => optional($this->safeCarbon($row->booking_date_to))->toIso8601String(),
                    'created_at' => optional($this->safeCarbon($row->created_at))->toIso8601String(),
                    'number_of_guests' => (int) ($row->number_of_guests ?? 0),
                    'items_total' => round((float) ($row->items_total ?? 0), 2),
                    'submitted_total' => round((float) ($row->submitted_total ?? 0), 2),
                    'confirmed_total' => round((float) ($row->confirmed_total ?? 0), 2),
                    'outstanding' => round(max(((float) ($row->items_total ?? 0)) - ((float) ($row->confirmed_total ?? 0)), 0), 2),
                    'policy' => $policy,
                ];
            })
            ->filter(fn (array $row) => in_array($row['policy']['state'], ['24h_soon', '24h_overdue', '48h_soon', '48h_overdue'], true))
            ->sortBy([
                fn (array $row) => match ($row['policy']['state']) {
                    '24h_overdue' => 0,
                    '48h_overdue' => 1,
                    '24h_soon' => 2,
                    '48h_soon' => 3,
                    default => 9,
                },
                fn (array $row) => $row['policy']['hours_since_created'] ?? 0,
            ])
            ->take(12)
            ->values();

        $monthlyTrend = $this->buildMonthlyTrend($filters);
        $upcomingWorkload = $this->buildUpcomingWorkload($filters);
        $topServices = $this->buildTopServices($filters);
        $automation = $this->buildAutomationSummary($filters);

        return [
            'filters' => $filters,
            'services' => Service::query()->orderBy('name')->get(['id', 'name'])->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
            ])->values(),
            'summary' => [
                ...$summary,
                ...$policySummary,
                ...$automation,
            ],
            'statusBreakdown' => $statusBreakdown,
            'paymentBreakdown' => $paymentBreakdown,
            'monthlyTrend' => $monthlyTrend,
            'upcomingWorkload' => $upcomingWorkload,
            'topServices' => $topServices,
            'highRiskBookings' => $highRiskBookings,
        ];
    }

    private function filters(Request $request): array
    {
        return [
            'q' => trim((string) $request->string('q')),
            'booking_status' => trim((string) $request->string('booking_status')),
            'payment_status' => trim((string) $request->string('payment_status')),
            'service_id' => trim((string) $request->string('service_id')),
            'date_from' => trim((string) $request->string('date_from')),
            'date_to' => trim((string) $request->string('date_to')),
        ];
    }

    private function filteredBookingsBaseQuery(array $filters): Builder
    {
        return DB::table('bookings')
            ->when($filters['q'] !== '', function (Builder $query) use ($filters) {
                $search = '%' . $filters['q'] . '%';
                $query->where(function (Builder $nested) use ($search) {
                    $nested->where('bookings.client_name', 'like', $search)
                        ->orWhere('bookings.company_name', 'like', $search)
                        ->orWhere('bookings.client_email', 'like', $search)
                        ->orWhere('bookings.type_of_event', 'like', $search);
                });
            })
            ->when($filters['booking_status'] !== '', fn (Builder $query) => $query->where('bookings.booking_status', $filters['booking_status']))
            ->when($filters['payment_status'] !== '', fn (Builder $query) => $query->where('bookings.payment_status', $filters['payment_status']))
            ->when($filters['service_id'] !== '', function (Builder $query) use ($filters) {
                $serviceId = (int) $filters['service_id'];
                $query->whereExists(function ($exists) use ($serviceId) {
                    $exists->selectRaw('1')
                        ->from('booking_services')
                        ->whereColumn('booking_services.booking_id', 'bookings.id')
                        ->where('booking_services.service_id', $serviceId);
                });
            })
            ->when($filters['date_from'] !== '' && $filters['date_to'] !== '', function (Builder $query) use ($filters) {
                $query->whereDate('bookings.booking_date_to', '>=', $filters['date_from'])
                    ->whereDate('bookings.booking_date_from', '<=', $filters['date_to']);
            })
            ->when($filters['date_from'] !== '' && $filters['date_to'] === '', fn (Builder $query) => $query->whereDate('bookings.booking_date_to', '>=', $filters['date_from']))
            ->when($filters['date_to'] !== '' && $filters['date_from'] === '', fn (Builder $query) => $query->whereDate('bookings.booking_date_from', '<=', $filters['date_to']));
    }

    private function filteredBookingsRowsQuery(array $filters): Builder
    {
        return $this->filteredBookingsBaseQuery($filters)->select('bookings.*');
    }

    private function filteredBookingsWithTotalsQuery(array $filters): Builder
    {
        $serviceTotals = DB::table('booking_services')
            ->join('services', 'services.id', '=', 'booking_services.service_id')
            ->selectRaw('booking_services.booking_id, COUNT(*) as services_count, COALESCE(SUM(services.price), 0) as items_total')
            ->groupBy('booking_services.booking_id');

        $paymentTotals = DB::table('booking_payments')
            ->selectRaw(
                "booking_payments.booking_id, COALESCE(SUM(booking_payments.amount), 0) as submitted_total, COALESCE(SUM(CASE WHEN booking_payments.status = 'confirmed' THEN booking_payments.amount ELSE 0 END), 0) as confirmed_total"
            )
            ->groupBy('booking_payments.booking_id');

        return $this->filteredBookingsRowsQuery($filters)
            ->leftJoinSub($serviceTotals, 'service_totals', fn ($join) => $join->on('service_totals.booking_id', '=', 'bookings.id'))
            ->leftJoinSub($paymentTotals, 'payment_totals', fn ($join) => $join->on('payment_totals.booking_id', '=', 'bookings.id'))
            ->addSelect([
                DB::raw('COALESCE(service_totals.services_count, 0) as services_count'),
                DB::raw('COALESCE(service_totals.items_total, 0) as items_total'),
                DB::raw('COALESCE(payment_totals.submitted_total, 0) as submitted_total'),
                DB::raw('COALESCE(payment_totals.confirmed_total, 0) as confirmed_total'),
            ]);
    }

    private function buildMonthlyTrend(array $filters): array
    {
        $months = [];

        foreach (range(11, 0) as $offset) {
            $date = now()->startOfMonth()->subMonths($offset);
            $key = $date->format('Y-m');

            $months[$key] = [
                'key' => $key,
                'label' => $date->format('M Y'),
                'bookings' => 0,
                'guests' => 0,
                'confirmed_revenue' => 0.0,
            ];
        }

        $bookingGroups = $this->filteredBookingsBaseQuery($filters)
            ->whereDate('bookings.booking_date_from', '>=', now()->startOfMonth()->subMonths(11)->toDateString())
            ->selectRaw("DATE_FORMAT(bookings.booking_date_from, '%Y-%m') as ym, COUNT(DISTINCT bookings.id) as total, COALESCE(SUM(bookings.number_of_guests), 0) as guests")
            ->groupBy('ym')
            ->get();

        foreach ($bookingGroups as $group) {
            $key = (string) $group->ym;
            if (! array_key_exists($key, $months)) {
                continue;
            }

            $months[$key]['bookings'] = (int) $group->total;
            $months[$key]['guests'] = (int) $group->guests;
        }

        $revenueGroups = DB::table('booking_payments')
            ->join('bookings', 'bookings.id', '=', 'booking_payments.booking_id')
            ->where('booking_payments.status', 'confirmed')
            ->when($filters['q'] !== '', function (Builder $query) use ($filters) {
                $search = '%' . $filters['q'] . '%';
                $query->where(function (Builder $nested) use ($search) {
                    $nested->where('bookings.client_name', 'like', $search)
                        ->orWhere('bookings.company_name', 'like', $search)
                        ->orWhere('bookings.client_email', 'like', $search)
                        ->orWhere('bookings.type_of_event', 'like', $search);
                });
            })
            ->when($filters['booking_status'] !== '', fn (Builder $query) => $query->where('bookings.booking_status', $filters['booking_status']))
            ->when($filters['payment_status'] !== '', fn (Builder $query) => $query->where('bookings.payment_status', $filters['payment_status']))
            ->when($filters['service_id'] !== '', function (Builder $query) use ($filters) {
                $serviceId = (int) $filters['service_id'];
                $query->whereExists(function ($exists) use ($serviceId) {
                    $exists->selectRaw('1')
                        ->from('booking_services')
                        ->whereColumn('booking_services.booking_id', 'bookings.id')
                        ->where('booking_services.service_id', $serviceId);
                });
            })
            ->when($filters['date_from'] !== '' && $filters['date_to'] !== '', function (Builder $query) use ($filters) {
                $query->whereDate('bookings.booking_date_to', '>=', $filters['date_from'])
                    ->whereDate('bookings.booking_date_from', '<=', $filters['date_to']);
            })
            ->when($filters['date_from'] !== '' && $filters['date_to'] === '', fn (Builder $query) => $query->whereDate('bookings.booking_date_to', '>=', $filters['date_from']))
            ->when($filters['date_to'] !== '' && $filters['date_from'] === '', fn (Builder $query) => $query->whereDate('bookings.booking_date_from', '<=', $filters['date_to']))
            ->whereDate('booking_payments.created_at', '>=', now()->startOfMonth()->subMonths(11)->toDateString())
            ->selectRaw("DATE_FORMAT(booking_payments.created_at, '%Y-%m') as ym, COALESCE(SUM(booking_payments.amount), 0) as total")
            ->groupBy('ym')
            ->get();

        foreach ($revenueGroups as $group) {
            $key = (string) $group->ym;
            if (! array_key_exists($key, $months)) {
                continue;
            }

            $months[$key]['confirmed_revenue'] = round((float) $group->total, 2);
        }

        return array_values($months);
    }

    private function buildUpcomingWorkload(array $filters): array
    {
        $today = now()->startOfDay();
        $end = now()->copy()->addDays(29)->endOfDay();

        $rows = $this->filteredBookingsBaseQuery($filters)
            ->whereBetween('bookings.booking_date_from', [$today, $end])
            ->selectRaw('DATE(bookings.booking_date_from) as work_date, COUNT(DISTINCT bookings.id) as bookings_count, COALESCE(SUM(bookings.number_of_guests), 0) as guests_total')
            ->groupBy('work_date')
            ->orderBy('work_date')
            ->get();

        return $rows->map(fn ($row) => [
            'date' => (string) $row->work_date,
            'label' => Carbon::parse($row->work_date)->format('M d'),
            'bookings' => (int) $row->bookings_count,
            'guests' => (int) $row->guests_total,
        ])->values()->all();
    }

    private function buildTopServices(array $filters): array
    {
        return DB::table('booking_services')
            ->join('services', 'services.id', '=', 'booking_services.service_id')
            ->join('bookings', 'bookings.id', '=', 'booking_services.booking_id')
            ->when($filters['q'] !== '', function (Builder $query) use ($filters) {
                $search = '%' . $filters['q'] . '%';
                $query->where(function (Builder $nested) use ($search) {
                    $nested->where('bookings.client_name', 'like', $search)
                        ->orWhere('bookings.company_name', 'like', $search)
                        ->orWhere('bookings.client_email', 'like', $search)
                        ->orWhere('bookings.type_of_event', 'like', $search);
                });
            })
            ->when($filters['booking_status'] !== '', fn (Builder $query) => $query->where('bookings.booking_status', $filters['booking_status']))
            ->when($filters['payment_status'] !== '', fn (Builder $query) => $query->where('bookings.payment_status', $filters['payment_status']))
            ->when($filters['service_id'] !== '', fn (Builder $query) => $query->where('booking_services.service_id', (int) $filters['service_id']))
            ->when($filters['date_from'] !== '' && $filters['date_to'] !== '', function (Builder $query) use ($filters) {
                $query->whereDate('bookings.booking_date_to', '>=', $filters['date_from'])
                    ->whereDate('bookings.booking_date_from', '<=', $filters['date_to']);
            })
            ->when($filters['date_from'] !== '' && $filters['date_to'] === '', fn (Builder $query) => $query->whereDate('bookings.booking_date_to', '>=', $filters['date_from']))
            ->when($filters['date_to'] !== '' && $filters['date_from'] === '', fn (Builder $query) => $query->whereDate('bookings.booking_date_from', '<=', $filters['date_to']))
            ->selectRaw('services.name as label, COUNT(*) as usage_count, COALESCE(SUM(services.price), 0) as revenue_total')
            ->groupBy('services.name')
            ->orderByDesc('usage_count')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'label' => (string) $row->label,
                'usage_count' => (int) $row->usage_count,
                'revenue_total' => round((float) $row->revenue_total, 2),
            ])
            ->values()
            ->all();
    }

    private function buildAutomationSummary(array $filters): array
    {
        if (! class_exists(BookingLifecycleEvent::class)) {
            return [
                'automation_events_7d' => 0,
                'auto_declined_7d' => 0,
                'auto_deleted_7d' => 0,
            ];
        }

        $base = BookingLifecycleEvent::query()
            ->with(['actor:id,name,email'])
            ->where('event_at', '>=', now()->subDays(7));

        if ($filters['booking_status'] !== '') {
            $base->where(function ($query) use ($filters) {
                $query->where('to_status', $filters['booking_status'])
                    ->orWhere('from_status', $filters['booking_status']);
            });
        }

        if ($filters['payment_status'] !== '') {
            $base->where(function ($query) use ($filters) {
                $query->where('to_payment_status', $filters['payment_status'])
                    ->orWhere('from_payment_status', $filters['payment_status']);
            });
        }

        if ($filters['q'] !== '') {
            $search = '%' . $filters['q'] . '%';
            $base->where(function ($query) use ($search) {
                $query->where('title', 'like', $search)
                    ->orWhere('reason', 'like', $search)
                    ->orWhere('event_key', 'like', $search)
                    ->orWhereHas('actor', function ($actor) use ($search) {
                        $actor->where('name', 'like', $search)
                            ->orWhere('email', 'like', $search);
                    });
            });
        }

        return [
            'automation_events_7d' => (clone $base)->whereNull('actor_user_id')->count(),
            'auto_declined_7d' => (clone $base)->whereNull('actor_user_id')->where('to_status', 'declined')->count(),
            'auto_deleted_7d' => (clone $base)->whereNull('actor_user_id')->where('event_key', 'booking_auto_deleted')->count(),
        ];
    }

    private function policySnapshot(object $row): array
    {
        $createdAt = $this->safeCarbon($row->created_at);
        $itemsTotal = (float) ($row->items_total ?? 0);
        $submittedTotal = (float) ($row->submitted_total ?? 0);
        $confirmedTotal = (float) ($row->confirmed_total ?? 0);
        $halfRequired = round($itemsTotal * 0.5, 2);

        $downDue = $createdAt?->copy()->addDay();
        $fullDue = $createdAt?->copy()->addDays(2);
        $now = now();

        $state = 'ok';
        $stateLabel = 'On track';
        $hoursSinceCreated = $createdAt ? round($createdAt->diffInMinutes($now) / 60, 1) : null;

        $isClosed = in_array((string) ($row->booking_status ?? ''), ['declined', 'cancelled', 'completed'], true);

        if (! $isClosed && $createdAt) {
            if ($confirmedTotal + 0.00001 < $halfRequired) {
                if ($downDue && $now->greaterThan($downDue)) {
                    $state = '24h_overdue';
                    $stateLabel = '50% down payment overdue';
                } elseif ($downDue && $now->diffInHours($downDue, false) <= 6) {
                    $state = '24h_soon';
                    $stateLabel = '50% down payment due soon';
                }
            } elseif ($confirmedTotal + 0.00001 < $itemsTotal) {
                if ($fullDue && $now->greaterThan($fullDue)) {
                    $state = '48h_overdue';
                    $stateLabel = 'Full payment overdue';
                } elseif ($fullDue && $now->diffInHours($fullDue, false) <= 8) {
                    $state = '48h_soon';
                    $stateLabel = 'Full payment due soon';
                }
            }
        }

        return [
            'state' => $state,
            'label' => $stateLabel,
            'hours_since_created' => $hoursSinceCreated,
            'half_required' => round($halfRequired, 2),
            'submitted_total' => round($submittedTotal, 2),
            'confirmed_total' => round($confirmedTotal, 2),
            'half_paid_met' => $itemsTotal > 0 ? $confirmedTotal + 0.00001 >= $halfRequired : false,
            'fully_paid_met' => $itemsTotal > 0 ? $confirmedTotal + 0.00001 >= $itemsTotal : false,
            'down_payment_due_at' => optional($downDue)->toIso8601String(),
            'full_payment_due_at' => optional($fullDue)->toIso8601String(),
        ];
    }

    private function normalizeBreakdown(Collection $rows): array
    {
        return $rows
            ->map(function ($row) {
                $label = (string) ($row['label'] ?? 'unknown');
                $value = (int) ($row['value'] ?? 0);

                return [
                    'label' => $label !== '' ? ucfirst(str_replace('_', ' ', $label)) : 'Unknown',
                    'value' => $value,
                ];
            })
            ->values()
            ->all();
    }

    private function safeCarbon(mixed $value): ?Carbon
    {
        if (empty($value)) {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }
}
