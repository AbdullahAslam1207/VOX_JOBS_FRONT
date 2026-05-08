import React, { useEffect, useMemo, useState } from 'react';
import { getAllJobs, type JobApi } from '../../api';

export default function AdminListings() {
  const [jobs, setJobs] = useState<JobApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getAllJobs();
        setJobs(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err?.message || 'Unable to load jobs.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((job) => {
      return [job.title, job.company, job.location, job.city, job.job_type]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(q));
    });
  }, [jobs, query]);

  return (
    <div className="p-6 md:p-8 text-white/90">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <h1 className="text-xl md:text-2xl font-semibold">All Job Listings</h1>
        <div className="text-sm text-white/70">Total: {filteredJobs.length}</div>
      </div>

      <div className="rounded-xl p-3 border border-white/10 bg-white/5 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, company, location, city, or type"
          className="w-full rounded-md bg-transparent border border-white/10 px-3 py-2 text-sm text-white placeholder-white/40 outline-none"
        />
      </div>

      {loading && <div className="text-white/70 mb-3">Loading jobs...</div>}
      {error && <div className="text-red-200 bg-red-900/20 border border-red-400/30 rounded-md p-3 mb-3">{error}</div>}

      {!loading && !error && (
        <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5">
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full text-sm">
              <thead className="bg-white/10 text-white/80">
                <tr>
                  <th className="text-left px-3 py-2">Title</th>
                  <th className="text-left px-3 py-2">Company</th>
                  <th className="text-left px-3 py-2">Location</th>
                  <th className="text-left px-3 py-2">City</th>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-left px-3 py-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={String(job.id)} className="border-t border-white/10 align-top">
                    <td className="px-3 py-2 text-white">{job.title || '-'}</td>
                    <td className="px-3 py-2 text-white/80">{job.company || '-'}</td>
                    <td className="px-3 py-2 text-white/70">{job.location || '-'}</td>
                    <td className="px-3 py-2 text-white/70">{job.city || '-'}</td>
                    <td className="px-3 py-2 text-white/70">{job.job_type || '-'}</td>
                    <td className="px-3 py-2 text-white/70">{job.job_source || '-'}</td>
                  </tr>
                ))}
                {filteredJobs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-white/60">
                      No jobs found.
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




