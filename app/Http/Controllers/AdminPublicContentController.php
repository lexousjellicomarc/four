<?php

namespace App\Http\Controllers;

use App\Models\FeaturePackage;
use App\Models\HomepageStat;
use App\Models\PublicEvent;
use App\Models\SiteSetting;
use App\Models\VenueSpace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use App\Models\TourismMember;
use Inertia\Inertia;
use Inertia\Response;

class AdminPublicContentController extends Controller
{
    public function home(Request $request): Response
    {
        $this->ensureAdmin($request);

        return Inertia::render('admin/home', [
            'initialBcccEvents' => $this->eventsPayload('bccc')->all(),
            'initialCityEvents' => $this->eventsPayload('city')->all(),
            'initialPackages' => $this->packagesPayload()->all(),
            'initialCalendarBlocks' => $this->calendarBlocksPayload()->all(),
            'initialSpaces' => $this->spacesPayload()->all(),
            'initialStats' => $this->statsPayload()->all(),
            'initialTourismMembers' => $this->membersPayload()->all(),
            'initialSiteConfig' => $this->siteSettingsPayload(),
        ]);
    }

    public function storeEvent(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'scope' => ['required', Rule::in(['bccc', 'city'])],
            'title' => ['required', 'string', 'max:255'],
            'venue' => ['required', 'string', 'max:255'],
            'event_date' => ['required', 'date'],
            'event_time' => ['nullable', 'string', 'max:20'],
            'description' => ['required', 'string'],
            'note' => ['nullable', 'string'],
            'is_highlighted' => ['nullable', 'boolean'],
            'is_public' => ['nullable', 'boolean'],
            'images.*' => ['nullable', 'image', 'max:8192'],
        ]);

        $event = PublicEvent::query()->create([
            'scope' => $data['scope'],
            'title' => $data['title'],
            'venue' => $data['venue'],
            'event_date' => $data['event_date'],
            'event_time' => $data['event_time'] ?? null,
            'description' => $data['description'],
            'note' => $data['note'] ?? null,
            'is_highlighted' => (bool) ($data['is_highlighted'] ?? false),
            'is_public' => array_key_exists('is_public', $data)
                ? (bool) $data['is_public']
                : true,
            'images' => $this->storeManyImages($request, 'images', 'public-events'),
            'sort_order' => (PublicEvent::query()->max('sort_order') ?? 0) + 1,
        ]);

        return response()->json([
            'message' => 'Event created successfully.',
            'item' => $this->eventRow($event->fresh()),
        ]);
    }

    public function updateEvent(Request $request, PublicEvent $publicEvent): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'scope' => ['required', Rule::in(['bccc', 'city'])],
            'title' => ['required', 'string', 'max:255'],
            'venue' => ['required', 'string', 'max:255'],
            'event_date' => ['required', 'date'],
            'event_time' => ['nullable', 'string', 'max:20'],
            'description' => ['required', 'string'],
            'note' => ['nullable', 'string'],
            'is_highlighted' => ['nullable', 'boolean'],
            'is_public' => ['nullable', 'boolean'],
            'images.*' => ['nullable', 'image', 'max:8192'],
        ]);

        $existingImages = is_array($publicEvent->images) ? $publicEvent->images : [];

        $publicEvent->update([
            'scope' => $data['scope'],
            'title' => $data['title'],
            'venue' => $data['venue'],
            'event_date' => $data['event_date'],
            'event_time' => $data['event_time'] ?? null,
            'description' => $data['description'],
            'note' => $data['note'] ?? null,
            'is_highlighted' => (bool) ($data['is_highlighted'] ?? false),
            'is_public' => array_key_exists('is_public', $data)
                ? (bool) $data['is_public']
                : true,
            'images' => $request->hasFile('images')
                ? $this->replaceManyImages($request, 'images', 'public-events', $existingImages)
                : $existingImages,
        ]);

        return response()->json([
            'message' => 'Event updated successfully.',
            'item' => $this->eventRow($publicEvent->fresh()),
        ]);
    }

    public function destroyEvent(Request $request, PublicEvent $publicEvent): JsonResponse
    {
        $this->ensureAdmin($request);

        $this->deleteManyImages(is_array($publicEvent->images) ? $publicEvent->images : []);
        $id = $publicEvent->id;
        $publicEvent->delete();

        return response()->json([
            'message' => 'Event deleted successfully.',
            'id' => $id,
        ]);
    }

    public function storePackage(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'images.*' => ['nullable', 'image', 'max:8192'],
        ]);

        $package = FeaturePackage::query()->create([
            'title' => $data['title'],
            'description' => $data['description'],
            'images' => $this->storeManyImages($request, 'images', 'feature-packages'),
            'sort_order' => (FeaturePackage::query()->max('sort_order') ?? 0) + 1,
        ]);

        return response()->json([
            'message' => 'Package created successfully.',
            'item' => $this->packageRow($package->fresh()),
        ]);
    }

    public function updatePackage(Request $request, FeaturePackage $featurePackage): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'images.*' => ['nullable', 'image', 'max:8192'],
        ]);

        $existingImages = is_array($featurePackage->images) ? $featurePackage->images : [];

        $featurePackage->update([
            'title' => $data['title'],
            'description' => $data['description'],
            'images' => $request->hasFile('images')
                ? $this->replaceManyImages($request, 'images', 'feature-packages', $existingImages)
                : $existingImages,
        ]);

        return response()->json([
            'message' => 'Package updated successfully.',
            'item' => $this->packageRow($featurePackage->fresh()),
        ]);
    }

    public function destroyPackage(Request $request, FeaturePackage $featurePackage): JsonResponse
    {
        $this->ensureAdmin($request);

        $this->deleteManyImages(is_array($featurePackage->images) ? $featurePackage->images : []);
        $id = $featurePackage->id;
        $featurePackage->delete();

        return response()->json([
            'message' => 'Package deleted successfully.',
            'id' => $id,
        ]);
    }

    public function storeSpace(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'capacity' => ['nullable', 'string', 'max:255'],
            'short_description' => ['required', 'string'],
            'summary' => ['nullable', 'string'],
            'details_text' => ['nullable', 'string'],
            'homepage_visible' => ['nullable', 'boolean'],
            'light_image' => ['nullable', 'image', 'max:8192'],
            'dark_image' => ['nullable', 'image', 'max:8192'],
        ]);

        $space = VenueSpace::query()->create([
            'title' => $data['title'],
            'category' => $data['category'],
            'capacity' => $data['capacity'] ?? null,
            'short_description' => $data['short_description'],
            'summary' => $data['summary'] ?? null,
            'details' => $this->detailsTextToArray($data['details_text'] ?? null),
            'light_image' => $this->storeSingleImage($request, 'light_image', 'venue-spaces'),
            'dark_image' => $this->storeSingleImage($request, 'dark_image', 'venue-spaces'),
            'homepage_visible' => array_key_exists('homepage_visible', $data)
                ? (bool) $data['homepage_visible']
                : true,
            'sort_order' => (VenueSpace::query()->max('sort_order') ?? 0) + 1,
        ]);

        return response()->json([
            'message' => 'Venue space created successfully.',
            'item' => $this->spaceRow($space->fresh()),
        ]);
    }

    public function updateSpace(Request $request, VenueSpace $venueSpace): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'capacity' => ['nullable', 'string', 'max:255'],
            'short_description' => ['required', 'string'],
            'summary' => ['nullable', 'string'],
            'details_text' => ['nullable', 'string'],
            'homepage_visible' => ['nullable', 'boolean'],
            'light_image' => ['nullable', 'image', 'max:8192'],
            'dark_image' => ['nullable', 'image', 'max:8192'],
        ]);

        $venueSpace->update([
            'title' => $data['title'],
            'category' => $data['category'],
            'capacity' => $data['capacity'] ?? null,
            'short_description' => $data['short_description'],
            'summary' => $data['summary'] ?? null,
            'details' => $this->detailsTextToArray($data['details_text'] ?? null),
            'homepage_visible' => array_key_exists('homepage_visible', $data)
                ? (bool) $data['homepage_visible']
                : true,
            'light_image' => $request->hasFile('light_image')
                ? $this->replaceSingleImage($request, 'light_image', 'venue-spaces', $venueSpace->light_image)
                : $venueSpace->light_image,
            'dark_image' => $request->hasFile('dark_image')
                ? $this->replaceSingleImage($request, 'dark_image', 'venue-spaces', $venueSpace->dark_image)
                : $venueSpace->dark_image,
        ]);

        return response()->json([
            'message' => 'Venue space updated successfully.',
            'item' => $this->spaceRow($venueSpace->fresh()),
        ]);
    }

    public function destroySpace(Request $request, VenueSpace $venueSpace): JsonResponse
    {
        $this->ensureAdmin($request);

        $this->deleteSingleImage($venueSpace->light_image);
        $this->deleteSingleImage($venueSpace->dark_image);

        $id = $venueSpace->id;
        $venueSpace->delete();

        return response()->json([
            'message' => 'Venue space deleted successfully.',
            'id' => $id,
        ]);
    }

    public function storeStat(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'value' => ['required', 'string', 'max:255'],
            'suffix' => ['nullable', 'string', 'max:50'],
        ]);

        $stat = HomepageStat::query()->create([
            'label' => $data['label'],
            'value' => $data['value'],
            'suffix' => $data['suffix'] ?? null,
            'sort_order' => (HomepageStat::query()->max('sort_order') ?? 0) + 1,
        ]);

        return response()->json([
            'message' => 'Homepage stat created successfully.',
            'item' => $this->statRow($stat->fresh()),
        ]);
    }

    public function updateStat(Request $request, HomepageStat $homepageStat): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'value' => ['required', 'string', 'max:255'],
            'suffix' => ['nullable', 'string', 'max:50'],
        ]);

        $homepageStat->update([
            'label' => $data['label'],
            'value' => $data['value'],
            'suffix' => $data['suffix'] ?? null,
        ]);

        return response()->json([
            'message' => 'Homepage stat updated successfully.',
            'item' => $this->statRow($homepageStat->fresh()),
        ]);
    }

    public function destroyStat(Request $request, HomepageStat $homepageStat): JsonResponse
    {
        $this->ensureAdmin($request);

        $id = $homepageStat->id;
        $homepageStat->delete();

        return response()->json([
            'message' => 'Homepage stat deleted successfully.',
            'id' => $id,
        ]);
    }

    public function storeTourismMember(Request $request): JsonResponse
{
    $this->ensureAdmin($request);

    $data = $request->validate([
        'full_name' => ['required', 'string', 'max:255'],
        'designation' => ['required', 'string', 'max:255'],
        'unit_name' => ['nullable', 'string', 'max:255'],
        'email' => ['nullable', 'email', 'max:255'],
        'phone' => ['nullable', 'string', 'max:255'],
        'short_bio' => ['nullable', 'string'],
        'details_text' => ['nullable', 'string'],
        'is_active' => ['nullable', 'boolean'],
        'is_featured' => ['nullable', 'boolean'],
        'photo' => ['nullable', 'image', 'max:8192'],
    ]);

    $member = TourismMember::query()->create([
        'full_name' => $data['full_name'],
        'designation' => $data['designation'],
        'unit_name' => $data['unit_name'] ?? null,
        'email' => $data['email'] ?? null,
        'phone' => $data['phone'] ?? null,
        'short_bio' => $data['short_bio'] ?? null,
        'details' => $this->detailsTextToArray($data['details_text'] ?? null),
        'photo_path' => $this->storeSingleImage($request, 'photo', 'tourism-members'),
        'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : true,
        'is_featured' => array_key_exists('is_featured', $data) ? (bool) $data['is_featured'] : false,
        'sort_order' => (TourismMember::query()->max('sort_order') ?? 0) + 1,
    ]);

    return response()->json([
        'message' => 'Tourism member profile created successfully.',
        'item' => $this->memberRow($member->fresh()),
    ]);
}

