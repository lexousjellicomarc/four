<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;
use Throwable;

class BcccProductionCheckCommand extends Command
{
    protected $signature = 'bccc:production-check
        {--json : Output machine-readable JSON instead of tables}
        {--strict : Treat warnings as failures}';

    protected $description = 'Run deployment-readiness checks for BCCC EASE before pushing to production hosting.';

    /** @var array<int, array{level: string, check: string, detail: string}> */
    private array $results = [];

    public function handle(): int
    {
        $this->results = [];

        $this->checkEnvironment();
        $this->checkStorage();
        $this->checkBuildAssets();
        $this->checkRoutes();
        $this->checkDatabase();
        $this->checkCommandSignatures();

        if ($this->option('json')) {
            $this->line(json_encode([
                'status' => $this->hasFailures() ? 'failed' : 'passed',
                'strict' => (bool) $this->option('strict'),
                'checked_at' => now()->toIso8601String(),
                'results' => $this->results,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } else {
            $this->newLine();
            $this->info('BCCC EASE Production Check');
            $this->table(['Level', 'Check', 'Detail'], $this->results);
        }

        if ($this->hasFailures()) {
            $this->error('Production check failed. Resolve ERROR items before deployment.');

            return self::FAILURE;
        }

        if ($this->hasWarnings()) {
            $this->warn('Production check completed with warnings. Review warnings before deployment.');
        } else {
            $this->info('Production check passed.');
        }

        return self::SUCCESS;
    }

    private function checkEnvironment(): void
    {
        $this->add(config('app.key') ? 'ok' : 'error', 'APP_KEY', config('app.key') ? 'Application key is configured.' : 'APP_KEY is missing. Run php artisan key:generate.');
        $this->add(config('app.url') ? 'ok' : 'warning', 'APP_URL', config('app.url') ? 'APP_URL is configured as ' . config('app.url') : 'APP_URL is empty. Set the final domain URL before deployment.');

        if (app()->environment('production')) {
            $this->add(config('app.debug') ? 'error' : 'ok', 'APP_DEBUG', config('app.debug') ? 'APP_DEBUG must be false in production.' : 'APP_DEBUG is false.');
        } else {
            $this->add('warning', 'APP_ENV', 'Current APP_ENV is ' . app()->environment() . '. This is acceptable locally, but production should use APP_ENV=production.');
        }
    }

    private function checkStorage(): void
    {
        $storagePaths = [
            storage_path('logs'),
            storage_path('framework/cache'),
            storage_path('framework/sessions'),
            storage_path('framework/views'),
        ];

        foreach ($storagePaths as $path) {
            $this->add(is_writable($path) ? 'ok' : 'error', 'Writable storage', $path . (is_writable($path) ? ' is writable.' : ' is not writable.'));
        }

        $publicStorage = public_path('storage');
        $this->add(File::exists($publicStorage) ? 'ok' : 'warning', 'Public storage link', File::exists($publicStorage) ? 'public/storage exists.' : 'public/storage is missing. Run php artisan storage:link if uploads must be public.');
    }

    private function checkBuildAssets(): void
    {
        $manifest = public_path('build/manifest.json');
        $this->add(File::exists($manifest) ? 'ok' : 'warning', 'Vite manifest', File::exists($manifest) ? 'public/build/manifest.json exists.' : 'Vite manifest is missing. Run npm run build before production deployment.');

        $hot = public_path('hot');
        $this->add(File::exists($hot) ? 'warning' : 'ok', 'Vite hot file', File::exists($hot) ? 'public/hot exists. Remove it before production deployment.' : 'No public/hot dev file detected.');
    }

    private function checkRoutes(): void
    {
        $required = [
            'home',
            'calendar',
            'public.availability-check',
            'admin.dashboard',
            'admin.bookings.index',
            'admin.venue-areas.index',
            'admin.rental-options.index',
            'admin.users.index',
            'user.dashboard',
            'user.calendar',
            'user.bookings.index',
            'user.bookings.create',
        ];

        foreach ($required as $name) {
            $this->add(Route::has($name) ? 'ok' : 'error', 'Route ' . $name, Route::has($name) ? 'Route is registered.' : 'Route is missing.');
        }
    }

    private function checkDatabase(): void
    {
        try {
            DB::connection()->getPdo();
            $this->add('ok', 'Database connection', 'Database connection succeeded.');
        } catch (Throwable $exception) {
            $this->add('error', 'Database connection', $exception->getMessage());

            return;
        }

        $tables = [
            'users',
            'service_types',
            'services',
            'bookings',
            'booking_payments',
            'calendar_blocks',
            'inquiries',
        ];

        foreach ($tables as $table) {
            $exists = DB::getSchemaBuilder()->hasTable($table);
            $this->add($exists ? 'ok' : 'error', 'Database table ' . $table, $exists ? 'Table exists.' : 'Table is missing. Run php artisan migrate.');
        }

        if (DB::getSchemaBuilder()->hasTable('bookings')) {
            foreach (['booking_status', 'payment_status', 'expired_at'] as $column) {
                $exists = DB::getSchemaBuilder()->hasColumn('bookings', $column);
                $this->add($exists ? 'ok' : 'error', 'bookings.' . $column, $exists ? 'Column exists.' : 'Column is missing.');
            }
        }

        if (DB::getSchemaBuilder()->hasTable('booking_payments')) {
            $exists = DB::getSchemaBuilder()->hasColumn('booking_payments', 'status');
            $this->add($exists ? 'ok' : 'error', 'booking_payments.status', $exists ? 'Column exists.' : 'Column is missing.');
        }
    }

    private function checkCommandSignatures(): void
    {
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

        $this->add($duplicates === [] ? 'ok' : 'error', 'Console command signatures', $duplicates === [] ? 'No duplicate console command signatures detected.' : 'Duplicate signatures: ' . implode(', ', array_keys($duplicates)));
    }

    private function add(string $level, string $check, string $detail): void
    {
        if ($this->option('strict') && $level === 'warning') {
            $level = 'error';
        }

        $this->results[] = [
            'level' => strtoupper($level),
            'check' => $check,
            'detail' => $detail,
        ];
    }

    private function hasFailures(): bool
    {
        return collect($this->results)->contains(fn (array $row): bool => $row['level'] === 'ERROR');
    }

    private function hasWarnings(): bool
    {
        return collect($this->results)->contains(fn (array $row): bool => $row['level'] === 'WARNING');
    }
}
