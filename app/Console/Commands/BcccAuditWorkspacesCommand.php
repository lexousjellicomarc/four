<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;
use SplFileInfo;

class BcccAuditWorkspacesCommand extends Command
{
    protected $signature = 'bccc:audit-workspaces
        {--strict : Treat legacy root workspace folders and generated files as failures}
        {--cleanup-report : Print cleanup candidates after the audit}';

    protected $description = 'Audit BCCC EASE routes, role pages, support files, command signatures, generated files, and cleanup readiness.';

    public function handle(): int
    {
        $this->newLine();
        $this->info('BCCC EASE Workspace Audit');
        $this->line('Checking role routes, Inertia pages, support files, console commands, and cleanup readiness.');
        $this->newLine();

        $failed = false;

        $failed = $this->checkRoutes() || $failed;
        $failed = $this->checkDuplicateRouteNames() || $failed;
        $failed = $this->checkPages() || $failed;
        $failed = $this->checkSupportFiles() || $failed;
        $failed = $this->checkCommandSignatures() || $failed;
        $failed = $this->checkCssShell() || $failed;
        $failed = $this->checkGeneratedFiles() || $failed;
        $failed = $this->checkLegacyPages() || $failed;

        if ($this->option('cleanup-report')) {
            $this->printCleanupReport();
        }

        $this->newLine();

        if ($failed) {
            $this->error('Audit completed with issues. Fix failed items before deployment or deletion cleanup.');

            return self::FAILURE;
        }

        $this->info('Audit passed. Workspace routing, page organization, and production safety checks look stable.');

        return self::SUCCESS;
    }

