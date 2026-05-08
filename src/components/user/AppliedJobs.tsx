import React, { useEffect, useState } from 'react';
import { AppliedJobResponse, getAppliedJobs, getStoredUser } from '../../api';
import ErrorPopup from './ErrorPopup';

export default function AppliedJobs() {
  const user = getStoredUser();
  const [jobs, setJobs] = useState<AppliedJobResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user?.email) {
        setError('Please login to view applied jobs.');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const res = await getAppliedJobs(user.email, {
          status: statusFilter || undefined,
          limit: 100,
          offset: 0,
        });
        setJobs(res.jobs || []);
      } catch (err: any) {
        setError(err?.message || 'Unable to load applied jobs right now.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.email, statusFilter]);

  return (
    <div className="p-6 md:p-8 text-white/90">
      <ErrorPopup message={error} onClose={() => setError('')} />
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl md:text-2xl font-semibold">Applied Jobs</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="timeout">Timeout</option>
          <option value="running">Running</option>
          <option value="queued">Queued</option>
        </select>
      </div>

      {loading && <div className="text-white/70 mb-3">Loading applied jobs...</div>}

      {!loading && jobs.length === 0 ? (
        <div className="text-white/70">No applied jobs found yet.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-xl p-5 border border-white/10 bg-white/5">
              {(() => {
                const normalizedStatus = job.status === 'success' ? 'Success' : 'Failed';
                const statusClasses =
                  normalizedStatus === 'Success'
                    ? 'bg-emerald-600/30 text-emerald-200'
                    : 'bg-red-600/30 text-red-200';

                return (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-white">{job.job_title || 'Job Application'}</div>
                  <div className="text-white/70 text-sm">{job.company_name || 'Unknown Company'} • {job.site}</div>
                </div>
                <span
                  className={`px-2 py-1 rounded-md text-xs font-semibold ${statusClasses}`}
                >
                  {normalizedStatus}
                </span>
              </div>
                );
              })()}

              <div className="mt-3 text-xs text-white/60">
                Created: {new Date(job.created_at).toLocaleString()}
                {job.applied_at ? ` • Applied: ${new Date(job.applied_at).toLocaleString()}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
