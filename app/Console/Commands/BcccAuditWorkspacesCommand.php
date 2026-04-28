<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

class BcccAuditWorkspacesCommand extends Command
{
    protected $signature = 'bccc:audit-workspaces';

    protected $description = 'Audit BCCC EASE role routes, Inertia pages, support files, and legacy cleanup readiness.';

    public function handle(): int
    {
        $this->newLine();
        $this->info('BCCC EASE Workspace Audit');
        $this->line('Checking role routes, Inertia pages, support files, and legacy cleanup readiness...');
        $this->newLine();

        $failed = false;

        $failed = $this->checkRoutes() || $failed;
        $failed = $this->checkDuplicateRouteNames() || $failed;
        $failed = $this->checkPages() || $failed;
        $failed = $this->checkSupportFiles() || $failed;
        $failed = $this->checkLegacyPages() || $failed;

        $this->newLine();

        if ($failed) {
            $this->error('Audit completed with issues. Fix the failed items before deleting legacy files.');
            return self::FAILURE;
        }

        $this->info('Audit passed. Workspace routing and page organization look stable.');
        return self::SUCCESS;
    }

    private function checkRoutes(): bool
    {
        $this->line('1) Checking required named routes...');

        $required = [
            'admin.dashboard',
            'admin.calendar',
            'admin.bookings.index',
            'admin.bookings.create',
            'admin.bookings.show',
            'admin.bookings.edit',
            'admin.venue-areas.index',
            'admin.rental-options.index',
            'admin.users.index',
            'admin.users.roles',
            'admin.payments.review',
            'admin.reports.mice-registry',

            'manager.dashboard',
            'manager.calendar',
            'manager.bookings.index',
            'manager.bookings.show',
            'manager.bookings.edit',
            'manager.payments.review',
            'manager.reports.mice-registry',

            'staff.dashboard',
            'staff.calendar',
            'staff.bookings.index',
            'staff.bookings.create',
            'staff.bookings.show',
            'staff.bookings.edit',

            'user.dashboard',
            'user.bookings.create',
            'user.bookings.store',
            'user.bookings.index',
            'user.bookings.show',
            'user.bookings.edit',
        ];

        $rows = [];
        $failed = false;

        foreach ($required as $name) {
            $exists = Route::has($name);

            if (! $exists) {
                $failed = true;
            }

            $rows[] = [
                $exists ? 'OK' : 'MISSING',
                $name,
            ];
        }

        $this->table(['Status', 'Route Name'], $rows);

        return $failed;
    }

    private function checkDuplicateRouteNames(): bool
    {
        $this->line('2) Checking duplicate route names...');

        $counts = [];

        foreach (Route::getRoutes() as $route) {
            $name = $route->getName();

            if (! $name) {
                continue;
            }

            $counts[$name] = ($counts[$name] ?? 0) + 1;
        }

        $duplicates = array_filter($counts, fn (int $count) => $count > 1);

        if (empty($duplicates)) {
            $this->info('No duplicate route names detected.');
            return false;
        }

        $rows = [];

        foreach ($duplicates as $name => $count) {
            $rows[] = [$name, $count];
        }

        $this->table(['Route Name', 'Count'], $rows);
        $this->error('Duplicate route names detected. Remove duplicate legacy route names.');

        return true;
    }

