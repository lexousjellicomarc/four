<?php

namespace App\Console\Commands;

use App\Services\BookingService;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class SyncBookingLifecycleStatuses extends Command
{
    protected $signature = 'bookings:sync-statuses {--quiet-report : Suppress per-item output}';

    protected $description = 'Legacy-safe alias for booking lifecycle status synchronization without duplicating the bookings:sync-lifecycle signature.';

    public function handle(BookingService $bookings, NotificationService $notifications): int
    {
        $summary = $bookings->runAutomatedLifecycleMaintenance();

        $changed = (int) ($summary['changed_count'] ?? 0);
        $deleted = (int) ($summary['deleted_count'] ?? 0);

        if ($changed > 0 || $deleted > 0) {
            $notifications->bookingLifecycleMaintenanceReport($summary);
        }

        $this->info(sprintf(
            'Booking lifecycle maintenance complete. %d status update(s), %d auto-delete(s).',
            $changed,
            $deleted,
        ));

        if (! $this->option('quiet-report')) {
            foreach (($summary['synced'] ?? []) as $row) {
                $this->line(sprintf(
                    '#%s %s: %s → %s (%s)',
                    $row['booking_id'] ?? '-',
                    $row['client_name'] ?? 'Client',
                    $row['from_status'] ?? '-',
                    $row['to_status'] ?? '-',
                    $row['scheduled_at'] ?? '-',
                ));
            }

            foreach (($summary['deleted'] ?? []) as $row) {
                $this->warn(sprintf(
                    'Deleted #%s %s (%s)',
                    $row['booking_id'] ?? '-',
                    $row['client_name'] ?? 'Client',
                    $row['scheduled_at'] ?? '-',
                ));
            }
        }

        return self::SUCCESS;
    }
}
