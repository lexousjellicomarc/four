<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceTypeRequest;
use App\Http\Requests\UpdateServiceTypeRequest;
use App\Models\ServiceType;
use App\Services\Contracts\ServiceTypeServiceInterface;
use App\Services\NotificationService;
use App\Support\WorkspacePage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class ServiceTypeController extends Controller
{
    public function __construct(
        private readonly ServiceTypeServiceInterface $serviceTypes,
        private readonly NotificationService $notifications,
    ) {
    }

    public function index(Request $request): Response
    {
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = max(5, min($perPage, 100));

        $search = trim((string) $request->input('q', ''));

        $query = ServiceType::query()
            ->withCount('services')
            ->orderBy('name');

        if ($search !== '') {
            $query->where(function ($nested) use ($search) {
                $nested->where('name', 'like', "%{$search}%");

                if (Schema::hasColumn('service_types', 'description')) {
                    $nested->orWhere('description', 'like', "%{$search}%");
                }
            });
        }

        $serviceTypes = $query
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (ServiceType $serviceType) {
                return [
                    'id' => $serviceType->id,
                    'name' => $serviceType->name,
                    'description' => $serviceType->description ?? null,
                    'services_count' => $serviceType->services_count ?? 0,
                    'created_at' => optional($serviceType->created_at)->toIso8601String(),
                    'updated_at' => optional($serviceType->updated_at)->toIso8601String(),
                ];
            });

        return Inertia::render(WorkspacePage::resolve($request, 'service-types/index'), [
            'workspaceRole' => WorkspacePage::role($request),
            'serviceTypes' => $serviceTypes,
            'venueAreas' => $serviceTypes,
            'filters' => [
                'q' => $search,
            ],
        ]);
    }

    public function store(StoreServiceTypeRequest $request): RedirectResponse
    {
        $serviceType = $this->serviceTypes->create($request->validated());

        if ($request->user()) {
            $this->notifications->serviceTypeCreated($serviceType, $request->user());
        }

        return redirect()
            ->route(WorkspacePage::routeName($request, 'venue-areas.index'))
            ->with('success', 'Venue area created successfully.');
    }

    public function update(UpdateServiceTypeRequest $request, ServiceType $serviceType): RedirectResponse
    {
        $actor = $request->user();
        $original = $serviceType->getOriginal();

        $updated = $this->serviceTypes->update($serviceType, $request->validated());

        $changes = [];

        foreach ($updated->getAttributes() as $field => $newVal) {
            if (! array_key_exists($field, $original)) {
                continue;
            }

            $oldVal = $original[$field];

            if ($oldVal == $newVal) {
                continue;
            }

            $changes[$field] = [$oldVal, $newVal];
        }

        if ($actor) {
            $this->notifications->serviceTypeUpdated($updated, $actor, $changes);
        }

        return redirect()
            ->route(WorkspacePage::routeName($request, 'venue-areas.index'))
            ->with('success', 'Venue area updated successfully.');
    }

    public function destroy(Request $request, ServiceType $serviceType): RedirectResponse
    {
        if ($request->user()) {
            $this->notifications->serviceTypeDeleted($serviceType, $request->user());
        }

        $this->serviceTypes->delete($serviceType);

        return redirect()
            ->route(WorkspacePage::routeName($request, 'venue-areas.index'))
            ->with('success', 'Venue area deleted successfully.');
    }
}
