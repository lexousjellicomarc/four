<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\MiceRecord;
use App\Support\WorkspaceAccess;
use App\Support\WorkspacePage;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MiceRegistryController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        return Inertia::render(
            WorkspacePage::resolve($request, 'reports/mice-registry'),
            array_merge($this->buildPayload($request), [
                'workspaceRole' => WorkspaceAccess::role($request),
                'can_manage' => $this->canManage($request),
            ])
        );
    }

    public function create(Request $request): InertiaResponse
    {
        $prefillBookingId = $request->integer('booking_id') ?: null;

        return Inertia::render(WorkspacePage::resolve($request, 'reports/mice-registry-form'), [
            'workspaceRole' => WorkspaceAccess::role($request),
            'mode' => 'create',
            'record' => null,
            'booking_options' => $this->bookingOptions(),
            'prefill_booking_id' => $prefillBookingId,
            'form_meta' => $this->formMeta(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($this->canManage($request), 403);

        $payload = $this->validatedPayload($request);

        if (! empty($payload['booking_id'])) {
            MiceRecord::query()->updateOrCreate(
                ['booking_id' => $payload['booking_id']],
                $payload,
            );
        } else {
            MiceRecord::query()->create($payload);
        }

        return redirect()
            ->route(WorkspacePage::routeName($request, 'reports.mice-registry'))
            ->with('success', 'MICE registry entry saved successfully.');
    }

    public function edit(Request $request, MiceRecord $miceRecord): InertiaResponse
    {
        abort_unless($this->canManage($request), 403);

        return Inertia::render(WorkspacePage::resolve($request, 'reports/mice-registry-form'), [
            'workspaceRole' => WorkspaceAccess::role($request),
            'mode' => 'edit',
            'record' => $this->serializeRecord($miceRecord->loadMissing('booking')),
            'booking_options' => $this->bookingOptions(),
            'prefill_booking_id' => $miceRecord->booking_id,
            'form_meta' => $this->formMeta(),
        ]);
    }

    public function update(Request $request, MiceRecord $miceRecord): RedirectResponse
    {
        abort_unless($this->canManage($request), 403);

        $payload = $this->validatedPayload($request, $miceRecord);

        $miceRecord->update($payload);

        return redirect()
            ->route(WorkspacePage::routeName($request, 'reports.mice-registry'))
            ->with('success', 'MICE registry entry updated successfully.');
    }

    public function destroy(Request $request, MiceRecord $miceRecord): RedirectResponse
    {
        abort_unless($this->canManage($request), 403);

        $miceRecord->delete();

        return redirect()
            ->route(WorkspacePage::routeName($request, 'reports.mice-registry'))
            ->with('success', 'MICE registry entry deleted successfully.');
    }

    public function print(Request $request): InertiaResponse
    {
        return Inertia::render(WorkspacePage::resolve($request, 'reports/mice-registry-print'), [
            ...$this->buildPayload($request),
            'workspaceRole' => WorkspaceAccess::role($request),
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $filters = $this->filters($request);
        $records = $this->filteredRecords($filters)->values();
        $summary = $this->summary($records);
        $categoryBreakdown = $this->categoryBreakdown($records);
        $venueBreakdown = $this->venueBreakdown($records);
        $originBreakdown = $this->originBreakdown($records);

        $filename = 'bccc-mice-report-' . now()->format('Y-m-d-His') . '.csv';

        return response()->streamDownload(function () use (
            $records,
            $summary,
            $categoryBreakdown,
            $venueBreakdown,
            $originBreakdown
        ) {
            $out = fopen('php://output', 'w');

            if ($out === false) {
                return;
            }

            fputcsv($out, ['BCCC MICE Registry Export']);
            fputcsv($out, ['Generated At', now()->format('Y-m-d H:i:s')]);
            fputcsv($out, []);

            fputcsv($out, ['Summary']);
            foreach ($summary as $key => $value) {
                fputcsv($out, [$key, is_numeric($value) ? (string) $value : $value]);
            }

            fputcsv($out, []);
            fputcsv($out, ['Category Breakdown']);
            fputcsv($out, ['Category', 'Records', 'Participants', 'Room Nights', 'Tourism Receipts']);
            foreach ($categoryBreakdown as $row) {
                fputcsv($out, [
                    $row['label'],
                    $row['count'],
                    $row['participants'],
                    $row['room_nights'],
                    $row['tourism_receipts'],
                ]);
            }

            fputcsv($out, []);
            fputcsv($out, ['Venue Breakdown']);
            fputcsv($out, ['Venue / Area', 'Records', 'Participants', 'Room Nights', 'Tourism Receipts']);
            foreach ($venueBreakdown as $row) {
                fputcsv($out, [
                    $row['label'],
                    $row['count'],
                    $row['participants'],
                    $row['room_nights'],
                    $row['tourism_receipts'],
                ]);
            }

            fputcsv($out, []);
            fputcsv($out, ['Origin Breakdown']);
            fputcsv($out, ['Origin', 'Records', 'Participants']);
            foreach ($originBreakdown as $row) {
                fputcsv($out, [
                    $row['label'],
                    $row['count'],
                    $row['participants'],
                ]);
            }

            fputcsv($out, []);
            fputcsv($out, [
                'Record ID',
                'Record No',
                'Year',
                'Status',
                'Booking ID',
                'Booking Summary',
                'Event Name',
                'Event Category',
                'Type of Event',
                'Venue Area',
                'Event Date From',
                'Event Date To',
                'Event Days',
                'Organization',
                'Organizer',
                'Organizer Type',
                'Contact Person',
                'Contact Number',
                'Email',
                'Address',
                'Local Male',
                'Local Female',
                'Domestic Male',
                'Domestic Female',
                'Foreign Male',
                'Foreign Female',
                'Total Participants',
                'Main Origin Country',
                'Main Origin Province',
                'Main Origin City',
                'Same-Day Visitors',
                'Overnight Visitors',
                'Estimated Room Nights',
                'Estimated Tourism Receipts',
                'Total Employees',
                'Female Employees',
                'Male Employees',
                'Permit To Engage',
                'DOT Accredited',
                'Active Member',
                'Enterprise Group',
                'BTC Group Code',
                'Submitted At',
                'Remarks',
            ]);

            foreach ($records as $row) {
                fputcsv($out, [
                    $row['id'],
                    $row['record_no'],
                    $row['year_recorded'],
                    $row['status'],
                    $row['booking_id'],
                    $row['booking_summary'],
                    $row['event_name'],
                    $row['event_category'],
                    $row['type_of_event'],
                    $row['venue_area'],
                    $row['event_date_from'],
                    $row['event_date_to'],
                    $row['event_days'],
                    $row['organization_name'],
                    $row['organizer_name'],
                    $row['organizer_type'],
                    $row['contact_person'],
                    $row['contact_number'],
                    $row['email'],
                    $row['address'],
                    $row['local_male_participants'],
                    $row['local_female_participants'],
                    $row['domestic_male_participants'],
                    $row['domestic_female_participants'],
                    $row['foreign_male_participants'],
                    $row['foreign_female_participants'],
                    $row['total_participants'],
                    $row['main_origin_country'],
                    $row['main_origin_province'],
                    $row['main_origin_city'],
                    $row['same_day_visitors'],
                    $row['overnight_visitors'],
                    $row['estimated_room_nights'],
                    $row['estimated_tourism_receipts'],
                    $row['total_employees'],
                    $row['female_employees'],
                    $row['male_employees'],
                    $row['permit_to_engage'] ? 'YES' : 'NO',
                    $row['dot_accredited'] ? 'YES' : 'NO',
                    $row['active_member'] ? 'YES' : 'NO',
                    $row['enterprise_group'],
                    $row['btc_group_code'],
                    $row['submitted_at'],
                    $row['remarks'],
                ]);
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    protected function buildPayload(Request $request): array
    {
        $filters = $this->filters($request);
        $records = $this->filteredRecords($filters);
        $rows = $records->values()->all();

        return [
            'filters' => $filters,
            'summary' => $this->summary($records),
            'category_breakdown' => $this->categoryBreakdown($records),
            'venue_breakdown' => $this->venueBreakdown($records),
            'origin_breakdown' => $this->originBreakdown($records),
            'monthly_breakdown' => $this->monthlyBreakdown($records),
            'year_options' => $this->yearOptions(),
            'category_options' => $this->categoryOptions(),
            'venue_options' => $this->venueOptions(),
            'rows' => $rows,
            'records' => $rows,
            'miceRecords' => $rows,
        ];
    }

    protected function validatedPayload(Request $request, ?MiceRecord $miceRecord = null): array
    {
        $data = $request->validate([
            'booking_id' => [
                'nullable',
                'integer',
                Rule::exists('bookings', 'id'),
            ],

            'record_no' => ['nullable', 'integer', 'min:1'],
            'year_recorded' => ['required', 'integer', 'min:2020', 'max:2100'],
            'status' => ['nullable', 'string', Rule::in(['draft', 'submitted'])],

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
        ]);

        foreach ([
            'enterprise_group',
            'btc_group_code',
            'event_name',
            'event_category',
            'type_of_event',
            'venue_area',
            'organization_name',
            'organizer_name',
            'organizer_type',
            'contact_person',
            'contact_number',
            'email',
            'address',
            'main_origin_country',
            'main_origin_province',
            'main_origin_city',
            'remarks',
        ] as $field) {
            $data[$field] = trim((string) ($data[$field] ?? ''));
        }

        $data['email'] = $data['email'] !== '' ? strtolower($data['email']) : null;
        $data['enterprise_group'] = strtoupper($data['enterprise_group'] ?: 'UNCLASSIFIED');
        $data['btc_group_code'] = strtoupper($data['btc_group_code'] ?: 'UNASSIGNED');

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

        $data['total_participants'] =
            $data['local_male_participants']
            + $data['local_female_participants']
            + $data['domestic_male_participants']
            + $data['domestic_female_participants']
            + $data['foreign_male_participants']
            + $data['foreign_female_participants'];

        $from = Carbon::parse($data['event_date_from'])->startOfDay();
        $to = Carbon::parse($data['event_date_to'])->startOfDay();

        $data['event_days'] = max(1, $from->diffInDays($to) + 1);
        $data['estimated_tourism_receipts'] = round((float) ($data['estimated_tourism_receipts'] ?? 0), 2);
        $data['permit_to_engage'] = (bool) ($data['permit_to_engage'] ?? false);
        $data['dot_accredited'] = (bool) ($data['dot_accredited'] ?? false);
        $data['active_member'] = (bool) ($data['active_member'] ?? false);

        $data['status'] = $data['status'] ?: 'submitted';
        $data['submitted_at'] = $data['status'] === 'submitted'
            ? ($miceRecord?->submitted_at ?: now())
            : null;

        if (empty($data['record_no'])) {
            $data['record_no'] = $this->nextRecordNo((int) $data['year_recorded'], $miceRecord);
        }

        if (empty($data['booking_id'])) {
            $data['booking_id'] = null;
        }

        return $data;
    }

    protected function nextRecordNo(int $year, ?MiceRecord $ignore = null): int
    {
        $query = MiceRecord::query()->where('year_recorded', $year);

        if ($ignore) {
            $query->whereKeyNot($ignore->getKey());
        }

        return ((int) $query->max('record_no')) + 1;
    }

    protected function filters(Request $request): array
    {
        return [
            'q' => trim((string) $request->string('q')->value('')),
            'year_recorded' => trim((string) $request->string('year_recorded')->value('')),
            'status' => trim((string) $request->string('status')->value('')),
            'event_category' => trim((string) $request->string('event_category')->value('')),
            'venue_area' => trim((string) $request->string('venue_area')->value('')),
            'origin' => trim((string) $request->string('origin')->value('')),
            'date_from' => trim((string) $request->string('date_from')->value('')),
            'date_to' => trim((string) $request->string('date_to')->value('')),
            'enterprise_group' => strtoupper(trim((string) $request->string('enterprise_group')->value(''))),
            'booking_linked' => trim((string) $request->string('booking_linked')->value('')),
        ];
    }

    protected function filteredRecords(array $filters): Collection
    {
        return MiceRecord::query()
            ->with([
                'booking:id,client_name,company_name,type_of_event,booking_date_from,booking_date_to,booking_status,payment_status',
            ])
            ->when($filters['q'] !== '', function (Builder $query) use ($filters) {
                $needle = '%' . $filters['q'] . '%';

                $query->where(function (Builder $nested) use ($needle) {
                    $nested
                        ->where('event_name', 'like', $needle)
                        ->orWhere('event_category', 'like', $needle)
                        ->orWhere('type_of_event', 'like', $needle)
                        ->orWhere('venue_area', 'like', $needle)
                        ->orWhere('organization_name', 'like', $needle)
                        ->orWhere('organizer_name', 'like', $needle)
                        ->orWhere('contact_person', 'like', $needle)
                        ->orWhere('email', 'like', $needle)
                        ->orWhere('main_origin_country', 'like', $needle)
                        ->orWhere('main_origin_province', 'like', $needle)
                        ->orWhere('main_origin_city', 'like', $needle)
                        ->orWhere('remarks', 'like', $needle)
                        ->orWhereHas('booking', function (Builder $booking) use ($needle) {
                            $booking
                                ->where('client_name', 'like', $needle)
                                ->orWhere('company_name', 'like', $needle)
                                ->orWhere('type_of_event', 'like', $needle);
                        });
                });
            })
            ->when($filters['year_recorded'] !== '', fn (Builder $query) => $query->where('year_recorded', (int) $filters['year_recorded']))
            ->when($filters['status'] !== '', fn (Builder $query) => $query->where('status', $filters['status']))
            ->when($filters['event_category'] !== '', fn (Builder $query) => $query->where('event_category', $filters['event_category']))
            ->when($filters['venue_area'] !== '', fn (Builder $query) => $query->where('venue_area', $filters['venue_area']))
            ->when($filters['enterprise_group'] !== '', fn (Builder $query) => $query->where('enterprise_group', $filters['enterprise_group']))
            ->when($filters['origin'] !== '', function (Builder $query) use ($filters) {
                $needle = '%' . $filters['origin'] . '%';

                $query->where(function (Builder $nested) use ($needle) {
                    $nested
                        ->where('main_origin_country', 'like', $needle)
                        ->orWhere('main_origin_province', 'like', $needle)
                        ->orWhere('main_origin_city', 'like', $needle);
                });
            })
            ->when($filters['date_from'] !== '', fn (Builder $query) => $query->whereDate('event_date_from', '>=', $filters['date_from']))
            ->when($filters['date_to'] !== '', fn (Builder $query) => $query->whereDate('event_date_to', '<=', $filters['date_to']))
            ->when($filters['booking_linked'] === 'yes', fn (Builder $query) => $query->whereNotNull('booking_id'))
            ->when($filters['booking_linked'] === 'no', fn (Builder $query) => $query->whereNull('booking_id'))
            ->orderByRaw('COALESCE(year_recorded, 0) desc')
            ->orderByRaw('COALESCE(record_no, 999999) asc')
            ->latest('submitted_at')
            ->get()
            ->map(fn (MiceRecord $record) => $this->serializeRecord($record))
            ->values();
    }

    protected function summary(Collection $records): array
    {
        return [
            'total_records' => $records->count(),
            'submitted_records' => $records->where('status', 'submitted')->count(),
            'draft_records' => $records->where('status', 'draft')->count(),
            'booking_linked_records' => $records->filter(fn (array $row) => ! empty($row['booking_id']))->count(),

            'total_participants' => (int) $records->sum('total_participants'),
            'local_participants' => (int) $records->sum('local_participants'),
            'domestic_participants' => (int) $records->sum('domestic_participants'),
            'foreign_participants' => (int) $records->sum('foreign_participants'),

            'same_day_visitors' => (int) $records->sum('same_day_visitors'),
            'overnight_visitors' => (int) $records->sum('overnight_visitors'),
            'estimated_room_nights' => (int) $records->sum('estimated_room_nights'),
            'estimated_tourism_receipts' => round((float) $records->sum('estimated_tourism_receipts'), 2),

            'total_employees' => (int) $records->sum('total_employees'),
            'female_employees' => (int) $records->sum('female_employees'),
            'male_employees' => (int) $records->sum('male_employees'),

            'permit_to_engage_count' => $records->where('permit_to_engage', true)->count(),
            'dot_accredited_count' => $records->where('dot_accredited', true)->count(),
            'active_member_count' => $records->where('active_member', true)->count(),
        ];
    }

    protected function categoryBreakdown(Collection $records): array
    {
        return $this->breakdownRows($records, 'event_category');
    }

    protected function venueBreakdown(Collection $records): array
    {
        return $this->breakdownRows($records, 'venue_area');
    }

    protected function originBreakdown(Collection $records): array
    {
        return $records
            ->groupBy(function (array $row) {
                return trim(implode(', ', array_filter([
                    $row['main_origin_city'] ?? null,
                    $row['main_origin_province'] ?? null,
                    $row['main_origin_country'] ?? null,
                ]))) ?: 'Unspecified';
            })
            ->map(fn (Collection $group, string $label) => [
                'label' => $label,
                'count' => $group->count(),
                'participants' => (int) $group->sum('total_participants'),
            ])
            ->sortByDesc('participants')
            ->values()
            ->all();
    }

    protected function monthlyBreakdown(Collection $records): array
    {
        return $records
            ->groupBy(fn (array $row) => $row['event_month'] ?: 'Unscheduled')
            ->map(fn (Collection $group, string $label) => [
                'label' => $label,
                'count' => $group->count(),
                'participants' => (int) $group->sum('total_participants'),
                'room_nights' => (int) $group->sum('estimated_room_nights'),
                'tourism_receipts' => round((float) $group->sum('estimated_tourism_receipts'), 2),
            ])
            ->values()
            ->all();
    }

    protected function breakdownRows(Collection $records, string $field): array
    {
        return $records
            ->groupBy(function (array $row) use ($field) {
                $value = trim((string) ($row[$field] ?? ''));

                return $value !== '' ? $value : 'Unspecified';
            })
            ->map(fn (Collection $group, string $label) => [
                'label' => $label,
                'count' => $group->count(),
                'participants' => (int) $group->sum('total_participants'),
                'room_nights' => (int) $group->sum('estimated_room_nights'),
                'tourism_receipts' => round((float) $group->sum('estimated_tourism_receipts'), 2),
            ])
            ->sortByDesc('participants')
            ->values()
            ->all();
    }

    protected function yearOptions(): array
    {
        return MiceRecord::query()
            ->whereNotNull('year_recorded')
            ->distinct()
            ->orderByDesc('year_recorded')
            ->pluck('year_recorded')
            ->map(fn ($year) => (int) $year)
            ->values()
            ->all();
    }

    protected function categoryOptions(): array
    {
        return MiceRecord::query()
            ->whereNotNull('event_category')
            ->where('event_category', '!=', '')
            ->distinct()
            ->orderBy('event_category')
            ->pluck('event_category')
            ->values()
            ->all();
    }

    protected function venueOptions(): array
    {
        return MiceRecord::query()
            ->whereNotNull('venue_area')
            ->where('venue_area', '!=', '')
            ->distinct()
            ->orderBy('venue_area')
            ->pluck('venue_area')
            ->values()
            ->all();
    }

    protected function bookingOptions(): array
    {
        return Booking::query()
            ->select(['id', 'client_name', 'company_name', 'type_of_event', 'booking_date_from', 'booking_date_to'])
            ->latest('id')
            ->limit(250)
            ->get()
            ->map(function (Booking $booking) {
                $dateFrom = $booking->booking_date_from
                    ? date('Y-m-d', strtotime((string) $booking->booking_date_from))
                    : null;

                $dateTo = $booking->booking_date_to
                    ? date('Y-m-d', strtotime((string) $booking->booking_date_to))
                    : null;

                return [
                    'id' => (int) $booking->id,
                    'label' => trim(implode(' • ', array_filter([
                        'BKG-' . str_pad((string) $booking->id, 5, '0', STR_PAD_LEFT),
                        $booking->client_name,
                        $booking->company_name,
                        $booking->type_of_event,
                        $dateFrom && $dateTo ? $dateFrom . ' to ' . $dateTo : null,
                    ]))),
                ];
            })
            ->values()
            ->all();
    }

    protected function formMeta(): array
    {
        return [
            'event_categories' => [
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
            'organizer_types' => [
                'Private',
                'Government',
                'NGO',
                'Academe',
                'Religious',
                'Corporate',
                'Association',
                'Other',
            ],
            'enterprise_groups' => [
                'PTE',
                'STE',
                'UNCLASSIFIED',
            ],
            'year_options' => $this->yearOptions(),
        ];
    }

    protected function serializeRecord(MiceRecord $record): array
    {
        $record->loadMissing('booking');

        $localParticipants = (int) ($record->local_male_participants ?? 0)
            + (int) ($record->local_female_participants ?? 0);

        $domesticParticipants = (int) ($record->domestic_male_participants ?? 0)
            + (int) ($record->domestic_female_participants ?? 0);

        $foreignParticipants = (int) ($record->foreign_male_participants ?? 0)
            + (int) ($record->foreign_female_participants ?? 0);

        $totalParticipants = (int) ($record->total_participants ?? 0);

        if ($totalParticipants <= 0) {
            $totalParticipants = $localParticipants + $domesticParticipants + $foreignParticipants;
        }

        $eventMonth = null;

        if ($record->event_date_from) {
            $eventMonth = Carbon::parse($record->event_date_from)->format('Y-m');
        }

        return [
            'id' => (int) $record->id,
            'booking_id' => $record->booking_id,
            'booking_summary' => $record->booking
                ? trim(implode(' • ', array_filter([
                    'BKG-' . str_pad((string) $record->booking->id, 5, '0', STR_PAD_LEFT),
                    $record->booking->client_name,
                    $record->booking->company_name,
                    $record->booking->type_of_event,
                ])))
                : '',

            'booking_status' => $record->booking?->booking_status,
            'booking_payment_status' => $record->booking?->payment_status,

            'record_no' => $record->record_no,
            'year_recorded' => $record->year_recorded,
            'status' => $record->status ?: 'draft',

            'enterprise_group' => strtoupper((string) ($record->enterprise_group ?? 'UNCLASSIFIED')),
            'btc_group_code' => strtoupper((string) ($record->btc_group_code ?? 'UNASSIGNED')),

            'event_name' => (string) ($record->event_name ?? ''),
            'event_category' => (string) ($record->event_category ?? ''),
            'type_of_event' => (string) ($record->type_of_event ?? ''),
            'venue_area' => (string) ($record->venue_area ?? ''),

            'event_date_from' => optional($record->event_date_from)->toDateString(),
            'event_date_to' => optional($record->event_date_to)->toDateString(),
            'event_days' => (int) ($record->event_days ?? 0),
            'event_month' => $eventMonth,

            'organization_name' => (string) ($record->organization_name ?? ''),
            'organizer_name' => (string) ($record->organizer_name ?? ''),
            'organizer_type' => (string) ($record->organizer_type ?? ''),
            'contact_person' => (string) ($record->contact_person ?? ''),
            'contact_number' => (string) ($record->contact_number ?? ''),
            'email' => (string) ($record->email ?? ''),
            'address' => (string) ($record->address ?? ''),

            'local_male_participants' => (int) ($record->local_male_participants ?? 0),
            'local_female_participants' => (int) ($record->local_female_participants ?? 0),
            'domestic_male_participants' => (int) ($record->domestic_male_participants ?? 0),
            'domestic_female_participants' => (int) ($record->domestic_female_participants ?? 0),
            'foreign_male_participants' => (int) ($record->foreign_male_participants ?? 0),
            'foreign_female_participants' => (int) ($record->foreign_female_participants ?? 0),

            'local_participants' => $localParticipants,
            'domestic_participants' => $domesticParticipants,
            'foreign_participants' => $foreignParticipants,
            'total_participants' => $totalParticipants,

            'main_origin_country' => (string) ($record->main_origin_country ?? ''),
            'main_origin_province' => (string) ($record->main_origin_province ?? ''),
            'main_origin_city' => (string) ($record->main_origin_city ?? ''),

            'same_day_visitors' => (int) ($record->same_day_visitors ?? 0),
            'overnight_visitors' => (int) ($record->overnight_visitors ?? 0),
            'estimated_room_nights' => (int) ($record->estimated_room_nights ?? 0),
            'estimated_tourism_receipts' => (float) ($record->estimated_tourism_receipts ?? 0),

            'total_employees' => (int) ($record->total_employees ?? 0),
            'female_employees' => (int) ($record->female_employees ?? 0),
            'male_employees' => (int) ($record->male_employees ?? 0),

            'permit_to_engage' => (bool) $record->permit_to_engage,
            'dot_accredited' => (bool) $record->dot_accredited,
            'active_member' => (bool) $record->active_member,

            'remarks' => (string) ($record->remarks ?? ''),
            'submitted_at' => optional($record->submitted_at)->toIso8601String(),
            'created_at' => optional($record->created_at)->toIso8601String(),
            'updated_at' => optional($record->updated_at)->toIso8601String(),
        ];
    }

    protected function canManage(Request $request): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['admin', 'manager'])) {
            return true;
        }

        if (method_exists($user, 'hasRole')) {
            return $user->hasRole('admin') || $user->hasRole('manager');
        }

        $role = (string) ($user->role_name ?? $user->role ?? '');

        return in_array($role, ['admin', 'manager'], true);
    }
}