public function updateTourismMember(Request $request, TourismMember $tourismMember): JsonResponse
{
    $this->ensureAdmin($request);

    $data = $request->validate([
        'full_name' => ['required', 'string', 'max:255'],
        'designation' => ['required', 'string', 'max:255'],
        'unit_name' => ['nullable', 'string', 'max:255'],
        'email' => ['nullable', 'email', 'max:255'],
        'phone' => ['nullable', 'string', 'max:255'],
        'short_bio' => ['nullable', 'string'],
        'details_text' => ['nullable', 'string'],
        'is_active' => ['nullable', 'boolean'],
        'is_featured' => ['nullable', 'boolean'],
        'photo' => ['nullable', 'image', 'max:8192'],
    ]);

    $tourismMember->update([
        'full_name' => $data['full_name'],
        'designation' => $data['designation'],
        'unit_name' => $data['unit_name'] ?? null,
        'email' => $data['email'] ?? null,
        'phone' => $data['phone'] ?? null,
        'short_bio' => $data['short_bio'] ?? null,
        'details' => $this->detailsTextToArray($data['details_text'] ?? null),
        'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : true,
        'is_featured' => array_key_exists('is_featured', $data) ? (bool) $data['is_featured'] : false,
        'photo_path' => $request->hasFile('photo')
            ? $this->replaceSingleImage($request, 'photo', 'tourism-members', $tourismMember->photo_path)
            : $tourismMember->photo_path,
    ]);

    return response()->json([
        'message' => 'Tourism member profile updated successfully.',
        'item' => $this->memberRow($tourismMember->fresh()),
    ]);
}

