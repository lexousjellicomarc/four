<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkCalendarBlockRequest;
use App\Http\Requests\StoreCalendarBlockRequest;
use App\Models\CalendarBlock;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class CalendarBlockController extends Controller
{
    public function store(StoreCalendarBlockRequest $request): JsonResponse
    {
        $payload = $this->payload($request);
        $payload['created_by_user_id'] = $request->user()?->id;

        $calendarBlock = CalendarBlock::query()->create($payload);

        return response()->json([
            'message' => 'Calendar block created successfully.',
            'item' => $this->row($calendarBlock->fresh()),
        ]);
    }

    public function bulkStore(BulkCalendarBlockRequest $request): JsonResponse
    {
        $payload = $this->bulkPayload($request);
        $payload['created_by_user_id'] = $request->user()?->id;

        $excludeDates = collect((array) $request->input('exclude_dates', []))
            ->filter()
            ->map(fn ($date) => Carbon::parse($date)->toDateString())
            ->values()
            ->all();

        $start = Carbon::parse($request->input('date_from'))->startOfDay();
        $end = Carbon::parse($request->input('date_to'))->startOfDay();
        $explodeByDay = (bool) $request->boolean('explode_by_day');
        $excludeWeekends = (bool) $request->boolean('exclude_weekends');

        $created = collect();

        if (! $explodeByDay) {
            $calendarBlock = CalendarBlock::query()->create([
                ...$payload,
                'date_from' => $start->toDateString(),
                'date_to' => $end->toDateString(),
            ]);

            $created->push($calendarBlock);
        } else {
            for ($day = $start->copy(); $day->lte($end); $day->addDay()) {
                if ($excludeWeekends && in_array((int) $day->dayOfWeekIso, [6, 7], true)) {
                    continue;
                }

                if (in_array($day->toDateString(), $excludeDates, true)) {
                    continue;
                }

                $created->push(CalendarBlock::query()->create([
                    ...$payload,
                    'date_from' => $day->toDateString(),
                    'date_to' => $day->toDateString(),
                ]));
            }
        }

        return response()->json([
            'message' => $created->count() === 1
                ? 'Bulk calendar action created 1 block.'
                : 'Bulk calendar action created ' . $created->count() . ' blocks.',
            'created_count' => $created->count(),
            'items' => $created->take(30)->map(fn (CalendarBlock $block) => $this->row($block))->values(),
        ]);
    }

    public function update(StoreCalendarBlockRequest $request, CalendarBlock $calendarBlock): JsonResponse
    {
        $calendarBlock->update($this->payload($request));

        return response()->json([
            'message' => 'Calendar block updated successfully.',
            'item' => $this->row($calendarBlock->fresh()),
        ]);
    }

    public function destroy(StoreCalendarBlockRequest $request, CalendarBlock $calendarBlock): JsonResponse
    {
        $id = $calendarBlock->id;
        $calendarBlock->delete();

        return response()->json([
            'message' => 'Calendar block deleted successfully.',
            'id' => $id,
        ]);
    }

    protected function payload(StoreCalendarBlockRequest $request): array
    {
        return [
            'title' => trim($request->string('title')->toString()),
            'area' => $request->filled('area') ? trim($request->string('area')->toString()) : null,
            'notes' => $request->filled('notes') ? trim($request->string('notes')->toString()) : null,
            'block' => strtoupper($request->string('block')->toString()),
            'public_status' => strtolower($request->string('public_status')->toString()),
            'date_from' => $request->date('date_from')?->toDateString(),
            'date_to' => $request->date('date_to')?->toDateString(),
        ];
    }

    protected function bulkPayload(BulkCalendarBlockRequest $request): array
    {
        return [
            'title' => trim($request->string('title')->toString()),
            'area' => $request->filled('area') ? trim($request->string('area')->toString()) : null,
            'notes' => $request->filled('notes') ? trim($request->string('notes')->toString()) : null,
            'block' => strtoupper($request->string('block')->toString()),
            'public_status' => strtolower($request->string('public_status')->toString()),
        ];
    }

    protected function row(CalendarBlock $calendarBlock): array
    {
        $dateFrom = optional($calendarBlock->date_from)->format('Y-m-d') ?? (string) $calendarBlock->date_from;
        $dateTo = optional($calendarBlock->date_to)->format('Y-m-d') ?? (string) $calendarBlock->date_to;

        return [
            'id' => $calendarBlock->id,
            'title' => $calendarBlock->title,
            'area' => $calendarBlock->area ?? '',
            'block' => strtoupper((string) $calendarBlock->block),
            'blockLabel' => $this->blockLabel((string) $calendarBlock->block),
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'note' => $calendarBlock->notes ?? '',
            'statusColor' => strtolower((string) ($calendarBlock->public_status ?? 'red')),
            'statusLabel' => $this->statusLabel((string) ($calendarBlock->public_status ?? 'red')),
            'spansMultipleDays' => $dateFrom !== '' && $dateTo !== '' && $dateFrom !== $dateTo,
        ];
    }

    protected function blockLabel(string $block): string
    {
        return match (strtoupper($block)) {
            'AM' => 'AM (6:00 AM - 12:00 PM)',
            'PM' => 'PM (12:00 PM - 6:00 PM)',
            'EVE' => 'EVE (6:00 PM - 11:59 PM)',
            default => 'Whole day',
        };
    }

    protected function statusLabel(string $publicStatus): string
    {
        return match (strtolower($publicStatus)) {
            'blue' => 'Public / visible event',
            'gold' => 'Private / reserved',
            default => 'Blocked / unavailable',
        };
    }
}
