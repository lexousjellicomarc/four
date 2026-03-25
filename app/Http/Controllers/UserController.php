<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function __construct(private readonly NotificationService $notifications)
    {
    }

    public function index(Request $request): Response
    {
        $query = User::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->whereHas('roles', function ($q) use ($role) {
                $q->where('name', $role);
            });
        }

        $users = $query->with('roles')
            ->orderByDesc('id')
            ->paginate(10)
            ->through(function (User $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'role' => $user->roles->pluck('name')->first(),
                    'created_at' => $user->created_at?->format('Y-m-d H:i:s'),
                ];
            });

        $availableRoles = Role::query()->pluck('name')->all();

        return Inertia::render('users/index', [
            'users' => $users,
            'availableRoles' => $availableRoles,
            'filters' => [
                'search' => $request->input('search'),
                'role' => $request->input('role'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('users/create', [
            'availableRoles' => Role::query()->pluck('name')->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $actor = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::defaults(), 'confirmed'],
            'role' => ['nullable', 'string', 'exists:roles,name'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $oldRoles = [];
        $newRoles = [];

        if (! empty($data['role'])) {
            $user->syncRoles([$data['role']]);
            $newRoles = [$data['role']];
        } else {
            $user->syncRoles([]);
        }

        if ($actor) {
            $this->notifications->userCreated($user, $actor);

            if (! empty($newRoles)) {
                $this->notifications->userRolesUpdated($user, $actor, $oldRoles, $newRoles);
            }
        }

        return redirect()->route('users.index')
            ->with('success', 'User created successfully.');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('users/edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles->pluck('name')->first(),
                'created_at' => $user->created_at?->format('Y-m-d H:i:s'),
            ],
            'availableRoles' => Role::query()->pluck('name')->all(),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $actor = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'password' => ['nullable', 'string', Password::defaults(), 'confirmed'],
            'role' => ['nullable', 'string', 'exists:roles,name'],
        ]);

        $original = $user->getOriginal();
        $oldRoles = $user->roles->pluck('name')->all();

        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
        ]);

        if (! empty($data['password'])) {
            $user->update([
                'password' => Hash::make($data['password']),
            ]);
        }

        if (! empty($data['role'])) {
            $user->syncRoles([$data['role']]);
        } else {
            $user->syncRoles([]);
        }

        $user->refresh();
        $newRoles = $user->roles->pluck('name')->all();

        $changes = [];
        foreach ($user->getAttributes() as $field => $newVal) {
            if (! array_key_exists($field, $original)) {
                continue;
            }

            $oldVal = $original[$field];
            if ($oldVal == $newVal) {
                continue;
            }

            if (in_array($field, ['password', 'remember_token'], true)) {
                $changes[$field] = ['(hidden)', '(hidden)'];
                continue;
            }

            $changes[$field] = [$oldVal, $newVal];
        }

        if ($actor) {
            $this->notifications->userUpdated($user, $actor, $changes);

            $oldSorted = $oldRoles;
            $newSorted = $newRoles;
            sort($oldSorted);
            sort($newSorted);

            if ($oldSorted !== $newSorted) {
                $this->notifications->userRolesUpdated($user, $actor, $oldRoles, $newRoles);
            }
        }

        return redirect()->route('users.index')
            ->with('success', 'User updated successfully.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        if ($request->user()) {
            $this->notifications->userDeleted($user, $request->user());
        }

        $user->delete();

        return redirect()->route('users.index')
            ->with('success', 'User deleted successfully.');
    }
}
