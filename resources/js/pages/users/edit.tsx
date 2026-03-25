import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Users', href: '/users' },
  { title: 'Edit', href: '#' },
];

type UserData = {
  id: number;
  name: string;
  email: string;
  role?: string | null;
  created_at: string;
};

interface EditUserProps {
  user: UserData;
  availableRoles: string[];
}

export default function EditUser({ user, availableRoles }: EditUserProps) {
  const { data, setData, put, processing, errors } = useForm({
    name: user.name,
    email: user.email,
    password: '',
    password_confirmation: '',
    role: user.role ?? '',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    put(`/users/${user.id}`);
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit User - ${user.name}`} />

      <div className="mx-auto max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit User</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">New Password (leave blank to keep current)</Label>
                <Input id="password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} />
                {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password_confirmation">Confirm New Password</Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  value={data.password_confirmation}
                  onChange={(e) => setData('password_confirmation', e.target.value)}
                />
                {errors.password_confirmation && <p className="text-destructive text-sm">{errors.password_confirmation}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={data.role}
                  onChange={(e) => setData('role', e.target.value)}
                  className="h-10 rounded-md border px-3"
                >
                  <option value="">No role selected</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {errors.role && <p className="text-destructive text-sm">{errors.role}</p>}
              </div>

              <div className="bg-muted rounded p-3 text-sm">
                <p className="text-muted-foreground">
                  <strong>Created:</strong> {user.created_at}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/users">Cancel</Link>
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