public function destroyTourismMember(Request $request, TourismMember $tourismMember): JsonResponse
{
    $this->ensureAdmin($request);

    $this->deleteSingleImage($tourismMember->photo_path);
    $id = $tourismMember->id;
    $tourismMember->delete();

    return response()->json([
        'message' => 'Tourism member profile deleted successfully.',
        'id' => $id,
    ]);
}

    public function updateSiteSettings(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

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

        return response()->json([
            'message' => 'Site settings updated successfully.',
            'item' => $this->siteSettingsPayload(),
        ]);
    }

    protected function eventsPayload(string $scope): Collection
    {
        return PublicEvent::query()
            ->where('scope', $scope)
            ->orderBy('sort_order')
            ->orderBy('event_date')
            ->get()
            ->map(fn (PublicEvent $event) => $this->eventRow($event))
            ->values();
    }

    protected function packagesPayload(): Collection
    {
        return FeaturePackage::query()
            ->orderBy('sort_order')
            ->get()
            ->map(fn (FeaturePackage $package) => $this->packageRow($package))
            ->values();
    }

    protected function calendarBlocksPayload(): Collection
{
    return \App\Models\CalendarBlock::query()
        ->orderByDesc('date_from')
        ->orderByDesc('id')
        ->get()
        ->map(fn (\App\Models\CalendarBlock $block) => [
            'id' => $block->id,
            'title' => $block->title,
            'area' => $block->area ?? '',
            'block' => $block->block,
            'dateFrom' => $this->normalizeAdminCalendarStartDate($block->date_from),
            'dateTo' => $this->normalizeAdminCalendarEndDate($block->date_from, $block->date_to),
            'note' => $block->notes ?? '',
            'statusColor' => $block->public_status ?? 'red',
        ])
        ->values();
}

