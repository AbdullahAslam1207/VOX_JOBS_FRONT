import React from 'react';
import { Link } from 'react-router-dom';

export default function UserDashboard() {
  return (
    <div className="p-6 md:p-8 text-white/90">
      <h1 className="text-xl md:text-2xl font-semibold mb-5">Welcome back</h1>

      <div className="grid md:grid-cols-3 gap-5 mb-6">
        {[{ t: 'Saved Jobs', v: '8' }, { t: 'Applications', v: '3' }].map((m) => (
          <div key={m.t} className="rounded-xl p-5 border border-white/10" style={{ background: 'linear-gradient(160deg, rgba(106,30,85,0.25), rgba(19,16,34,0.6))' }}>
            <div className="text-xs text-white/70">{m.t}</div>
            <div className="text-2xl font-bold leading-tight">{m.v}</div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl p-6 border border-white/10" style={{ background: 'linear-gradient(160deg, rgba(19,16,34,0.7), rgba(19,16,34,0.4))' }}>
        <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <a href="/user/jobs" className="px-5 py-2.5 rounded-full font-semibold text-sm" style={{ backgroundColor: '#6A1E55', color: 'white' }}>Find Jobs</a>
          <Link to="/user/settings" className="px-5 py-2.5 rounded-full font-semibold text-sm bg-white/10 hover:bg-white/15 transition-colors">Update Profile</Link>
        </div>
      </section>
    </div>
  );
}


