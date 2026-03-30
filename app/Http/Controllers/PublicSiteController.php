<?php

namespace App\Http\Controllers;

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
                ->where('featured', true)
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
        ]);
    }

    public function tourismOffice(): Response
    {
        $spaces = $this->spacesPayload();
        $officeSpace = $spaces->firstWhere('slug', 'tourism-office');

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

        return [
            'mapEmbedUrl' => $settings?->map_embed_url,
            'openMapUrl' => $settings?->open_map_url ?: 'https://www.google.com/maps/search/?api=1&query=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines',
            'address' => $settings?->address ?: 'CH3X+RRW, Baguio, Benguet, Philippines',
            'phone' => $settings?->phone ?: '(074) 446 2009',
            'email' => $settings?->email ?: 'info@bccc-ease.com',
            'visitaUrl' => $settings?->visita_url ?: '',
            'creativeBaguioUrl' => $settings?->creative_baguio_url ?: '',
            'footerDescription' => $settings?->footer_description ?: 'A public-facing venue platform for space discovery, event highlights, schedule visibility, and booking guidance for the Baguio Convention and Cultural Center.',
            'footerCopyright' => $settings?->footer_copyright ?: '© 2026 BCCC EASE • City Government of Baguio • All Rights Reserved',
        ];
    }

    protected function venueOptionsPayload(): Collection
    {
        return collect([
            [
                'label' => 'Whole Venue',
                'value' => 'Whole Venue',
            ],
        ])->merge(
            VenueSpace::query()
                ->orderBy('sort_order')
                ->get(['title', 'category', 'capacity'])
                ->map(fn (VenueSpace $space) => [
                    'label' => $space->title,
                    'value' => $space->title,
                    'category' => $space->category,
                    'capacity' => $space->capacity,
                ])
        )->unique('value')->values();
    }

    protected function spacesPayload(): Collection
    {
        return VenueSpace::query()
            ->orderBy('sort_order')
            ->get()
            ->map(function (VenueSpace $space) {
                $fallbackLight = '/marketing/images/branding/noon.jpg';
                $fallbackDark = '/marketing/images/hero/night.png';

                return [
                    'slug' => Str::slug($space->title),
                    'title' => $space->title,
                    'shortDescription' => $space->short_description,
                    'summary' => $space->summary ?: $space->short_description,
                    'details' => is_array($space->details) ? $space->details : [],
                    'image' => $space->light_image ?: $fallbackLight,
                    'lightImage' => $space->light_image ?: $fallbackLight,
                    'darkImage' => $space->dark_image ?: ($space->light_image ?: $fallbackDark),
                    'capacity' => $space->capacity ?: 'Flexible venue capacity',
                    'category' => $space->category ?: 'Venue Space',
                    'ctaLabel' => Str::lower($space->title) === 'tourism office' ? 'View Office' : 'View Space',
                    'featured' => (bool) $space->homepage_visible,
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
                $image = is_array($event->images) && count($event->images) > 0
                    ? $event->images[0]
                    : '/marketing/images/events/1.JPG';

                $scope = $event->scope === 'city' ? 'city' : 'bccc';

                return [
                    'title' => $event->title,
                    'date' => $event->event_date?->format('F j, Y') ?? '',
                    'dateKey' => $event->event_date?->format('Y-m-d'),
                    'summary' => $event->note ?: Str::limit((string) $event->description, 140),
                    'description' => $event->description,
                    'note' => $event->note ?: 'Public event details remain subject to final operational confirmation.',
                    'venue' => $event->venue,
                    'image' => $image,
                    'lightImage' => $image,
                    'darkImage' => $image,
                    'category' => $scope === 'city' ? 'Baguio City Event' : 'BCCC Public Event',
                    'featured' => (bool) $event->is_highlighted,
                    'highlighted' => (bool) $event->is_highlighted,
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
                $image = is_array($package->images) && count($package->images) > 0
                    ? $package->images[0]
                    : '/marketing/images/events/4.jpg';

                return [
                    'title' => $package->title,
                    'subtitle' => 'Venue package option',
                    'description' => $package->description,
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
        return CalendarBlock::query()
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
                    'dateFrom' => substr((string) $block->date_from, 0, 10),
                    'dateTo' => substr((string) $block->date_to, 0, 10),
                ];
            })
            ->values();
    }

    protected function membersPayload(): Collection
    {
        return TourismMember::query()
            ->where('is_active', true)
            ->orderByDesc('is_featured')
            ->orderBy('sort_order')
            ->orderBy('full_name')
            ->get()
            ->map(function (TourismMember $member) {
                return [
                    'id' => $member->id,
                    'fullName' => $member->full_name,
                    'designation' => $member->designation,
                    'unitName' => $member->unit_name,
                    'email' => $member->email,
                    'phone' => $member->phone,
                    'shortBio' => $member->short_bio ?? '',
                    'details' => is_array($member->details) ? $member->details : [],
                    'photo' => $member->photo_path,
                    'featured' => (bool) $member->is_featured,
                ];
            })
            ->values();
    }
}
