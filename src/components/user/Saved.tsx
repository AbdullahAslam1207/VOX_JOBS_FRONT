import React, { useEffect, useMemo, useState } from 'react';
import { applyPlatformJob, deleteFavoriteJob, getApplyRunStatus, getFavoriteJobs, getStoredUser, startApplyRun } from '../../api';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  job_link?: string;
};

type SavedEntry = {
  favoriteId: number;
  job: Job;
};

export default function SavedJobs() {
  const [savedMap, setSavedMap] = useState<Record<string, SavedEntry>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState<Record<string, boolean>>({});
  const [applyStatus, setApplyStatus] = useState<Record<string, string>>({});
  const [applyAllLoading, setApplyAllLoading] = useState(false);
  const user = getStoredUser();

  useEffect(() => {
    const load = async () => {
      if (!user?.user_id) {
        setError('Please login to view your saved jobs.');
        return;
      }
      try {
        setLoading(true);
        const favs = await getFavoriteJobs(user.user_id);
        const mapped = (favs || []).reduce<Record<string, SavedEntry>>((acc, f) => {
          const key = f.job_link || String(f.job_id);
          acc[key] = {
            favoriteId: f.job_id,
            job: {
              id: key,
              title: f.title,
              company: f.company_name || 'Unknown',
              location: f.location || f.city || '',
              description: f.job_description || '',
              job_link: f.job_link || undefined,
            },
          };
          return acc;
        }, {});
        setSavedMap(mapped);
        setError('');
      } catch (e) {
        setError('Unable to load saved jobs right now.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.user_id]);

  const savedJobs = useMemo(() => Object.values(savedMap).map((s) => s.job), [savedMap]);

  async function remove(jobKey: string) {
    if (!user?.user_id) return;
    const entry = savedMap[jobKey];
    if (!entry) return;
    try {
      await deleteFavoriteJob(entry.favoriteId, user.user_id);
      setSavedMap((prev) => {
        const copy = { ...prev };
        delete copy[jobKey];
        return copy;
      });
    } catch (e) {
      setError('Failed to remove job. Please try again.');
    }
  }

  function isValidUrl(value: string) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function isSupportedExternalApplyUrl(value: string) {
    try {
      const parsed = new URL(value);
      const host = parsed.hostname.toLowerCase();
      return host.includes('mustakbil.com') || host.includes('rozee.pk');
    } catch {
      return false;
    }
  }

  async function applyPlatform(job: Job) {
    if (!user?.email) {
      setError('Please login to apply to saved jobs.');
      return;
    }

    const key = job.job_link || job.id;
    setApplying((prev) => ({ ...prev, [key]: true }));
    setApplyStatus((prev) => ({ ...prev, [key]: 'submitted' }));

    try {
      await applyPlatformJob({
        email: user.email,
        job_id: Number(job.id),
      });
      setApplyStatus((prev) => ({ ...prev, [key]: 'submitted' }));
    } catch (err: any) {
      setApplyStatus((prev) => ({ ...prev, [key]: 'failed' }));
      setError(err?.message || 'Application failed.');
    } finally {
      setApplying((prev) => ({ ...prev, [key]: false }));
    }
  }

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function applySavedJob(job: Job) {
    if (!user?.email) {
      setError('Please login to apply to saved jobs.');
      return;
    }

    const key = job.job_link || job.id;
    if (!job.job_link || !isValidUrl(job.job_link) || !isSupportedExternalApplyUrl(job.job_link)) {
      await applyPlatform(job);
      return;
    }

    setApplying((prev) => ({ ...prev, [key]: true }));
    setApplyStatus((prev) => ({ ...prev, [key]: 'queued' }));

    try {
      const run = await startApplyRun({
        email: user.email,
        url: job.job_link,
        job_title: job.title,
        company_name: job.company,
      });

      const maxAttempts = 20;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        await sleep(2500);
        const statusRes = await getApplyRunStatus(run.run_id);
        const status = statusRes.status;
        setApplyStatus((prev) => ({ ...prev, [key]: status }));
        if (status === 'success' || status === 'failed' || status === 'timeout') {
          break;
        }
      }
    } catch {
      setApplyStatus((prev) => ({ ...prev, [key]: 'failed' }));
    } finally {
      setApplying((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function applyAll() {
    if (savedJobs.length === 0 || applyAllLoading) return;
    if (!user?.email) {
      setError('Please login to apply to saved jobs.');
      return;
    }

    setError('');
    setApplyAllLoading(true);
    try {
      await Promise.allSettled(savedJobs.map((job) => applySavedJob(job)));
    } finally {
      setApplyAllLoading(false);
    }
  }

  return (
    <div className="p-6 md:p-8 text-white/90">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl md:text-2xl font-semibold">Saved Jobs</h1>
        <button
          onClick={applyAll}
          className="px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-60"
          style={{ backgroundColor: '#6A1E55', color: 'white' }}
          disabled={savedJobs.length === 0 || applyAllLoading}
        >
          {applyAllLoading ? 'Applying to all...' : 'Apply to All'}
        </button>
      </div>

      {loading && <div className="text-white/70 mb-3">Loading your saved jobs…</div>}
      {error && <div className="text-red-300 text-sm mb-3">{error}</div>}

      {savedJobs.length === 0 && !loading ? (
        <div className="text-white/70">No saved jobs yet.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {Object.values(savedMap).map((entry) => (
            <div key={entry.job.id} className="rounded-xl p-5 border border-white/10 bg-white/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-white">{entry.job.title}</div>
                  <div className="text-white/70 text-sm">{entry.job.company} • {entry.job.location}</div>
                </div>
                <button onClick={() => remove(entry.job.id)} className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white/10 hover:bg-white/15" aria-label="Remove from saved">🗑️</button>
              </div>
              <p className="text-white/80 text-sm mt-3">{entry.job.description}</p>
              {applyStatus[entry.job.id] && (
                <div className="mt-3 text-xs text-white/70">
                  Apply status: <span className="font-semibold">{applyStatus[entry.job.id]}</span>
                </div>
              )}
              {applying[entry.job.id] && (
                <div className="mt-2 text-xs text-white/60">Processing application...</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}