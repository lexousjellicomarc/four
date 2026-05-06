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

export default function UserDashboard() {
  const { props } = usePage<PageProps>();

  return (
    <RoleDashboardTemplate
      role="user"
      workspaceStats={props.workspaceStats}
      recentBookings={props.recentBookings}
      todaySchedule={props.todaySchedule}
      workspaceSummary={props.workspaceSummary}
    />
  );
}
