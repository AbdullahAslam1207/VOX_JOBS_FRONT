import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getRecruiterApplicants, getRecruiterJobs, JobApi, RecruiterApplicant } from '../../api';

export default function JobApplicants() {
  const { jobId } = useParams();
  const [job, setJob] = useState<JobApi | null>(null);
  const [applicants, setApplicants] = useState<RecruiterApplicant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!jobId) return;
      try {
        setLoading(true);
        setError('');
        const [jobsResponse, applicantsResponse] = await Promise.all([getRecruiterJobs(), getRecruiterApplicants(Number(jobId))]);
        setApplicants(applicantsResponse);
        const foundJob = jobsResponse.jobs.find((item) => Number(item.id) === Number(jobId)) ?? null;
        setJob(foundJob);
      } catch (err: any) {
        setError(err?.message || 'Unable to load applicants');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [jobId]);

  const backendBase = useMemo(() => (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/+$/, '') || 'http://localhost:8000', []);

  return (
    <div className="p-6 md:p-8 text-white/90">
      <p className="text-emerald-300 uppercase tracking-[0.22em] text-xs mb-2">Job Applicants</p>
      <h1 className="text-3xl md:text-4xl font-semibold mb-2">{job?.title || `Job #${jobId}`}</h1>
      <p className="text-white/60 mb-6">Applicant review only. No accept/reject workflow is included.</p>

      {error && <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">{error}</div>}
      {loading && <div className="text-white/70">Loading applicants…</div>}

      {!loading && applicants.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/65">No applicants found for this job yet.</div>
      ) : null}

      {applicants.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/60 uppercase text-xs tracking-[0.18em]">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Resume</th>
                <th className="px-4 py-3">Applied</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((applicant) => (
                <tr key={`${applicant.email}-${applicant.applied_at}`} className="border-t border-white/10">
                  <td className="px-4 py-4 font-medium text-white">{applicant.name}</td>
                  <td className="px-4 py-4 text-white/70">{applicant.email}</td>
                  <td className="px-4 py-4">
                    {applicant.resume_download_url ? (
                      <a
                        href={`${backendBase}${applicant.resume_download_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
                      >
                        {applicant.resume_file_name || 'Download resume'}
                      </a>
                    ) : (
                      <span className="text-white/45">No resume available</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-white/70">{applicant.applied_at ? new Date(applicant.applied_at).toLocaleString() : 'Unknown'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
