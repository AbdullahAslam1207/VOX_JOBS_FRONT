import React, { useEffect, useState } from 'react';
import { getJobs, getJobsByCity } from '../../lib/api';

type City = 'All' | 'Lahore' | 'Karachi' | 'Islamabad' | 'Rawalpindi';

export default function UserListings() {
  const [city, setCity] = useState<City>('All');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async (selected: City) => {
    setLoading(true);
    try {
      if (selected === 'All') {
        const data = await getJobs();
        setJobs(Array.isArray(data) ? data : data?.jobs || []);
      } else {
        const data = await getJobsByCity(selected);
        setJobs(Array.isArray(data) ? data : data?.jobs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(city);
  }, [city]);

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: 'radial-gradient(1200px 800px at 70% 0%, rgba(166,77,121,0.15), transparent 60%), radial-gradient(800px 600px at 0% 100%, rgba(106,30,85,0.15), transparent 60%)', backgroundColor: '#120f16' }}>
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Job Listings</h1>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value as City)}
            className="bg-white/10 text-white text-sm rounded-md px-3 py-2 border border-white/10"
          >
            <option value="All">All</option>
            <option value="Lahore">Lahore</option>
            <option value="Karachi">Karachi</option>
            <option value="Islamabad">Islamabad</option>
            <option value="Rawalpindi">Rawalpindi</option>
          </select>
        </header>

        <div className="rounded-2xl p-6 border border-white/10 bg-white/5">
          {loading ? (
            <div className="text-white/80">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="text-white/60">No jobs found.</div>
          ) : (
            <ul className="grid md:grid-cols-2 gap-4">
              {jobs.map((j: any, idx: number) => (
                <li key={idx} className="rounded-xl p-4 border border-white/10 bg-white/5">
                  <div className="text-white font-semibold text-lg">{j.title || j.jobTitle || 'Job'}</div>
                  <div className="text-white/70 text-sm">{j.company || j.companyName || 'Company'}</div>
                  <div className="text-white/60 text-xs mt-1">{j.city || j.location || (city !== 'All' ? city : '')}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}


