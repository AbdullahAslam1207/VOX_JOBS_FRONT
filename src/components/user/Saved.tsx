import React, { useEffect, useMemo, useState } from 'react';
import { deleteFavoriteJob, getFavoriteJobs, getStoredUser } from '../../api';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  email?: string;
};

type SavedEntry = {
  favoriteId: number;
  job: Job;
};

export default function SavedJobs() {
  const [savedMap, setSavedMap] = useState<Record<string, SavedEntry>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
              email: f.job_link || undefined,
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

  function applyAll() {
    if (savedJobs.length === 0) return;
    const subject = encodeURIComponent('Application: Multiple roles - VoxJobs');
    const lines = savedJobs.map((j) => `- ${j.title} at ${j.company} (${j.location})`).join('\n');
    const body = encodeURIComponent(
      `Hello Hiring Team,\n\nI would like to apply to the following roles:\n\n${lines}\n\nMy background aligns well with these positions. Looking forward to your response.\n\nBest regards,\nYour Name\n`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <div className="p-6 md:p-8 text-white/90">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl md:text-2xl font-semibold">Saved Jobs</h1>
        <button onClick={applyAll} className="px-4 py-2 rounded-md text-sm font-semibold" style={{ backgroundColor: '#6A1E55', color: 'white' }} disabled={savedJobs.length === 0}>Apply to All</button>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}