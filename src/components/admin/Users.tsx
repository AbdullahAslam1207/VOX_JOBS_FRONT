import React, { useEffect, useMemo, useState } from 'react';
import { getAllUsers, type UserListItemResponse } from '../../api';

export default function AdminUsers() {
  const [users, setUsers] = useState<UserListItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getAllUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err?.message || 'Unable to load users.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      return [user.fullname, user.email, user.role]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(q));
    });
  }, [users, query]);

  return (
    <div className="p-6 md:p-8 text-white/90">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <h1 className="text-xl md:text-2xl font-semibold">All Users</h1>
        <div className="text-sm text-white/70">Total: {filteredUsers.length}</div>
      </div>

      <div className="rounded-xl p-3 border border-white/10 bg-white/5 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or role"
          className="w-full rounded-md bg-transparent border border-white/10 px-3 py-2 text-sm text-white placeholder-white/40 outline-none"
        />
      </div>

      {loading && <div className="text-white/70 mb-3">Loading users...</div>}
      {error && <div className="text-red-200 bg-red-900/20 border border-red-400/30 rounded-md p-3 mb-3">{error}</div>}

      {!loading && !error && (
        <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5">
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full text-sm">
              <thead className="bg-white/10 text-white/80">
                <tr>
                  <th className="text-left px-3 py-2">ID</th>
                  <th className="text-left px-3 py-2">Full Name</th>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">Role</th>
                  <th className="text-left px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.user_id} className="border-t border-white/10">
                    <td className="px-3 py-2 text-white/80">{user.user_id}</td>
                    <td className="px-3 py-2 text-white">{user.fullname}</td>
                    <td className="px-3 py-2 text-white/80">{user.email}</td>
                    <td className="px-3 py-2 text-white/70">{user.role}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          user.is_active ? 'bg-emerald-600/30 text-emerald-200' : 'bg-red-600/30 text-red-200'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-white/60">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
