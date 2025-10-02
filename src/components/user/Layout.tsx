import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function UserLayout() {
  return (
    <div className="min-h-screen w-full grid grid-cols-[260px_1fr]" style={{ background: 'radial-gradient(1200px 800px at 70% 0%, rgba(166,77,121,0.15), transparent 60%), radial-gradient(800px 600px at 0% 100%, rgba(106,30,85,0.15), transparent 60%)', backgroundColor: '#120f16' }}>
      <aside className="h-screen sticky top-0 bg-[#131022] text-white/90">
        <div className="px-6 py-6 flex items-center gap-3 border-b border-white/10">
          <img src="/logo.png" alt="VoxJobs" className="w-16 h-16 rounded-md object-contain" />
          <div>
            <div className="text-2xl font-bold">VoxJobs</div>
            <div className="text-xs text-white/60">Job Seeker</div>
          </div>
        </div>
        <nav className="px-4 py-4 space-y-2">
          <NavItem to="." label="Dashboard" />
          <NavItem to="jobs" label="Browse Jobs" />
          <NavItem to="saved" label="Saved Jobs" />
        </nav>
        <button onClick={() => (window.location.href = '/')} className="mt-auto w-full text-left px-4 py-6 text-sm text-white/80 hover:text-white/100">Logout</button>
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
          isActive ? 'bg-[#2a2040] text-white' : 'text-white/80 hover:text-white hover:bg-white/5'
        }`
      }
    >
      {label}
    </NavLink>
  );
}