    private function checkRoutes(): bool
    {
        $this->line('1) Checking required named routes...');

        $required = [
            'home',
            'facilities',
            'events',
            'calendar',
            'contact',
            'public.availability-check',
            'public.calendar-month',

            'admin.dashboard',
            'admin.calendar',
            'admin.bookings.index',
            'admin.bookings.create',
            'admin.bookings.show',
            'admin.bookings.edit',
            'admin.venue-areas.index',
            'admin.venue-areas.create',
            'admin.venue-areas.edit',
            'admin.rental-options.index',
            'admin.rental-options.create',
            'admin.rental-options.edit',
            'admin.users.index',
            'admin.users.edit',
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
            'user.calendar',
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

            $rows[] = [$exists ? 'OK' : 'MISSING', $name];
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

        $duplicates = array_filter($counts, fn (int $count): bool => $count > 1);

        if ($duplicates === []) {
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
            'resources/js/pages/public/home.tsx',
            'resources/js/pages/public/facilities.tsx',
            'resources/js/pages/public/events.tsx',
            'resources/js/pages/public/calendar.tsx',
            'resources/js/pages/public/contact.tsx',

            'resources/js/pages/admin/dashboard.tsx',
            'resources/js/pages/admin/calendar/index.tsx',
            'resources/js/pages/admin/bookings/index.tsx',
            'resources/js/pages/admin/bookings/create.tsx',
            'resources/js/pages/admin/bookings/show.tsx',
            'resources/js/pages/admin/bookings/edit.tsx',
            'resources/js/pages/admin/venue-areas/index.tsx',
            'resources/js/pages/admin/rental-options/index.tsx',
            'resources/js/pages/admin/users/index.tsx',
            'resources/js/pages/admin/users/edit.tsx',
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
            'resources/js/pages/user/calendar/index.tsx',
            'resources/js/pages/user/bookings/index.tsx',
            'resources/js/pages/user/bookings/create.tsx',
            'resources/js/pages/user/bookings/show.tsx',
            'resources/js/pages/user/bookings/edit.tsx',
            'resources/js/pages/user/bookings/survey.tsx',
        ];

        return $this->checkFileList($required, ['Status', 'File'], 'MISSING');
    }

    private function checkSupportFiles(): bool
    {
        $this->line('4) Checking required support files...');

        $required = [
            'app/Models/PublicInquiry.php',
            'app/Support/BookingStatusCatalog.php',
            'app/Support/VenueAreaCatalog.php',
            'app/Support/WorkspacePage.php',
            'app/Support/WorkspaceAccess.php',
            'app/Http/Controllers/WorkspaceHomeController.php',
            'app/Http/Controllers/WorkspaceCalendarController.php',
            'app/Http/Controllers/WorkspaceLegacyRedirectController.php',
            'app/Http/Controllers/PublicAvailabilityController.php',

            'resources/css/bccc-system.css',
            'resources/css/bccc-batch5-responsive-sticky.css',
            'resources/css/bccc-batch6-shell-consolidation.css',

            'resources/js/lib/role-theme.ts',
            'resources/js/lib/role-workspaces.ts',
            'resources/js/lib/role-ui.ts',
            'resources/js/lib/booking-role-ui.ts',
            'resources/js/lib/calendar-role-ui.ts',
            'resources/js/lib/admin-resource-ui.ts',
            'resources/js/lib/booking-venue-catalog.ts',
            'resources/js/lib/public-availability.ts',
            'resources/js/lib/feedback.ts',

            'resources/js/components/role/role-workspace-shell.tsx',
            'resources/js/components/bookings/booking-list-page.tsx',
            'resources/js/components/bookings/booking-show-page.tsx',
            'resources/js/components/bookings/booking-form-page.tsx',
            'resources/js/components/calendar/role-calendar-page.tsx',
            'resources/js/components/ui/global-feedback-layer.tsx',
            'resources/js/components/ui/confirm-action.tsx',
        ];

        return $this->checkFileList($required, ['Status', 'File'], 'MISSING');
    }

    private function checkCommandSignatures(): bool
    {
        $this->line('5) Checking duplicate console command signatures...');

        $files = File::glob(app_path('Console/Commands/*.php'));
        $signatures = [];

        foreach ($files as $file) {
            $contents = File::get($file);

            if (! preg_match('/protected\s+\$signature\s*=\s*[\'\"]([^\'\"]+)/', $contents, $match)) {
                continue;
            }

            $signature = trim(preg_split('/\s+/', $match[1])[0] ?? $match[1]);
            $signatures[$signature][] = str_replace(base_path() . DIRECTORY_SEPARATOR, '', $file);
        }

        $duplicates = array_filter($signatures, fn (array $paths): bool => count($paths) > 1);

        if ($duplicates === []) {
            $this->info('No duplicate console command signatures detected.');

            return false;
        }

        $rows = [];

        foreach ($duplicates as $signature => $paths) {
            $rows[] = [$signature, implode(PHP_EOL, $paths)];
        }

        $this->table(['Signature', 'Files'], $rows);
        $this->error('Duplicate console command signatures detected.');

        return true;
    }

    private function checkCssShell(): bool
    {
        $this->line('6) Checking consolidated CSS shell imports...');

        $app = base_path('resources/js/app.tsx');
        $system = base_path('resources/css/bccc-system.css');
        $failed = false;
        $rows = [];

        $appImportsSystem = File::exists($app) && str_contains(File::get($app), '../css/bccc-system.css');
        $systemExists = File::exists($system);

        $rows[] = [$appImportsSystem ? 'OK' : 'MISSING', 'resources/js/app.tsx imports ../css/bccc-system.css'];
        $rows[] = [$systemExists ? 'OK' : 'MISSING', 'resources/css/bccc-system.css exists'];

        if (! $appImportsSystem || ! $systemExists) {
            $failed = true;
        }

        if ($systemExists) {
            preg_match_all('/@import\s+[\'\"]([^\'\"]+)[\'\"]/', File::get($system), $matches);

            foreach ($matches[1] as $import) {
                $path = base_path('resources/css/' . ltrim($import, './'));
                $exists = File::exists($path);
                $rows[] = [$exists ? 'OK' : 'MISSING', 'resources/css/' . ltrim($import, './')];

                if (! $exists) {
                    $failed = true;
                }
            }
        }

        $this->table(['Status', 'CSS Check'], $rows);

        return $failed;
    }

    private function checkGeneratedFiles(): bool
    {
        $this->line('7) Checking generated Wayfinder folders...');

        $paths = [
            'resources/js/actions',
            'resources/js/routes',
            'resources/js/wayfinder',
        ];

        $rows = [];
        $failed = false;

        foreach ($paths as $path) {
            $exists = File::exists(base_path($path));
            $count = $exists ? count(File::allFiles(base_path($path))) : 0;
            $status = $exists && $count > 0 ? 'GENERATED' : 'EMPTY/ABSENT';

            if ($this->option('strict') && $exists && $count > 0) {
                $failed = true;
                $status = 'STRICT FAIL';
            }

            $rows[] = [$status, $count, $path];
        }

        $this->table(['Status', 'File Count', 'Generated Folder'], $rows);
        $this->warn('Generated Wayfinder folders are safe locally but should stay gitignored.');

        return $failed;
    }

    private function checkLegacyPages(): bool
    {
        $this->line('8) Checking legacy root page folders...');

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
        $failed = false;

        foreach ($legacy as $path) {
            $exists = File::exists(base_path($path));
            $count = $exists ? count(File::allFiles(base_path($path))) : 0;
            $status = $exists ? 'PRESENT' : 'REMOVED';

            if ($this->option('strict') && $exists && $count > 0) {
                $failed = true;
                $status = 'STRICT REVIEW';
            }

            $rows[] = [$status, $count, $path];
        }

        $this->table(['Status', 'File Count', 'Legacy Folder'], $rows);
        $this->warn('Legacy root folders may still be imported by role pages. Move them only after npm run build passes and search confirms no imports.');

        return $failed;
    }

    /**
     * @param  array<int, string>  $files
     * @param  array<int, string>  $headers
     */
    private function checkFileList(array $files, array $headers, string $missingLabel): bool
    {
        $rows = [];
        $failed = false;

        foreach ($files as $path) {
            $exists = File::exists(base_path($path));

            if (! $exists) {
                $failed = true;
            }

            $rows[] = [$exists ? 'OK' : $missingLabel, $path];
        }

        $this->table($headers, $rows);

        return $failed;
    }

    private function printCleanupReport(): void
    {
        $this->newLine();
        $this->line('Cleanup report');

        $candidates = [
            'resources/js/components/admin-resource/_archive_old' => 'Old TSX archive already excluded from TypeScript.',
            'resources/css/_archive_backend_old' => 'Old backend CSS archive; keep outside active imports.',
            'resources/js/actions' => 'Generated by Wayfinder; keep gitignored.',
            'resources/js/routes' => 'Generated by Wayfinder; keep gitignored.',
            'public/build' => 'Generated by Vite build; do not commit unless your hosting needs uploaded build assets.',
            'vendor' => 'Generated by Composer; never commit.',
            'node_modules' => 'Generated by npm; never commit.',
        ];

        $rows = [];

        foreach ($candidates as $path => $reason) {
            $absolute = base_path($path);
            $exists = File::exists($absolute);
            $count = 0;

            if ($exists && File::isDirectory($absolute)) {
                $count = count(File::allFiles($absolute));
            }

            $rows[] = [$exists ? 'PRESENT' : 'ABSENT', $count, $path, $reason];
        }

        $this->table(['Status', 'File Count', 'Path', 'Reason'], $rows);
    }
}
