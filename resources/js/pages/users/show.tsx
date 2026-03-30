import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Mail, Phone, ShieldCheck, User2 } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

type UserDetails = {
  id: number;
  name: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  email: string;
  phone_number?: string | null;
  organization_name?: string | null;
  organization_type?: string | null;
  position_title?: string | null;
  address_line1?: string | null;
  barangay?: string | null;
  city_municipality?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  role?: string | null;
  email_is_verified?: boolean;
  email_verified_at?: string | null;
  last_login_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  google_id?: string | null;
};

type Props = {
  user: UserDetails;
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function valueOrDash(value?: string | null) {
  return value && value.trim() !== '' ? value : '—';
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-1 border-b border-border/50 py-3 sm:grid-cols-[220px_1fr]">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{valueOrDash(value)}</div>
    </div>
  );
}

export default function UserShow({ user }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Users', href: '/users' },
    { title: user.name, href: `/users/${user.id}` },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`User - ${user.name}`} />

      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 rounded-2xl border bg-background p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-primary/10 p-4 text-primary">
                <User2 className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
                  <p className="text-sm text-muted-foreground">Full user account details</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                    {user.role || 'No role'}
                  </span>

                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                    user.email_is_verified
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
                      : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'
                  }`}>
                    {user.email_is_verified ? 'Verified' : 'Not verified'}
                  </span>

                  {user.google_id ? (
                    <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300">
                      Google sign-in linked
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/users" className="inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Link>

              <Link href={`/users/${user.id}/edit`} className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Mail className="h-4 w-4" /> Email
              </div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Phone className="h-4 w-4" /> Phone
              </div>
              <div className="text-sm text-muted-foreground">{valueOrDash(user.phone_number)}</div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4" /> Last Login
              </div>
              <div className="text-sm text-muted-foreground">{formatDate(user.last_login_at)}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-background p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>
            <InfoRow label="First Name" value={user.first_name} />
            <InfoRow label="Middle Name" value={user.middle_name} />
            <InfoRow label="Last Name" value={user.last_name} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Phone Number" value={user.phone_number} />
            <InfoRow label="Role" value={user.role} />
            <InfoRow label="Email Verification" value={user.email_is_verified ? 'Verified' : 'Not verified'} />
            <InfoRow label="Google Account" value={user.google_id ? 'Linked' : 'Not linked'} />
          </div>

          <div className="rounded-2xl border bg-background p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Organization</h2>
            <InfoRow label="Organization Name" value={user.organization_name} />
            <InfoRow label="Organization Type" value={user.organization_type} />
            <InfoRow label="Position Title" value={user.position_title} />
          </div>
        </div>

        <div className="rounded-2xl border bg-background p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Address</h2>
          <InfoRow label="Address Line" value={user.address_line1} />
          <InfoRow label="Barangay" value={user.barangay} />
          <InfoRow label="City / Municipality" value={user.city_municipality} />
          <InfoRow label="Province" value={user.province} />
          <InfoRow label="Postal Code" value={user.postal_code} />
          <InfoRow label="Country" value={user.country} />
        </div>

        <div className="rounded-2xl border bg-background p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Account Timestamps</h2>
          <InfoRow label="Created At" value={formatDate(user.created_at)} />
          <InfoRow label="Updated At" value={formatDate(user.updated_at)} />
          <InfoRow label="Last Login" value={formatDate(user.last_login_at)} />
          <InfoRow label="Email Verified At" value={formatDate(user.email_verified_at)} />
        </div>
      </div>
    </AppLayout>
  );
}