    private function checkPages(): bool
    {
        $this->line('3) Checking required Inertia pages...');

        $required = [
            'resources/js/pages/admin/dashboard.tsx',
            'resources/js/pages/admin/calendar/index.tsx',
            'resources/js/pages/admin/bookings/index.tsx',
            'resources/js/pages/admin/bookings/create.tsx',
            'resources/js/pages/admin/bookings/show.tsx',
            'resources/js/pages/admin/bookings/edit.tsx',
            'resources/js/pages/admin/venue-areas/index.tsx',
            'resources/js/pages/admin/rental-options/index.tsx',
            'resources/js/pages/admin/users/index.tsx',
            'resources/js/pages/admin/reports/mice-registry/index.tsx',

            'resources/js/pages/manager/dashboard.tsx',
            'resources/js/pages/manager/calendar/index.tsx',
            'resources/js/pages/manager/bookings/index.tsx',
            'resources/js/pages/manager/bookings/show.tsx',
            'resources/js/pages/manager/bookings/edit.tsx',
            'resources/js/pages/manager/reports/mice-registry/index.tsx',

            'resources/js/pages/staff/dashboard.tsx',
            'resources/js/pages/staff/calendar/index.tsx',
            'resources/js/pages/staff/bookings/index.tsx',
            'resources/js/pages/staff/bookings/create.tsx',
            'resources/js/pages/staff/bookings/show.tsx',
            'resources/js/pages/staff/bookings/edit.tsx',

            'resources/js/pages/user/dashboard.tsx',
            'resources/js/pages/user/bookings/index.tsx',
            'resources/js/pages/user/bookings/create.tsx',
            'resources/js/pages/user/bookings/show.tsx',
            'resources/js/pages/user/bookings/edit.tsx',
            'resources/js/pages/user/bookings/survey.tsx',
        ];

        $rows = [];
        $failed = false;

        foreach ($required as $path) {
            $exists = File::exists(base_path($path));

            if (! $exists) {
                $failed = true;
            }

            $rows[] = [
                $exists ? 'OK' : 'MISSING',
                $path,
            ];
        }

        $this->table(['Status', 'File'], $rows);

        return $failed;
    }

    private function checkSupportFiles(): bool
    {
        $this->line('4) Checking required support files...');

        $required = [
            'app/Support/WorkspacePage.php',
            'app/Support/WorkspaceAccess.php',
            'app/Http/Controllers/WorkspaceHomeController.php',
            'app/Http/Controllers/WorkspaceLegacyRedirectController.php',

            'resources/js/lib/role-theme.ts',
            'resources/js/lib/role-workspaces.ts',
            'resources/js/lib/role-ui.ts',
            'resources/js/lib/booking-role-ui.ts',
            'resources/js/lib/calendar-role-ui.ts',
            'resources/js/lib/admin-resource-ui.ts',
            'resources/js/lib/feedback.ts',

            'resources/js/components/role/role-workspace-shell.tsx',
            'resources/js/components/bookings/booking-list-page.tsx',
            'resources/js/components/bookings/booking-show-page.tsx',
            'resources/js/components/bookings/booking-form-page.tsx',
            'resources/js/components/calendar/role-calendar-page.tsx',
            'resources/js/components/ui/global-feedback-layer.tsx',
            'resources/js/components/ui/confirm-action.tsx',
        ];

        $rows = [];
        $failed = false;

        foreach ($required as $path) {
            $exists = File::exists(base_path($path));

            if (! $exists) {
                $failed = true;
            }

            $rows[] = [
                $exists ? 'OK' : 'MISSING',
                $path,
            ];
        }

        $this->table(['Status', 'File'], $rows);

        return $failed;
    }

    private function checkLegacyPages(): bool
    {
        $this->line('5) Checking legacy root page folders...');

        $legacy = [
            'resources/js/pages/bookings',
            'resources/js/pages/calendar',
            'resources/js/pages/payments',
            'resources/js/pages/reports',
            'resources/js/pages/services',
            'resources/js/pages/service-types',
            'resources/js/pages/users',
        ];

        $rows = [];

        foreach ($legacy as $path) {
            $exists = File::exists(base_path($path));
            $count = 0;

            if ($exists) {
                $count = count(File::allFiles(base_path($path)));
            }

            $rows[] = [
                $exists ? 'PRESENT' : 'REMOVED',
                $count,
                $path,
            ];
        }

        $this->table(['Status', 'File Count', 'Legacy Folder'], $rows);

        $this->warn('Legacy root folders may still be needed if role pages import them as aliases.');
        $this->warn('Do not delete them until npm run build passes and search shows no remaining imports.');

        return false;
    }
}
