<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\CalendarBlock;
use App\Models\FeaturePackage;
use App\Models\HomepageStat;
use App\Models\PublicEvent;
use App\Models\SiteSetting;
use App\Models\TourismMember;
use App\Models\VenueSpace;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PublicSiteController extends Controller
{
    public function home(): Response
    {
        return Inertia::render('public/home', [
            'siteSettings' => $this->siteSettingsPayload(),
            'venueOptions' => $this->venueOptionsPayload()->all(),
            'events' => $this->eventsPayload()->all(),
            'spaces' => $this->spacesPayload()
                ->where('homepageVisible', true)
                ->values()
                ->all(),
            'stats' => $this->statsPayload()->all(),
            'offers' => $this->packagesPayload()->all(),
        ]);
    }

    public function facilities(): Response
    {
        return Inertia::render('public/facilities', [
            'siteSettings' => $this->siteSettingsPayload(),
            'spaces' => $this->spacesPayload()->all(),
        ]);
    }

    public function facilityShow(string $slug): Response
    {
        $spaces = $this->spacesPayload();
        $facility = $spaces->firstWhere('slug', $slug);

        abort_unless($facility, 404);

        return Inertia::render('public/facility-show', [
            'siteSettings' => $this->siteSettingsPayload(),
            'facility' => $facility,
            'relatedFacilities' => $spaces
                ->reject(fn (array $item) => $item['slug'] === $slug)
                ->take(3)
                ->values()
                ->all(),
        ]);
    }

    public function events(): Response
    {
        return Inertia::render('public/events', [
            'siteSettings' => $this->siteSettingsPayload(),
            'events' => $this->eventsPayload()->all(),
        ]);
    }

    public function calendar(): Response
    {
        return Inertia::render('public/calendar', [
            'siteSettings' => $this->siteSettingsPayload(),
            'events' => $this->eventsPayload()->all(),
            'calendarBlocks' => $this->calendarBlocksPayload()->all(),
            'venueOptions' => $this->venueOptionsPayload()->all(),
        ]);
    }

    public function tourismOffice(): Response
    {
        $spaces = $this->spacesPayload();

        $officeSpace = $spaces->first(function (array $item) {
            return $this->isTourismOfficeSpace($item);
        });

        return Inertia::render('public/tourism-office', [
            'siteSettings' => $this->siteSettingsPayload(),
            'officeSpace' => $officeSpace,
            'events' => $this->eventsPayload()
                ->filter(fn (array $item) => $item['isPublic'] === true)
                ->take(3)
                ->values()
                ->all(),
            'members' => $this->membersPayload()->all(),
        ]);
    }

    public function contact(): Response
    {
        return Inertia::render('public/contact', [
            'siteSettings' => $this->siteSettingsPayload(),
            'venueOptions' => $this->venueOptionsPayload()->all(),
        ]);
    }

    public function guidelines(): Response
    {
        return Inertia::render('public/guidelines', [
            'siteSettings' => $this->siteSettingsPayload(),
        ]);
    }

    protected function siteSettingsPayload(): array
    {
        $settings = SiteSetting::query()->first();

        $openMapUrl = $this->safeExternalUrl($settings?->open_map_url)
            ?: 'https://www.google.com/maps/search/?api=1&query=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines';

        $visitaUrl = $this->safeExternalUrl($settings?->visita_url) ?: '';
        $creativeBaguioUrl = $this->safeExternalUrl($settings?->creative_baguio_url) ?: '';
        $mapEmbedUrl = $this->safeMapEmbedUrl($settings?->map_embed_url);

        return [
            'mapEmbedUrl' => $mapEmbedUrl,
            'openMapUrl' => $openMapUrl,
            'address' => $settings?->address ?: 'CH3X+RRW, Baguio, Benguet, Philippines',
            'phone' => $settings?->phone ?: '(074) 446 2009',
            'email' => $settings?->email ?: 'info@bccc-ease.com',
            'visitaUrl' => $visitaUrl,
            'creativeBaguioUrl' => $creativeBaguioUrl,
            'footerDescription' => $settings?->footer_description ?: 'A public-facing venue platform for space discovery, event highlights, schedule visibility, and booking guidance for the Baguio Convention and Cultural Center.',
            'footerCopyright' => $settings?->footer_copyright ?: '© 2026 BCCC EASE • City Government of Baguio • All Rights Reserved',
        ];
    }

    protected function venueOptionsPayload(): Collection
    {
        return collect([
            ['label' => 'FULL HALL', 'value' => 'Full Hall', 'category' => 'Whole venue access', 'capacity' => 'Layout dependent'],
            ['label' => 'MAIN HALL', 'value' => 'Main Hall', 'category' => 'Primary hall', 'capacity' => 'Large-format events'],
            ['label' => 'FOYER & LOBBY AREA', 'value' => 'Foyer & Lobby Area', 'category' => 'Reception space', 'capacity' => 'Guest flow area'],
            ['label' => 'VIP LOUNGE', 'value' => 'VIP Lounge', 'category' => 'Executive space', 'capacity' => 'VIP holding'],
            ['label' => 'BOARD ROOM', 'value' => 'Board Room', 'category' => 'Meeting space', 'capacity' => 'Small-group setup'],
            ['label' => 'BASEMENT', 'value' => 'Basement', 'category' => 'Support / event space', 'capacity' => 'Flexible use'],
            ['label' => 'GALLERY2600', 'value' => 'Gallery2600', 'category' => 'Gallery space', 'capacity' => 'Exhibit-ready'],
        ]);
    }

    protected function spacesPayload(): Collection
    {
        return VenueSpace::query()
            ->orderBy('sort_order')
            ->get()
            ->map(function (VenueSpace $space) {
                $fallbackLight = '/marketing/images/branding/noon.jpg';
                $fallbackDark = '/marketing/images/hero/night.png';

                $light = $space->light_image ?: $fallbackLight;
                $dark = $space->dark_image ?: ($space->light_image ?: $fallbackDark);
                $homepageVisible = (bool) $space->homepage_visible;

                return [
                    'id' => $space->id,
                    'slug' => Str::slug($space->title),
                    'title' => $space->title,
                    'shortDescription' => $space->short_description,
                    'summary' => $space->summary ?: $space->short_description,
                    'details' => is_array($space->details) ? array_values($space->details) : [],
                    'image' => $light,
                    'lightImage' => $light,
                    'darkImage' => $dark,
                    'capacity' => $space->capacity ?: 'Flexible venue capacity',
                    'category' => $space->category ?: 'Venue Space',
                    'ctaLabel' => $this->isTourismOfficeSpace([
                        'slug' => Str::slug($space->title),
                        'title' => $space->title,
                        'category' => $space->category,
                    ]) ? 'View Office' : 'View Space',
                    'homepageVisible' => $homepageVisible,
                    'featured' => $homepageVisible,
                ];
            })
            ->values();
    }

    protected function eventsPayload(): Collection
    {
        return PublicEvent::query()
            ->where('is_public', true)
            ->orderByDesc('is_highlighted')
            ->orderBy('event_date')
            ->orderBy('sort_order')
            ->get()
            ->map(function (PublicEvent $event) {
                $images = is_array($event->images) && count($event->images) > 0
                    ? array_values($event->images)
                    : ['/marketing/images/events/1.JPG'];

                $image = $images[0];
                $scope = $event->scope === 'city' ? 'city' : 'bccc';
                $highlighted = (bool) $event->is_highlighted;

                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'date' => $event->event_date?->format('F j, Y') ?? '',
                    'dateKey' => $event->event_date?->format('Y-m-d'),
                    'time' => $event->event_time,
                    'summary' => $event->note ?: Str::limit((string) $event->description, 140),
                    'description' => $event->description,
                    'note' => $event->note ?: 'Public event details remain subject to final operational confirmation.',
                    'venue' => $event->venue,
                    'images' => $images,
                    'image' => $image,
                    'lightImage' => $image,
                    'darkImage' => $image,
                    'category' => $scope === 'city' ? 'Baguio City Event' : 'BCCC Public Event',
                    'featured' => $highlighted,
                    'highlighted' => $highlighted,
                    'scope' => $scope,
                    'isPublic' => (bool) $event->is_public,
                ];
            })
            ->values();
    }

    protected function statsPayload(): Collection
    {
        return HomepageStat::query()
            ->orderBy('sort_order')
            ->get()
            ->map(fn (HomepageStat $stat) => [
                'id' => $stat->id,
                'value' => (string) $stat->value,
                'suffix' => $stat->suffix ?: '',
                'label' => $stat->label,
            ])
            ->values();
    }

    protected function packagesPayload(): Collection
    {
        return FeaturePackage::query()
            ->orderBy('sort_order')
            ->get()
            ->map(function (FeaturePackage $package) {
                $images = is_array($package->images) && count($package->images) > 0
                    ? array_values($package->images)
                    : ['/marketing/images/events/4.jpg'];
                $image = $images[0];

                return [
                    'id' => $package->id,
                    'title' => $package->title,
                    'subtitle' => 'Venue package option',
                    'description' => $package->description,
                    'images' => $images,
                    'image' => $image,
                    'lightImage' => $image,
                    'darkImage' => $image,
                    'buttonLabel' => 'Ask About This Package',
                    'href' => '/contact',
                ];
            })
            ->values();
    }

    protected function calendarBlocksPayload(): Collection
    {
        $manualBlocks = CalendarBlock::query()
            ->whereNotNull('public_status')
            ->orderBy('date_from')
            ->get()
            ->map(function (CalendarBlock $block) {
                $status = strtolower((string) ($block->public_status ?? 'red'));

                return [
                    'title' => match ($status) {
                        'blue' => (string) ($block->title ?? 'Public Event Block'),
                        'gold' => 'Private Booking',
                        default => 'Blocked Date',
                    },
                    'area' => match ($status) {
                        'blue' => (string) ($block->area ?? ''),
                        'gold' => 'Reserved area details are hidden',
                        default => 'Unavailable for public requests',
                    },
                    'notes' => match ($status) {
                        'blue' => (string) ($block->notes ?? ''),
                        'gold' => 'Private booking details are hidden from public view.',
                        default => 'This date is blocked for maintenance, control, or other internal reasons.',
                    },
                    'publicStatus' => $status ?: 'red',
                    'dateFrom' => $this->normalizePublicCalendarStartDate($block->date_from),
                    'dateTo' => $this->normalizePublicCalendarEndDate($block->date_from, $block->date_to),
                ];
            });

        $bookingBlocks = Booking::query()
            ->with(['bookingServices.service.serviceType', 'service.serviceType'])
            ->whereIn('booking_status', ['confirmed', 'active'])
            ->orderBy('booking_date_from')
            ->get()
            ->map(function (Booking $booking) {
                return [
                    'title' => 'Private Booking',
                    'area' => 'Reserved area details are hidden',
                    'notes' => 'Confirmed and active bookings appear as private dates on the public calendar.',
                    'publicStatus' => 'gold',
                    'dateFrom' => $this->normalizePublicCalendarStartDate($booking->booking_date_from),
                    'dateTo' => $this->normalizePublicCalendarEndDate($booking->booking_date_from, $booking->booking_date_to),
                ];
            });

        return $manualBlocks->concat($bookingBlocks)->values();
    }

    protected function membersPayload(): Collection
    {
        return TourismMember::query()
            ->where('is_active', true)
            ->orderByDesc('is_featured')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (TourismMember $member) => [
                'id' => $member->id,
                'name' => $member->name,
                'position' => $member->position,
                'shortBio' => $member->short_bio,
                'details' => is_array($member->details) ? $member->details : [],
                'photo' => $member->photo_path ?: '/marketing/images/branding/breathe-dark.png',
                'featured' => (bool) $member->is_featured,
            ])
            ->values();
    }

    protected function isTourismOfficeSpace(array $item): bool
    {
        $title = strtolower((string) ($item['title'] ?? ''));
        $slug = strtolower((string) ($item['slug'] ?? ''));
        $category = strtolower((string) ($item['category'] ?? ''));

        return str_contains($title, 'tourism')
            || str_contains($slug, 'tourism')
            || str_contains($category, 'tourism office');
    }

    protected function normalizePublicCalendarStartDate($value): ?string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        if (! $value) {
            return null;
        }

        try {
            return \Carbon\Carbon::parse($value)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }

    protected function normalizePublicCalendarEndDate($from, $to): ?string
    {
        $fromDate = $this->normalizePublicCalendarStartDate($from);
        $toDate = $this->normalizePublicCalendarStartDate($to);

        return $toDate ?: $fromDate;
    }

    protected function safeExternalUrl(?string $value): ?string
    {
        $value = is_string($value) ? trim($value) : null;

        if (! $value || ! filter_var($value, FILTER_VALIDATE_URL)) {
            return null;
        }

        $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https'], true) ? $value : null;
    }

    protected function safeMapEmbedUrl(?string $value): ?string
    {
        $value = $this->safeExternalUrl($value);

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
