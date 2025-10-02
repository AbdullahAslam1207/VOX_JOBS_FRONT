import React from 'react';
import { Briefcase, Users, FileStack, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="p-6 md:p-8 text-white/90">
      <h1 className="text-xl md:text-2xl font-semibold mb-5">Dashboard</h1>

      <div className="grid md:grid-cols-4 gap-5 mb-6">
        {[
          { title: 'Total Jobs', value: '12,456', Icon: Briefcase, color: '#6A1E55' },
          { title: 'Active Users', value: '3,247', Icon: Users, color: '#A64D79' },
          { title: 'Applications', value: '8,921', Icon: FileStack, color: '#6A1E55' },
          { title: 'Success Rate', value: '73%', Icon: CheckCircle2, color: '#A64D79' },
        ].map(({ title, value, Icon, color }) => (
          <div key={title} className="rounded-xl p-5 border border-white/10 flex items-center gap-4" style={{ background: 'linear-gradient(160deg, rgba(106,30,85,0.25), rgba(19,16,34,0.6))' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="text-xs text-white/70">{title}</div>
              <div className="text-2xl font-bold leading-tight">{value}</div>
              <div className="text-emerald-400 mt-0.5 text-xs">+8% from last month</div>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl p-8 border border-[#6A1E55]/40 mb-6" style={{ background: 'radial-gradient(1000px 600px at 50% -10%, rgba(166,77,121,0.2), transparent), linear-gradient(180deg, rgba(43,22,39,0.6), rgba(19,16,34,0.6))' }}>
        <h2 className="text-2xl font-bold text-white text-center mb-1">Job Scraping Control</h2>
        <p className="text-center text-white/70 mb-6 text-sm">Manage and monitor job data collection from various sources</p>
        <div className="flex justify-center">
          <button className="px-5 py-2.5 rounded-full font-semibold text-sm" style={{ backgroundColor: '#6A1E55', color: 'white' }}>
            Start Job Scraping
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-8 text-center">
          <Metric label="Jobs Found" value="247" />
          <Metric label="Sources" value="15" />
          <Metric label="Success Rate" value="98%" />
          <Metric label="Avg Time" value="3m" />
        </div>
      </section>

      <section className="rounded-2xl p-6 border border-white/10" style={{ background: 'linear-gradient(160deg, rgba(19,16,34,0.7), rgba(19,16,34,0.4))' }}>
        <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
        <div className="auth-scroll max-h-64 overflow-y-auto space-y-3 pr-2">
          {[
            { title: 'New job posted', sub: 'Tech Corp', time: '2 min ago' },
            { title: 'User registered', sub: 'John Doe', time: '5 min ago' },
            { title: 'Scraping completed', sub: 'LinkedIn', time: '10 min ago' },
            { title: 'System alert', sub: 'High traffic detected', time: '15 min ago' },
            { title: 'Crawler restarted', sub: 'Indeed', time: '22 min ago' },
            { title: 'Export generated', sub: 'Daily report', time: '35 min ago' },
            { title: 'Queue cleared', sub: 'Scheduler', time: '1 hr ago' },
          ].map((r) => (
            <div key={r.title} className="rounded-xl p-4 flex items-center justify-between border border-white/10 bg-white/5">
              <div>
                <div className="font-semibold text-white text-sm">{r.title}</div>
                <div className="text-white/70 text-xs">{r.sub}</div>
              </div>
              <div className="text-white/60 text-xs">{r.time}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-white/90">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-white/60 text-sm">{label}</div>
    </div>
  );
}


