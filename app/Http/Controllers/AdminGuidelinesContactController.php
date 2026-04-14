<?php

namespace App\Http\Controllers;

use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminGuidelinesContactController extends Controller
{
    public function index(Request $request): Response
    {
        $this->ensureAdminLike($request);

        $settings = SiteSetting::query()->first();

        return Inertia::render('admin/guidelines-contacts', [
            'siteSettings' => [
                'mapEmbedUrl' => $settings?->map_embed_url,
                'openMapUrl' => $settings?->open_map_url,
                'address' => $settings?->address,
                'phone' => $settings?->phone,
                'email' => $settings?->email,
                'visitaUrl' => $settings?->visita_url,
                'creativeBaguioUrl' => $settings?->creative_baguio_url,
                'footerDescription' => $settings?->footer_description,
                'footerCopyright' => $settings?->footer_copyright,
            ],
            'guidelinesSections' => $this->guidelinesSections(),
            'termsSections' => $this->termsSections(),
            'operationalNotes' => $this->operationalNotes(),
        ]);
    }

    public function update(Request $request): RedirectResponse|JsonResponse
    {
        $this->ensureAdminLike($request);

        $data = $request->validate([
            'map_embed_url' => ['nullable', 'string', 'max:2000'],
            'open_map_url' => ['nullable', 'url', 'max:2000'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'visita_url' => ['nullable', 'url', 'max:2000'],
            'creative_baguio_url' => ['nullable', 'url', 'max:2000'],
            'footer_description' => ['nullable', 'string'],
            'footer_copyright' => ['nullable', 'string', 'max:255'],
        ]);

        $settings = SiteSetting::query()->firstOrCreate([]);

        $settings->update([
            'map_embed_url' => $this->sanitizeMapEmbedUrl($data['map_embed_url'] ?? null),
            'open_map_url' => $this->sanitizeHttpsUrl($data['open_map_url'] ?? null),
            'address' => $this->nullableTrim($data['address'] ?? null),
            'phone' => $this->nullableTrim($data['phone'] ?? null),
            'email' => $this->nullableTrim($data['email'] ?? null),
            'visita_url' => $this->sanitizeHttpsUrl($data['visita_url'] ?? null),
            'creative_baguio_url' => $this->sanitizeHttpsUrl($data['creative_baguio_url'] ?? null),
            'footer_description' => $this->nullableTrim($data['footer_description'] ?? null),
            'footer_copyright' => $this->nullableTrim($data['footer_copyright'] ?? null),
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Guidelines & contact settings updated successfully.',
            ]);
        }

        return back()->with('success', 'Guidelines & contact settings updated successfully.');
    }

    protected function ensureAdminLike(Request $request): void
    {
        $user = $request->user();

        if (! $user || ! method_exists($user, 'hasAnyRole') || ! $user->hasAnyRole(['admin', 'manager', 'staff'])) {
            abort(403);
        }
    }

    protected function guidelinesSections(): array
    {
        return [
            [
                'title' => 'Before Submitting a Booking',
                'items' => [
                    'Choose the correct venue/area and confirm that the guest count fits the selected space.',
                    'Use the calendar first to verify that the date and AM / PM / EVE block are still open.',
                    'Prepare the event title, organizer details, contact number, billing contact, and expected setup needs before starting the form.',
                    'Remind clients that a booking request is still subject to final review, payment compliance, and venue policy checks.',
                ],
            ],
            [
                'title' => 'Public vs Private Visibility',
                'items' => [
                    'Public events may appear on the public-facing calendar and can be seen by other users.',
                    'Private bookings should remain hidden from the public-facing details while still blocking availability.',
                    'Calendar colors should remain simple for clients: blue for public event, red for blocked/unavailable, neutral for available.',
                    'Staff should review publication status carefully before marking an event as public-facing.',
                ],
            ],
            [
                'title' => 'Operational Review Reminders',
                'items' => [
                    'Check uploaded proofs before confirming submitted payments.',
                    'Use the operations and payment-review pages to resolve pending payments before 24-hour and 48-hour deadlines expire.',
                    'Ensure calendar blocks, public events, and confirmed bookings stay consistent across admin and public views.',
                    'Client-facing pages should stay simplified. Detailed workflow, audit, and operational controls belong to staff-only screens.',
                ],
            ],
        ];
    }

    protected function termsSections(): array
    {
        return [
            [
                'title' => 'Reservation and Payment',
                'body' => 'Bookings remain subject to official review and payment compliance. A pencil-booking request does not automatically guarantee final reservation until the required payment rules and administrative checks are satisfied.',
            ],
            [
                'title' => 'Public Conduct and Venue Use',
                'body' => 'Event organizers are expected to follow venue rules, safety instructions, ingress/egress directions, and any office-issued operational limitations for public assemblies, private functions, and setup activity.',
            ],
            [
                'title' => 'Damages, Additional Charges, and Cleanup',
                'body' => 'Additional venue charges, post-event assessments, damage-related obligations, and cleanup responsibilities must be settled in line with the final billing and venue policies communicated by the office.',
            ],
            [
                'title' => 'Publication and Public Calendar Visibility',
                'body' => 'Only approved public-facing events should appear in the public calendar and promotional sections. Private bookings must remain operationally visible to staff while keeping client privacy protected in public views.',
            ],
        ];
    }

    protected function operationalNotes(): array
    {
        return [
            'Keep the backend Guidelines & Contacts page separate from the frontend version so staff can see the fuller operating notes and policy context.',
            'Use this page as the internal reference when updating phone numbers, email, address, map links, or external tourism/arts links.',
            'When links are changed here, verify the frontend contact and footer areas immediately after saving.',
        ];
    }

    protected function nullableTrim(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);

        return $value !== '' ? $value : null;
    }

    protected function sanitizeHttpsUrl(?string $value): ?string
    {
        $value = $this->nullableTrim($value);

        if (! $value || ! filter_var($value, FILTER_VALIDATE_URL)) {
            return null;
        }

        $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https'], true) ? $value : null;
    }

    protected function sanitizeMapEmbedUrl(?string $value): ?string
    {
        $value = $this->sanitizeHttpsUrl($value);

        if (! $value) {
            return null;
        }

        $host = strtolower((string) parse_url($value, PHP_URL_HOST));
        $allowedHosts = [
            'www.google.com',
            'google.com',
            'maps.google.com',
            'www.google.com.ph',
            'google.com.ph',
        ];

        return in_array($host, $allowedHosts, true) ? $value : null;
    }
}
