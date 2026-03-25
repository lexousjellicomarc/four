import React, { useState } from 'react';
import { router } from '@inertiajs/react';

interface UserItem {
  id: number;
  name: string | null;
  email: string;
  role: string | null;
}

interface PageProps {
  users: UserItem[];
  availableRoles: string[];
}

const RolesPage: React.FC<PageProps> = ({ users, availableRoles }) => {
  const [localRoles, setLocalRoles] = useState<Record<number, string>>(
    Object.fromEntries(users.map((u) => [u.id, u.role ?? '']))
  );

  const handleChange = (userId: number, selected: string) => {
    setLocalRoles((prev) => ({ ...prev, [userId]: selected }));
  };

  const submit = (userId: number) => {
    router.put(
      `/users/${userId}/roles`,
      { role: localRoles[userId] || '' },
      {
        preserveScroll: true,
      }
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Role Assignment</h1>
      <p className="text-sm text-gray-600">Manage user roles. Only one role is allowed per user.</p>
      <div className="overflow-x-auto rounded-md border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2 font-medium">User</th>
              <th className="p-2 font-medium">Email</th>
              <th className="p-2 font-medium">Role</th>
              <th className="p-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.name || '—'}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2 align-top">
                  <select
                    value={localRoles[u.id] || ''}
                    onChange={(e) => handleChange(u.id, e.target.value)}
                    className="min-w-[180px] rounded border px-2 py-2 text-sm focus:outline-none focus:ring"
                  >
                    <option value="">No role</option>
                    {availableRoles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => submit(u.id)}
                    className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 focus:outline-none"
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RolesPage;
