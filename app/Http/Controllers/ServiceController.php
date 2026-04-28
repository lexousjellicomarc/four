<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceRequest;
use App\Http\Requests\UpdateServiceRequest;
use App\Http\Resources\ServiceResource;
use App\Http\Resources\ServiceTypeResource;
use App\Models\Service;
use App\Models\ServiceType;
use App\Services\Contracts\ServiceServiceInterface;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Support\WorkspacePage;

class ServiceController extends Controller
{
    public function __construct(
        private readonly ServiceServiceInterface $services,
        private readonly NotificationService $notifications,
    ) {
    }

    public function index(Request $request): Response
    {
        $perPage = (int) $request->integer('per_page', 10);
        $paginator = $this->services->paginate($perPage);

        return Inertia::render(WorkspacePage::resolve($request, 'services/index'), [
            'workspaceRole' => WorkspacePage::role($request),
            'services' => $services,
            'rentalOptions' => $services,
            'serviceTypes' => $serviceTypes,
            'venueAreas' => $serviceTypes,
            'filters' => $request->only(['q']),
        ]);
    }

    public function store(StoreServiceRequest $request): RedirectResponse
    {
        $service = $this->services->create($request->validated());

        if ($request->user()) {
            $this->notifications->serviceCreated($service, $request->user());
        }

        return redirect()
            ->route('services.index')
            ->with('success', 'Service created successfully.');
    }

    public function update(UpdateServiceRequest $request, Service $service): RedirectResponse
    {
        $actor = $request->user();

        $original = $service->getOriginal();

        $updated = $this->services->update($service, $request->validated());

        $changes = [];
        foreach ($updated->getAttributes() as $field => $newVal) {
            if (!array_key_exists($field, $original)) {
                continue;
            }
            $oldVal = $original[$field];
            if ($oldVal == $newVal) {
                continue;
            }
            $changes[$field] = [$oldVal, $newVal];
        }

        if ($actor) {
            $this->notifications->serviceUpdated($updated, $actor, $changes);
        }

        return redirect()
            ->route('services.index')
            ->with('success', 'Service updated successfully.');
    }

    public function destroy(Request $request, Service $service): RedirectResponse
    {
        if ($request->user()) {
            $this->notifications->serviceDeleted($service, $request->user());
        }

        $this->services->delete($service);

        return redirect()
            ->route('services.index')
            ->with('success', 'Service deleted successfully.');
    }

    // Unused resource actions (kept for Route::resource compatibility)
    public function create() {}
    public function show(string $id) {}
    public function edit(string $id) {}
}
