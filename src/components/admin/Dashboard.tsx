import React, { useEffect, useState } from 'react';
import { Briefcase, Users, FileStack, CheckCircle2 } from 'lucide-react';
<<<<<<< HEAD
import { getAllJobs, startScraperAndWait, createVectorStore } from '../../api';
=======
import { getAllJobs, getJobsByCity, startScraperAndWait, createVectorStore } from '../../api';
import { Link } from 'react-router-dom';
>>>>>>> 6f783d3fa3c3bd8ab72097364a0bf8337a445d20

export default function AdminDashboard() {
  const [starting, setStarting] = useState(false);
  const [jobsCount, setJobsCount] = useState<number | null>(null);
  const [vectorStatus, setVectorStatus] = useState<'idle' | 'starting' | 'running' | 'completed' | 'failed'>('idle');
  const [vectorHttpCode, setVectorHttpCode] = useState<number | null>(null);
<<<<<<< HEAD
=======
  const [city, setCity] = useState<'Lahore' | 'Karachi' | 'Islamabad' | 'Rawalpindi'>('Lahore');
  const [cityJobs, setCityJobs] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
>>>>>>> 6f783d3fa3c3bd8ab72097364a0bf8337a445d20

  useEffect(() => {
    const load = async () => {
      try {
        const jobs = await getAllJobs();
        setJobsCount((jobs || []).length);
<<<<<<< HEAD
=======
        setAllJobs(Array.isArray(jobs) ? jobs : []);
>>>>>>> 6f783d3fa3c3bd8ab72097364a0bf8337a445d20
      } catch {}
    };
    load();
  }, []);

<<<<<<< HEAD
=======
  useEffect(() => {
    const load = async () => {
      try {
        const jobs = await getJobsByCity(city);
        setCityJobs(Array.isArray(jobs) ? jobs : jobs?.jobs || []);
      } catch {}
    };
    load();
  }, [city]);

>>>>>>> 6f783d3fa3c3bd8ab72097364a0bf8337a445d20
  const startScraper = async () => {
    try {
      setStarting(true);
      await startScraperAndWait();
<<<<<<< HEAD
      // Refresh jobs after scraper completes
      const jobs = await getAllJobs();
      setJobsCount((jobs || []).length);
=======
      const jobs = await getAllJobs();
      setJobsCount((jobs || []).length);
      setAllJobs(Array.isArray(jobs) ? jobs : []);
      const cityData = await getJobsByCity(city);
      setCityJobs(Array.isArray(cityData) ? cityData : cityData?.jobs || []);
>>>>>>> 6f783d3fa3c3bd8ab72097364a0bf8337a445d20
    } finally {
      setStarting(false);
    }
  };

  const generateVectorStore = async () => {
    try {
      setVectorStatus('starting');
<<<<<<< HEAD
      console.log('Vector store creation: starting');
      setVectorStatus('running');
      console.log('Vector store creation: running');
      const code = await createVectorStore();
      setVectorHttpCode(code);
      console.log('Vector store creation HTTP status:', code);
      setVectorStatus('completed');
      console.log('Vector store creation: completed');
=======
      setVectorStatus('running');
      const code = await createVectorStore();
      setVectorHttpCode(code);
      setVectorStatus('completed');
>>>>>>> 6f783d3fa3c3bd8ab72097364a0bf8337a445d20
    } catch (e) {
      setVectorStatus('failed');
      console.error('Vector store creation failed', e);
    }
  };

  return (
    <div className="p-6 md:p-8 text-white/90">
      <h1 className="text-xl md:text-2xl font-semibold mb-5">Dashboard</h1>

      <div className="grid md:grid-cols-4 gap-5 mb-6">
        {[
          { title: 'Total Jobs', value: jobsCount !== null ? String(jobsCount) : '—', Icon: Briefcase, color: '#6A1E55' },
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
        <div className="flex flex-col items-center gap-3">
          <button onClick={startScraper} disabled={starting} className="px-5 py-2.5 rounded-full font-semibold text-sm disabled:opacity-60" style={{ backgroundColor: '#6A1E55', color: 'white' }}>
            {starting ? 'Running scraper…' : 'Start Job Scraping'}
          </button>
          <button onClick={generateVectorStore} className="px-5 py-2.5 rounded-full font-semibold text-sm" style={{ backgroundColor: '#6A1E55', color: 'white' }}>
            Generate Vector Store
          </button>
        </div>
        {vectorStatus !== 'idle' && (
          <div className="text-center text-white/70 mt-3 text-sm">
<<<<<<< HEAD
            Vector store: {vectorStatus === 'starting' && 'starting'}{vectorStatus === 'running' && 'running'}{vectorStatus === 'completed' && 'completed'}{vectorStatus === 'failed' && 'failed'}
=======
            Vector store: {vectorStatus}
>>>>>>> 6f783d3fa3c3bd8ab72097364a0bf8337a445d20
            {vectorHttpCode !== null && ` (HTTP ${vectorHttpCode})`}
          </div>
        )}
        <div className="grid grid-cols-4 gap-4 mt-8 text-center">
          <Metric label="Jobs Found" value="247" />
          <Metric label="Sources" value="15" />
          <Metric label="Success Rate" value="98%" />
          <Metric label="Avg Time" value="3m" />
        </div>
      </section>

      <section className="rounded-2xl p-6 border border-white/10 mb-6" style={{ background: 'linear-gradient(160deg, rgba(19,16,34,0.7), rgba(19,16,34,0.4))' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Jobs by City</h3>
          <select value={city} onChange={(e)=>setCity(e.target.value as any)} className="bg-white/10 text-white text-sm rounded-md px-3 py-2 border border-white/10">
            <option value="Lahore">Lahore</option>
            <option value="Karachi">Karachi</option>
            <option value="Islamabad">Islamabad</option>
            <option value="Rawalpindi">Rawalpindi</option>
          </select>
        </div>
        <div className="auth-scroll max-h-64 overflow-y-auto space-y-2 pr-2">
          {cityJobs.length === 0 ? (
            <div className="text-white/60 text-sm">No jobs found.</div>
          ) : (
            cityJobs.map((j:any, idx:number) => (
              <div key={idx} className="rounded-lg p-3 border border-white/10 bg-white/5">
                <div className="font-semibold text-sm">{j.title || j.jobTitle || 'Job'}</div>
                <div className="text-white/70 text-xs">{j.company || j.companyName || 'Company'} — {j.city || city}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl p-6 border border-white/10 mb-6" style={{ background: 'linear-gradient(160deg, rgba(19,16,34,0.7), rgba(19,16,34,0.4))' }}>
        <h3 className="text-lg font-semibold mb-3">All Jobs</h3>
        <div className="auth-scroll max-h-64 overflow-y-auto space-y-2 pr-2">
          {allJobs.length === 0 ? (
            <div className="text-white/60 text-sm">No jobs available.</div>
          ) : (
            allJobs.map((j:any, idx:number) => (
              <div key={idx} className="rounded-lg p-3 border border-white/10 bg-white/5">
                <div className="font-semibold text-sm">{j.title || j.jobTitle || 'Job'}</div>
                <div className="text-white/70 text-xs">{j.company || j.companyName || 'Company'} — {j.city || j.location || ''}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl p-6 border border-white/10 mb-6" style={{ background: 'linear-gradient(160deg, rgba(19,16,34,0.7), rgba(19,16,34,0.4))' }}>
        <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3 mb-6">
          <Link to="/admin/settings" className="px-5 py-2.5 rounded-full font-semibold text-sm bg-white/10 hover:bg-white/15 transition-colors">Settings</Link>
          <button className="px-5 py-2.5 rounded-full font-semibold text-sm" style={{ backgroundColor: '#6A1E55', color: 'white' }}>Manage Users</button>
          <button className="px-5 py-2.5 rounded-full font-semibold text-sm bg-white/10 hover:bg-white/15">View Analytics</button>
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