protected function normalizeAdminCalendarStartDate(mixed $value): string
{
    try {
        return \Carbon\Carbon::parse($value)->format('Y-m-d');
    } catch (\Throwable $e) {
        return substr((string) $value, 0, 10);
    }
}

protected function normalizeAdminCalendarEndDate(mixed $fromValue, mixed $toValue): string
{
    try {
        $from = \Carbon\Carbon::parse($fromValue);
        $to = \Carbon\Carbon::parse($toValue);

        if (
            $to->format('H:i') === '00:00'
            && $to->copy()->startOfDay()->equalTo($from->copy()->startOfDay()->addDay())
        ) {
            return $from->format('Y-m-d');
        }

        return $to->format('Y-m-d');
    } catch (\Throwable $e) {
        return substr((string) $toValue, 0, 10);
    }
}


    protected function spacesPayload(): Collection
    {
        return VenueSpace::query()
            ->orderBy('sort_order')
            ->get()
            ->map(fn (VenueSpace $space) => $this->spaceRow($space))
            ->values();
    }

    protected function statsPayload(): Collection
    {
        return HomepageStat::query()
            ->orderBy('sort_order')
            ->get()
            ->map(fn (HomepageStat $stat) => $this->statRow($stat))
            ->values();
    }

    protected function siteSettingsPayload(): array
{
    $settings = SiteSetting::query()->first();

    return [
        'mapEmbedUrl' => $settings?->map_embed_url ?? '',
        'openMapUrl' => $settings?->open_map_url ?? '',
        'address' => $settings?->address ?? '',
        'phone' => $settings?->phone ?? '',
        'email' => $settings?->email ?? '',
        'visitaUrl' => $settings?->visita_url ?? '',
        'creativeBaguioUrl' => $settings?->creative_baguio_url ?? '',
        'footerDescription' => $settings?->footer_description ?? '',
        'footerCopyright' => $settings?->footer_copyright ?? '',
    ];
}


    protected function eventRow(PublicEvent $event): array
{
    return [
        'id' => $event->id,
        'title' => $event->title,
        'venue' => $event->venue,
        'date' => $event->event_date?->format('Y-m-d') ?? '',
        'time' => $event->event_time,
        'description' => $event->description,
        'note' => $event->note ?? '',
        'highlighted' => (bool) $event->is_highlighted,
        'images' => is_array($event->images) ? array_values($event->images) : [],
        'scope' => $event->scope,
        'isPublic' => (bool) $event->is_public,
    ];
}


    protected function packageRow(FeaturePackage $package): array
    {
        return [
            'id' => $package->id,
            'title' => $package->title,
            'description' => $package->description,
            'images' => is_array($package->images) ? $package->images : [],
        ];
    }

    protected function spaceRow(VenueSpace $space): array
{
    return [
        'id' => $space->id,
        'title' => $space->title,
        'category' => $space->category,
        'capacity' => $space->capacity ?? '',
        'shortDescription' => $space->short_description,
        'summary' => $space->summary ?: $space->short_description,
        'details' => is_array($space->details) ? array_values($space->details) : [],
        'lightImage' => $space->light_image ?? '',
        'darkImage' => $space->dark_image ?? '',
        'homepageVisible' => (bool) $space->homepage_visible,
    ];
}


    protected function statRow(HomepageStat $stat): array
    {
        return [
            'id' => $stat->id,
            'label' => $stat->label,
            'value' => $stat->value,
            'suffix' => $stat->suffix ?? '',
        ];
    }

    protected function membersPayload(): Collection
{
    return TourismMember::query()
        ->orderByDesc('is_featured')
        ->orderBy('sort_order')
        ->orderBy('full_name')
        ->get()
        ->map(fn (TourismMember $member) => $this->memberRow($member))
        ->values();
}

