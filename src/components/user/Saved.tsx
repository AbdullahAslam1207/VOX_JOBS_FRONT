import React, { useMemo, useState } from 'react';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  email?: string;
};

export default function SavedJobs() {
  const [savedMap, setSavedMap] = useState<Record<string, Job>>(() => {
    try {
      const raw = localStorage.getItem('voxjobs_saved_jobs');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const savedJobs = useMemo(() => Object.values(savedMap), [savedMap]);

  function remove(jobId: string) {
    setSavedMap((prev) => {
      const copy: Record<string, Job> = { ...prev };
      delete copy[jobId];
      localStorage.setItem('voxjobs_saved_jobs', JSON.stringify(copy));
      return copy;
    });
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

      {savedJobs.length === 0 ? (
        <div className="text-white/70">No saved jobs yet.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {savedJobs.map((job) => (
            <div key={job.id} className="rounded-xl p-5 border border-white/10 bg-white/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-white">{job.title}</div>
                  <div className="text-white/70 text-sm">{job.company} • {job.location}</div>
                </div>
                <button onClick={() => remove(job.id)} className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white/10 hover:bg-white/15" aria-label="Remove from saved">🗑️</button>
              </div>
              <p className="text-white/80 text-sm mt-3">{job.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



