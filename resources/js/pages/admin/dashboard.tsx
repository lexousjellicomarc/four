import { RoleDashboardTemplate } from '@/components/role/role-dashboard-template';
import { usePage } from '@inertiajs/react';

type PageProps = {
  workspaceStats?: Record<string, number>;
  recentBookings?: Array<Record<string, any>>;
  todaySchedule?: Array<Record<string, any>>;
  workspaceSummary?: {
    eyebrow?: string;
    title?: string;
    description?: string;
  };
};

export default function AdminDashboard() {
  const { props } = usePage<PageProps>();

  return (
    <RoleDashboardTemplate
      role="admin"
      workspaceStats={props.workspaceStats}
      recentBookings={props.recentBookings as any}
      todaySchedule={props.todaySchedule as any}
      workspaceSummary={props.workspaceSummary}
    />
  );
}
