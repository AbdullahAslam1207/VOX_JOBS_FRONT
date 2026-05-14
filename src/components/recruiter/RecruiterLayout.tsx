import React from 'react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { clearStoredUser, getStoredUser } from '../../api';

export default function RecruiterLayout() {
  const user = getStoredUser();

  if (!user || user.role !== 'recruiter') {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div
      className="min-h-screen w-full grid grid-cols-[280px_1fr]"
      style={{
        background:
          'radial-gradient(1200px 800px at 70% 0%, rgba(16,185,129,0.15), transparent 60%), radial-gradient(800px 600px at 0% 100%, rgba(106,30,85,0.12), transparent 60%)',
        backgroundColor: '#0d1117',
      }}
    >
      <aside className="h-screen sticky top-0 bg-[#0f172a] text-white/90 border-r border-white/10 flex flex-col">
        <div className="px-6 py-6 flex items-center gap-3 border-b border-white/10">
          <img src="/logo.png" alt="VoxJobs" className="w-16 h-16 rounded-md object-contain" />
          <div>
            <div className="text-2xl font-bold">VoxJobs</div>
            <div className="text-xs text-white/60">Recruiter Panel</div>
          </div>
        </div>
        <div className="px-6 py-5 border-b border-white/10">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">Signed in as</div>
          <div className="font-semibold">{user.company_name || user.fullname || user.email}</div>
          <div className="text-sm text-white/55">{user.email}</div>
        </div>
        <nav className="px-4 py-4 space-y-2 flex-1">
          <NavItem to="." label="Dashboard" />
          <NavItem to="create-job" label="Create Job" />
        </nav>
        <button
          onClick={() => {
            clearStoredUser();
            window.location.href = '/';
          }}
          className="w-full text-left px-6 py-5 text-sm text-white/80 hover:text-white border-t border-white/10"
        >
          Logout
        </button>
      </aside>
      <main className="min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      end
      to={to}
      className={({ isActive }) =>
        `block px-4 py-3 rounded-lg font-medium transition-colors ${
          isActive ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' : 'text-white/75 hover:text-white hover:bg-white/5'
        }`
      }
    >
      {label}
    </NavLink>
  );
}
