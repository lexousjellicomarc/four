<?php

namespace App\Http\Controllers;

use App\Models\Inquiry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminInquiryController extends Controller
{
    public function index(): Response
    {
        $inquiries = Inquiry::query()
            ->latest()
            ->paginate(20)
            ->through(fn (Inquiry $inquiry) => [
                'id' => $inquiry->id,
                'name' => $inquiry->name,
                'email' => $inquiry->email,
                'phone' => $inquiry->phone,
                'subject' => $inquiry->subject,
                'inquiry_type' => $inquiry->inquiry_type,
                'event_date' => optional($inquiry->event_date)->format('Y-m-d'),
                'venue' => $inquiry->venue,
                'guest_count' => $inquiry->guest_count,
                'message' => $inquiry->message,
                'status' => $inquiry->status,
                'read_at' => optional($inquiry->read_at)->toDateTimeString(),
                'created_at' => optional($inquiry->created_at)->toDateTimeString(),
            ]);

        return Inertia::render('admin/inquiries/index', [
            'inquiries' => $inquiries,
        ]);
    }

    public function update(Request $request, Inquiry $inquiry): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:new,read,replied,closed'],
        ]);

        $payload = [
            'status' => $data['status'],
        ];

        if ($data['status'] !== 'new' && $inquiry->read_at === null) {
            $payload['read_at'] = now();
            $payload['handled_by_user_id'] = $request->user()?->id;
        }

        $inquiry->update($payload);

        return back()->with('success', 'Inquiry updated successfully.');
    }

    public function destroy(Inquiry $inquiry): RedirectResponse
    {
        $inquiry->delete();

        return back()->with('success', 'Inquiry deleted successfully.');
    }
}
