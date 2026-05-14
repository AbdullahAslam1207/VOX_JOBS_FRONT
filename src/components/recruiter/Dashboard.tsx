import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { closeRecruiterJob, deleteRecruiterJob, getRecruiterJobs, JobApi } from '../../api';

type RecruiterDashboardResponse = {
  jobs: JobApi[];
  open_jobs: JobApi[];
  closed_jobs: JobApi[];
};

export default function RecruiterDashboard() {
  const [data, setData] = useState<RecruiterDashboardResponse>({ jobs: [], open_jobs: [], closed_jobs: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyJobId, setBusyJobId] = useState<number | string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    void loadJobs();
  }, []);

  async function loadJobs() {
    try {
      setLoading(true);
      setError('');
      const response = await getRecruiterJobs();
      setData(response);
    } catch (err: any) {
      setError(err?.message || 'Unable to load recruiter jobs');
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const applicants = data.jobs.reduce((sum, job) => sum + (job.applicants_count || 0), 0);
    return {
      total: data.jobs.length,
      open: data.open_jobs.length,
      closed: data.closed_jobs.length,
      applicants,
    };
  }, [data]);

  async function handleClose(job: JobApi) {
    const jobId = Number(job.id);
    setBusyJobId(jobId);
    try {
      await closeRecruiterJob(jobId);
      await loadJobs();
    } catch (err: any) {
      setError(err?.message || 'Unable to close applications');
    } finally {
      setBusyJobId(null);
    }
  }

  async function handleDelete(job: JobApi) {
    const jobId = Number(job.id);
    if (!window.confirm(`Delete ${job.title}?`)) return;
    setBusyJobId(jobId);
    try {
      await deleteRecruiterJob(jobId);
      await loadJobs();
    } catch (err: any) {
      setError(err?.message || 'Unable to delete job');
    } finally {
      setBusyJobId(null);
    }
  }

  return (
    <div className="p-6 md:p-8 text-white/90">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <p className="text-emerald-300 uppercase tracking-[0.22em] text-xs mb-2">Recruiter Dashboard</p>
          <h1 className="text-3xl md:text-4xl font-semibold">Your posted jobs</h1>
          <p className="text-white/60 mt-2 max-w-2xl">Manage open and closed jobs, review applicants, and keep your listings in one place.</p>
        </div>
        <Link to="create-job" className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-colors">
          Post New Job
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <StatCard label="Total Jobs" value={stats.total} tone="emerald" />
        <StatCard label="Open Jobs" value={stats.open} tone="teal" />
        <StatCard label="Closed Jobs" value={stats.closed} tone="slate" />
        <StatCard label="Applicants" value={stats.applicants} tone="amber" />
      </div>

      {error && <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">{error}</div>}
      {loading ? <div className="text-white/70">Loading jobs…</div> : null}

      <JobSection
        title="Open Jobs"
        accentClass="border-emerald-500/30"
        jobs={data.open_jobs}
        onClose={handleClose}
        onDelete={handleDelete}
        busyJobId={busyJobId}
        onEdit={(job) => navigate('create-job', { state: { job } })}
      />

      <JobSection
        title="Closed Jobs"
        accentClass="border-slate-500/30"
        jobs={data.closed_jobs}
        onClose={handleClose}
        onDelete={handleDelete}
        busyJobId={busyJobId}
        onEdit={(job) => navigate('create-job', { state: { job } })}
      />
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'teal' | 'slate' | 'amber' }) {
  const toneClass =
    tone === 'emerald'
      ? 'from-emerald-500/25 to-emerald-500/10 border-emerald-400/20'
      : tone === 'teal'
        ? 'from-cyan-500/20 to-cyan-500/10 border-cyan-400/20'
        : tone === 'amber'
          ? 'from-amber-500/20 to-amber-500/10 border-amber-400/20'
          : 'from-slate-500/20 to-slate-500/10 border-slate-400/20';

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${toneClass} p-4`}> 
      <div className="text-xs uppercase tracking-[0.2em] text-white/50 mb-2">{label}</div>
      <div className="text-3xl font-semibold">{value}</div>
    </div>
  );
}

function JobSection({
  title,
  accentClass,
  jobs,
  onClose,
  onDelete,
  onEdit,
  busyJobId,
}: {
  title: string;
  accentClass: string;
  jobs: JobApi[];
  onClose: (job: JobApi) => void;
  onDelete: (job: JobApi) => void;
  onEdit: (job: JobApi) => void;
  busyJobId: number | string | null;
}) {
  return (
    <section className="mb-8">
      <div className={`mb-4 flex items-center justify-between rounded-2xl border ${accentClass} bg-white/5 px-4 py-3`}>
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="text-sm text-white/55">{jobs.length} jobs</span>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/65">No jobs here yet.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {jobs.map((job) => {
            const jobId = Number(job.id);
            const isBusy = busyJobId === jobId;
            return (
              <article key={job.id} className="rounded-2xl border border-white/10 bg-[#111827]/80 p-5 shadow-xl shadow-black/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-white">{job.title}</div>
                    <div className="text-sm text-white/65 mt-1">{job.company || job.company_name || 'Company not listed'}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${job.application_status === 'closed' ? 'bg-slate-500/20 text-slate-200' : 'bg-emerald-500/15 text-emerald-200'}`}>
                    {(job.application_status || 'open').toUpperCase()}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/70">
                  <Meta label="Location" value={job.location || 'N/A'} />
                  <Meta label="City" value={job.city || 'N/A'} />
                  <Meta label="Type" value={job.job_type || 'N/A'} />
                  <Meta label="Applicants" value={String(job.applicants_count || 0)} />
                </div>

                <p className="mt-4 text-sm text-white/70 line-clamp-4">{job.job_description || job.description || 'No description provided.'}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={() => onEdit(job)} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium">Edit Job</button>
                  <Link to={`applicants/${job.id}`} className="px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-sm font-medium text-cyan-100">View Applicants</Link>
                  {job.application_status !== 'closed' ? (
                    <button onClick={() => onClose(job)} disabled={isBusy} className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-sm font-medium text-amber-100 disabled:opacity-50">
                      {isBusy ? 'Working…' : 'Close Applications'}
                    </button>
                  ) : null}
                  <button onClick={() => onDelete(job)} disabled={isBusy} className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-sm font-medium text-red-100 disabled:opacity-50">
                    Delete Job
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className="text-sm text-white mt-1 truncate">{value}</div>
    </div>
  );
}
