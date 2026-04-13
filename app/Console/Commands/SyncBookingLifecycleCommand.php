<?php

namespace App\Console\Commands;

use App\Services\BookingService;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class SyncBookingLifecycleCommand extends Command
{
    protected $signature = 'bookings:sync-lifecycle {--quiet-report : Suppress per-item output}';

    protected $description = 'Run booking lifecycle maintenance, enforce payment deadlines, auto-delete expired unpaid bookings, and notify admins/managers about automation results.';

    public function handle(BookingService $bookings, NotificationService $notifications): int
    {
        $result = $bookings->runAutomatedLifecycleMaintenance();

        $changed = (int) ($result['changed_count'] ?? 0);
        $deleted = (int) ($result['deleted_count'] ?? 0);
        $quiet = (bool) $this->option('quiet-report');

        if ($changed > 0 || $deleted > 0) {
            $notifications->bookingLifecycleMaintenanceReport($result);
        }

        $this->info("Lifecycle maintenance finished. Changed: {$changed}; Deleted: {$deleted}.");

        if (! $quiet) {
            foreach (($result['synced'] ?? []) as $row) {
                $this->line(sprintf(
                    '#%s %s: %s → %s (%s)',
                    $row['booking_id'] ?? '-',
                    $row['client_name'] ?? 'Client',
                    $row['from_status'] ?? '-',
                    $row['to_status'] ?? '-',
                    $row['scheduled_at'] ?? '-'
                ));
            }

            foreach (($result['deleted'] ?? []) as $row) {
                $this->warn(sprintf(
                    'Deleted #%s %s (%s)',
                    $row['booking_id'] ?? '-',
                    $row['client_name'] ?? 'Client',
                    $row['scheduled_at'] ?? '-'
                ));
            }
        }

        return self::SUCCESS;
    }
}
