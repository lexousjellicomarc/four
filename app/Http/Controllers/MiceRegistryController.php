<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\MiceRecord;
use App\Support\WorkspacePage;
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
                'workspaceRole' => WorkspacePage::role($request),
            ])
        );
    }

    public function create(Request $request): InertiaResponse
    {
        $prefillBookingId = $request->integer('booking_id') ?: null;

        return Inertia::render(WorkspacePage::resolve($request, 'reports/mice-registry-form'), [
            'workspaceRole' => WorkspacePage::role($request),
            'mode' => 'create',
            'record' => null,
            'booking_options' => $this->bookingOptions(),
            'prefill_booking_id' => $prefillBookingId,
            'form_meta' => $this->formMeta(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $payload = $this->validatedPayload($request);

        MiceRecord::query()->create($payload);

        return redirect()
            ->route(WorkspacePage::routeName($request, 'reports.mice-registry'))
            ->with('success', 'MICE registry entry created successfully.');
    }

    public function edit(Request $request, MiceRecord $miceRecord): InertiaResponse
    {
        return Inertia::render(WorkspacePage::resolve($request, 'reports/mice-registry-form'), [
            'workspaceRole' => WorkspacePage::role($request),
            'mode' => 'edit',
            'record' => $this->serializeRecord($miceRecord->loadMissing('booking')),
            'booking_options' => $this->bookingOptions(),
            'prefill_booking_id' => $miceRecord->booking_id,
            'form_meta' => $this->formMeta(),
        ]);
    }

    public function update(Request $request, MiceRecord $miceRecord): RedirectResponse
    {
        $payload = $this->validatedPayload($request, $miceRecord);

        $miceRecord->update($payload);

        return redirect()
            ->route(WorkspacePage::routeName($request, 'reports.mice-registry'))
            ->with('success', 'MICE registry entry updated successfully.');
    }

    public function destroy(Request $request, MiceRecord $miceRecord): RedirectResponse
    {
        $miceRecord->delete();

        return redirect()
            ->route(WorkspacePage::routeName($request, 'reports.mice-registry'))
            ->with('success', 'MICE registry entry deleted successfully.');
    }

    public function print(Request $request): InertiaResponse
    {
        return Inertia::render(WorkspacePage::resolve($request, 'reports/mice-registry-print'), [
            ...$this->buildPayload($request),
            'workspaceRole' => WorkspacePage::role($request),
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $filters = $this->filters($request);
        $rows = $this->filteredRows($filters);
        $summary = $this->summary($rows);
        $enterpriseBreakdown = $this->enterpriseBreakdown($rows);
        $groupBreakdown = $this->groupBreakdown($rows);

        $filename = 'mice-registry-' . now()->format('Y-m-d-His') . '.csv';

        return response()->streamDownload(function () use ($rows, $summary, $enterpriseBreakdown, $groupBreakdown) {
            $out = fopen('php://output', 'w');

            if ($out === false) {
                return;
            }

            fputcsv($out, ['MICE Registry Export']);
            fputcsv($out, []);

            fputcsv($out, ['Summary']);
            foreach ($summary as $key => $value) {
                fputcsv($out, [$key, is_numeric($value) ? (string) $value : $value]);
            }

            fputcsv($out, []);
            fputcsv($out, ['Enterprise Breakdown']);
            fputcsv($out, ['Group', 'Records', 'Permit To Engage', 'DOT Accredited', 'Active Members']);

            foreach ($enterpriseBreakdown as $row) {
                fputcsv($out, [
                    $row['label'],
                    $row['count'],
                    $row['permit_to_engage_count'],
                    $row['dot_accredited_count'],
                    $row['active_member_count'],
                ]);
            }

            fputcsv($out, []);
            fputcsv($out, ['BTC Group Breakdown']);
            fputcsv($out, ['Code', 'Records', 'Permit To Engage', 'DOT Accredited', 'Active Members']);

            foreach ($groupBreakdown as $row) {
                fputcsv($out, [
                    $row['label'],
                    $row['count'],
                    $row['permit_to_engage_count'],
                    $row['dot_accredited_count'],
                    $row['active_member_count'],
                ]);
            }

            fputcsv($out, []);
            fputcsv($out, [
                'ID',
                'BTC',
                'No',
                'Establishment',
                'Type',
                'Seats_Unit',
                'Total_Employees',
                'Yr',
                'Region',
                'Province_HUC',
                'City_Mun',
                'Mth_added',
                'Female_Emp',
                'Male_Emp',
                'Classification',
                'Enterprise_Group',
                'Permit_to_Engage',
                'DOT_Accredited',
                'Active_Member',
                'Booking_ID',
                'Booking_Summary',
                'Remarks',
                'Created_At',
            ]);

            foreach ($rows as $row) {
                fputcsv($out, [
                    $row['id'],
                    $row['btc_group_code'],
                    $row['record_no'],
                    $row['establishment_name'],
                    $row['business_type'],
                    $row['seats_unit'],
                    $row['total_employees'],
                    $row['year_recorded'],
                    $row['region'],
                    $row['province_huc'],
                    $row['city_municipality'],
                    $row['month_added'],
                    $row['female_employees'],
                    $row['male_employees'],
                    $row['classification'],
                    $row['enterprise_group'],
                    $row['permit_to_engage'] ? 'YES' : 'NO',
                    $row['dot_accredited'] ? 'YES' : 'NO',
                    $row['active_member'] ? 'YES' : 'NO',
                    $row['booking_id'],
                    $row['booking_summary'],
                    $row['remarks'],
                    $row['created_at'],
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
        $rows = $this->filteredRows($filters);
        $rowArray = $rows->values()->all();

        return [
            'filters' => $filters,
            'summary' => $this->summary($rows),
            'enterprise_breakdown' => $this->enterpriseBreakdown($rows),
            'group_breakdown' => $this->groupBreakdown($rows),
            'year_options' => $this->yearOptions(),
            'rows' => $rowArray,
            'records' => $rowArray,
            'miceRecords' => $rowArray,
            'can_manage' => $request->user()?->hasAnyRole(['admin', 'manager']) ?? false,
        ];
    }

    protected function validatedPayload(Request $request, ?MiceRecord $miceRecord = null): array
    {
        $data = $request->validate([
            'booking_id' => ['nullable', 'integer', Rule::exists('bookings', 'id')],
            'btc_group_code' => ['required', 'string', 'max:30'],
            'record_no' => ['nullable', 'integer', 'min:1'],
            'establishment_name' => ['required', 'string', 'max:255'],
            'business_type' => ['nullable', 'string'],
            'seats_unit' => ['nullable', 'string', 'max:120'],
            'total_employees' => ['nullable', 'integer', 'min:0'],
            'year_recorded' => ['nullable', 'integer', 'between:2000,2100'],
            'region' => ['nullable', 'string', 'max:120'],
            'province_huc' => ['nullable', 'string', 'max:120'],
            'city_municipality' => ['nullable', 'string', 'max:120'],
            'month_added' => ['nullable', 'string', 'max:40'],
            'female_employees' => ['nullable', 'integer', 'min:0'],
            'male_employees' => ['nullable', 'integer', 'min:0'],
            'classification' => ['nullable', 'string', 'max:160'],
            'enterprise_group' => ['required', Rule::in(['PTE', 'STE', 'UNCLASSIFIED'])],
            'permit_to_engage' => ['nullable', 'boolean'],
            'dot_accredited' => ['nullable', 'boolean'],
            'active_member' => ['nullable', 'boolean'],
            'remarks' => ['nullable', 'string'],
        ]);

        $female = (int) ($data['female_employees'] ?? 0);
        $male = (int) ($data['male_employees'] ?? 0);
        $computedEmployees = $female + $male;
        $providedEmployees = array_key_exists('total_employees', $data)
            ? (int) ($data['total_employees'] ?? 0)
            : 0;

        $data['btc_group_code'] = strtoupper(trim((string) $data['btc_group_code']));
        $data['establishment_name'] = trim((string) $data['establishment_name']);
        $data['business_type'] = trim((string) ($data['business_type'] ?? ''));
        $data['seats_unit'] = trim((string) ($data['seats_unit'] ?? ''));
        $data['region'] = trim((string) ($data['region'] ?? ''));
        $data['province_huc'] = trim((string) ($data['province_huc'] ?? ''));
        $data['city_municipality'] = trim((string) ($data['city_municipality'] ?? ''));
        $data['month_added'] = trim((string) ($data['month_added'] ?? ''));
        $data['classification'] = trim((string) ($data['classification'] ?? ''));
        $data['enterprise_group'] = strtoupper(trim((string) ($data['enterprise_group'] ?? 'UNCLASSIFIED')));
        $data['remarks'] = trim((string) ($data['remarks'] ?? ''));
        $data['permit_to_engage'] = (bool) ($data['permit_to_engage'] ?? false);
        $data['dot_accredited'] = (bool) ($data['dot_accredited'] ?? false);
        $data['active_member'] = (bool) ($data['active_member'] ?? false);
        $data['female_employees'] = $female;
        $data['male_employees'] = $male;
        $data['total_employees'] = max($providedEmployees, $computedEmployees);

        if (! isset($data['record_no']) || $data['record_no'] === null || (int) $data['record_no'] <= 0) {
            $data['record_no'] = $this->nextRecordNo($data['btc_group_code'], $miceRecord);
        }

        if (($data['booking_id'] ?? null) === null || (int) ($data['booking_id'] ?? 0) === 0) {
            $data['booking_id'] = null;
        }

        return $data;
    }

    protected function nextRecordNo(string $groupCode, ?MiceRecord $ignore = null): int
    {
        $query = MiceRecord::query()->where('btc_group_code', $groupCode);

        if ($ignore) {
            $query->whereKeyNot($ignore->getKey());
        }

        return ((int) $query->max('record_no')) + 1;
    }

    protected function filters(Request $request): array
    {
        return [
            'q' => trim((string) $request->string('q')),
            'year_recorded' => trim((string) $request->string('year_recorded')),
            'enterprise_group' => trim((string) $request->string('enterprise_group')),
            'btc_group_code' => strtoupper(trim((string) $request->string('btc_group_code'))),
            'classification' => trim((string) $request->string('classification')),
            'city_municipality' => trim((string) $request->string('city_municipality')),
            'active_member' => trim((string) $request->string('active_member')),
            'dot_accredited' => trim((string) $request->string('dot_accredited')),
        ];
    }

    protected function filteredRows(array $filters): Collection
    {
        return MiceRecord::query()
            ->with('booking:id,client_name,company_name,type_of_event,booking_date_from,booking_date_to')
            ->when($filters['q'] !== '', function ($query) use ($filters) {
                $needle = '%' . $filters['q'] . '%';

                $query->where(function ($nested) use ($needle) {
                    $nested->where('establishment_name', 'like', $needle)
                        ->orWhere('business_type', 'like', $needle)
                        ->orWhere('province_huc', 'like', $needle)
                        ->orWhere('city_municipality', 'like', $needle)
                        ->orWhere('classification', 'like', $needle)
                        ->orWhere('remarks', 'like', $needle)
                        ->orWhereHas('booking', function ($bookingQuery) use ($needle) {
                            $bookingQuery->where('client_name', 'like', $needle)
                                ->orWhere('company_name', 'like', $needle)
                                ->orWhere('type_of_event', 'like', $needle);
                        });
                });
            })
            ->when($filters['year_recorded'] !== '', fn ($query) => $query->where('year_recorded', (int) $filters['year_recorded']))
            ->when($filters['enterprise_group'] !== '', fn ($query) => $query->where('enterprise_group', $filters['enterprise_group']))
            ->when($filters['btc_group_code'] !== '', fn ($query) => $query->where('btc_group_code', $filters['btc_group_code']))
            ->when($filters['classification'] !== '', fn ($query) => $query->where('classification', 'like', '%' . $filters['classification'] . '%'))
            ->when($filters['city_municipality'] !== '', fn ($query) => $query->where('city_municipality', 'like', '%' . $filters['city_municipality'] . '%'))
            ->when($filters['active_member'] !== '', fn ($query) => $query->where('active_member', $filters['active_member'] === '1'))
            ->when($filters['dot_accredited'] !== '', fn ($query) => $query->where('dot_accredited', $filters['dot_accredited'] === '1'))
            ->orderByRaw('COALESCE(year_recorded, 0) desc')
            ->orderBy('btc_group_code')
            ->orderByRaw('COALESCE(record_no, 999999) asc')
            ->get()
            ->map(fn (MiceRecord $record) => $this->serializeRecord($record))
            ->values();
    }

    protected function summary(Collection $rows): array
    {
        return [
            'total_records' => $rows->count(),
            'total_permit_to_engage' => $rows->where('permit_to_engage', true)->count(),
            'total_dot_accredited' => $rows->where('dot_accredited', true)->count(),
            'total_active_members' => $rows->where('active_member', true)->count(),
            'total_employees' => (int) $rows->sum('total_employees'),
            'total_female_employees' => (int) $rows->sum('female_employees'),
            'total_male_employees' => (int) $rows->sum('male_employees'),
            'pte_records' => $rows->where('enterprise_group', 'PTE')->count(),
            'ste_records' => $rows->where('enterprise_group', 'STE')->count(),
        ];
    }

    protected function enterpriseBreakdown(Collection $rows): array
    {
        return $this->breakdownRows($rows, 'enterprise_group');
    }

    protected function groupBreakdown(Collection $rows): array
    {
        return $this->breakdownRows($rows, 'btc_group_code');
    }

    protected function breakdownRows(Collection $rows, string $field): array
    {
        return $rows
            ->groupBy(function (array $row) use ($field) {
                $value = strtoupper(trim((string) ($row[$field] ?? '')));

                return $value !== ''
                    ? $value
                    : ($field === 'enterprise_group' ? 'UNCLASSIFIED' : 'UNASSIGNED');
            })
            ->map(fn (Collection $group, string $label) => [
                'label' => $label,
                'count' => $group->count(),
                'permit_to_engage_count' => $group->where('permit_to_engage', true)->count(),
                'dot_accredited_count' => $group->where('dot_accredited', true)->count(),
                'active_member_count' => $group->where('active_member', true)->count(),
            ])
            ->sortBy('label')
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
            'enterprise_groups' => ['PTE', 'STE', 'UNCLASSIFIED'],
            'btc_group_codes' => ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9'],
            'month_options' => [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
            ],
            'year_options' => $this->yearOptions(),
        ];
    }

    protected function serializeRecord(MiceRecord $record): array
    {
        $record->loadMissing('booking');

        return [
            'id' => (int) $record->id,
            'booking_id' => $record->booking_id,
            'btc_group_code' => (string) ($record->btc_group_code ?? ''),
            'record_no' => $record->record_no,
            'establishment_name' => (string) ($record->establishment_name ?? ''),
            'business_type' => (string) ($record->business_type ?? ''),
            'seats_unit' => (string) ($record->seats_unit ?? ''),
            'total_employees' => (int) ($record->total_employees ?? 0),
            'year_recorded' => $record->year_recorded,
            'region' => (string) ($record->region ?? ''),
            'province_huc' => (string) ($record->province_huc ?? ''),
            'city_municipality' => (string) ($record->city_municipality ?? ''),
            'month_added' => (string) ($record->month_added ?? ''),
            'female_employees' => (int) ($record->female_employees ?? 0),
            'male_employees' => (int) ($record->male_employees ?? 0),
            'classification' => (string) ($record->classification ?? ''),
            'enterprise_group' => strtoupper((string) ($record->enterprise_group ?? '')),
            'permit_to_engage' => (bool) $record->permit_to_engage,
            'dot_accredited' => (bool) $record->dot_accredited,
            'active_member' => (bool) $record->active_member,
            'remarks' => (string) ($record->remarks ?? ''),
            'created_at' => optional($record->created_at)->toIso8601String(),
            'booking_summary' => $record->booking
                ? trim(implode(' • ', array_filter([
                    'BKG-' . str_pad((string) $record->booking->id, 5, '0', STR_PAD_LEFT),
                    $record->booking->client_name,
                    $record->booking->company_name,
                    $record->booking->type_of_event,
                ])))
                : '',
        ];
    }
}