protected function memberRow(TourismMember $member): array
{
    return [
        'id' => $member->id,
        'fullName' => $member->full_name,
        'designation' => $member->designation,
        'unitName' => $member->unit_name ?? '',
        'email' => $member->email ?? '',
        'phone' => $member->phone ?? '',
        'shortBio' => $member->short_bio ?? '',
        'details' => is_array($member->details) ? $member->details : [],
        'photo' => $member->photo_path ?? '',
        'active' => (bool) $member->is_active,
        'featured' => (bool) $member->is_featured,
    ];
}

    protected function detailsTextToArray(?string $text): array
    {
        if (! $text) {
            return [];
        }

        return collect(preg_split('/\r\n|\r|\n/', $text))
            ->map(fn (?string $line) => trim((string) $line))
            ->filter()
            ->values()
            ->all();
    }

    protected function ensureAdmin(Request $request): void
{
    $user = $request->user();

    if (! $user || ! $user->hasAnyRole(['admin', 'manager'])) {
        abort(403);
    }
}


    protected function storeManyImages(Request $request, string $field, string $directory): array
    {
        if (! $request->hasFile($field)) {
            return [];
        }

        $paths = [];

        foreach ((array) $request->file($field) as $file) {
            if (! $file) {
                continue;
            }

            $stored = $file->store($directory, 'public');
            if ($stored) {
                $paths[] = '/storage/' . ltrim($stored, '/');
            }
        }

        return array_values(array_slice($paths, 0, 3));
    }

    protected function replaceManyImages(Request $request, string $field, string $directory, array $oldPaths): array
    {
        $newPaths = $this->storeManyImages($request, $field, $directory);

        if (! empty($newPaths)) {
            $this->deleteManyImages($oldPaths);
            return $newPaths;
        }

        return array_values($oldPaths);
    }

    protected function deleteManyImages(array $paths): void
    {
        foreach ($paths as $path) {
            $this->deleteSingleImage($path);
        }
    }

    protected function storeSingleImage(Request $request, string $field, string $directory): ?string
    {
        if (! $request->hasFile($field)) {
            return null;
        }

        $stored = $request->file($field)->store($directory, 'public');

        return $stored ? '/storage/' . ltrim($stored, '/') : null;
    }

    protected function replaceSingleImage(Request $request, string $field, string $directory, ?string $oldPath): ?string
    {
        $newPath = $this->storeSingleImage($request, $field, $directory);

        if ($newPath) {
            $this->deleteSingleImage($oldPath);
            return $newPath;
        }

        return $oldPath;
    }

    protected function deleteSingleImage(?string $path): void
    {
        if (! $path) {
            return;
        }

        $relative = ltrim(str_replace('/storage/', '', (string) $path), '/');

        if ($relative !== '') {
            Storage::disk('public')->delete($relative);
        }
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
        if (! in_array($scheme, ['http', 'https'], true)) {
            return null;
        }

        return $value;
    }

    protected function sanitizeMapEmbedUrl(?string $value): ?string
    {
        $value = $this->sanitizeHttpsUrl($value);

        if (! $value) {
            return null;
        }

        $host = strtolower((string) parse_url($value, PHP_URL_HOST));
        $allowedHosts = ['www.google.com', 'google.com', 'maps.google.com', 'www.google.com.ph', 'google.com.ph'];

        return in_array($host, $allowedHosts, true) ? $value : null;
    }
}
