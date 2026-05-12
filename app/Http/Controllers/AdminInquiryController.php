<?php

namespace App\Http\Controllers;

use App\Models\PublicInquiry;
use App\Support\WorkspacePage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class AdminInquiryController extends Controller
{
    public function index(Request $request): Response
    {
        $query = PublicInquiry::query()
            ->latest();

        if ($request->filled('q')) {
            $search = trim((string) $request->input('q'));

            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");

                if (Schema::hasColumn('public_inquiries', 'inquiry_type')) {
                    $builder->orWhere('inquiry_type', 'like', "%{$search}%");
                }

                if (Schema::hasColumn('public_inquiries', 'venue')) {
                    $builder->orWhere('venue', 'like', "%{$search}%");
                }
            });
        }

        if ($request->filled('status') && Schema::hasColumn('public_inquiries', 'status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $inquiries = $query
            ->paginate(12)
            ->withQueryString()
            ->through(fn (PublicInquiry $inquiry): array => $this->serializeInquiry($inquiry));

        return Inertia::render(WorkspacePage::resolve($request, 'admin/inquiries/index'), [
            'workspaceRole' => $this->workspaceRole($request),
            'inquiries' => $inquiries,
            'filters' => [
                'q' => $request->input('q', ''),
                'status' => $request->input('status', ''),
            ],
            'notificationSummary' => $this->notificationSummary(),
        ]);
    }

    public function update(Request $request, PublicInquiry $inquiry): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:new,read,replied,closed'],
        ]);

        $data = [
            'status' => $validated['status'],
        ];

        if ($validated['status'] !== 'new' && Schema::hasColumn('public_inquiries', 'read_at') && blank($inquiry->read_at)) {
            $data['read_at'] = now();
        }

        $inquiry->forceFill($data)->save();

        return back()->with('success', 'Inquiry status updated.');
    }

    public function destroy(Request $request, PublicInquiry $inquiry): RedirectResponse
    {
        $inquiry->delete();

        return back()->with('success', 'Inquiry deleted.');
    }

    private function serializeInquiry(PublicInquiry $inquiry): array
    {
        return [
            'id' => $inquiry->id,
            'name' => $inquiry->name,
            'email' => $inquiry->email,
            'phone' => $inquiry->phone,
            'subject' => $inquiry->subject,
            'message' => $inquiry->message,
            'status' => $inquiry->status ?? 'new',
            'read_at' => optional($inquiry->read_at)->toDateTimeString(),
            'created_at' => optional($inquiry->created_at)->toDateTimeString(),

            'inquiry_type' => $this->safeAttribute($inquiry, 'inquiry_type'),
            'event_date' => $this->safeAttribute($inquiry, 'event_date'),
            'venue' => $this->safeAttribute($inquiry, 'venue'),
            'guest_count' => $this->safeAttribute($inquiry, 'guest_count'),
        ];
    }

    private function safeAttribute(PublicInquiry $inquiry, string $key): mixed
    {
        return array_key_exists($key, $inquiry->getAttributes()) ? $inquiry->{$key} : null;
    }

    private function workspaceRole(Request $request): string
    {
        $path = $request->path();

        if (str_starts_with($path, 'manager/')) {
            return 'manager';
        }

        if (str_starts_with($path, 'staff/')) {
            return 'staff';
        }

        return 'admin';
    }

    private function notificationSummary(): array
    {
        $newInquiryCount = 0;

        if (Schema::hasTable('public_inquiries')) {
            $newInquiryCount = PublicInquiry::query()
                ->when(
                    Schema::hasColumn('public_inquiries', 'status'),
                    fn ($query) => $query->where(function ($builder): void {
                        $builder
                            ->whereNull('status')
                            ->orWhere('status', 'new');
                    }),
                    fn ($query) => $query
                )
                ->count();
        }

        return [
            'newInquiries' => $newInquiryCount,
            'totalUnread' => $newInquiryCount,
        ];
    }
}
