import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getAllJobs, getJobsByCity, getJobsByTitle, JobApi } from '../../api';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  audioUrl?: string;
  email?: string;
};

export default function UserJobs() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState<'Lahore' | 'Karachi' | 'Islamabad' | 'Rawalpindi' | ''>('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [listening, setListening] = useState(false);
  const [saved, setSaved] = useState<Record<string, Job>>(() => {
    try {
      const raw = localStorage.getItem('voxjobs_saved_jobs');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const recognitionRef = useRef<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript as string;
        setQuery(text);
        setListening(false);
      };
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesQuery = (j.title + ' ' + j.company + ' ' + j.description).toLowerCase().includes(query.toLowerCase());
      const matchesLocation = location ? j.location.toLowerCase().includes(location.toLowerCase()) : true;
      const matchesCity = city ? j.location?.toLowerCase().includes(city.toLowerCase()) : true;
      const matchesRemote = onlyRemote ? j.location.toLowerCase().includes('remote') : true;
      return matchesQuery && matchesLocation && matchesRemote && matchesCity;
    });
  }, [query, location, onlyRemote, city, jobs]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAllJobs();
        const norm: Job[] = (data || []).map((d: JobApi) => ({
          id: String(d.id ?? Math.random()),
          title: d.title || 'Untitled',
          company: d.company || 'Unknown',
          location: d.location || '',
          description: d.description || '',
          email: d.email,
        }));
        setJobs(norm);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        if (!query.trim()) return;
        const res = await getJobsByTitle(query.trim());
        const norm: Job[] = (res || []).map((d: JobApi) => ({
          id: String(d.id ?? Math.random()),
          title: d.title || 'Untitled',
          company: d.company || 'Unknown',
          location: d.location || '',
          description: d.description || '',
          email: d.email,
        }));
        setJobs(norm);
      } catch {
        // ignore
      }
    }, 400);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [query]);

  useEffect(() => {
    const loadCity = async () => {
      try {
        if (!city) return;
        setLoading(true);
        const res = await getJobsByCity(city as any);
        const norm: Job[] = (res || []).map((d: JobApi) => ({
          id: String(d.id ?? Math.random()),
          title: d.title || 'Untitled',
          company: d.company || 'Unknown',
          location: d.location || '',
          description: d.description || '',
          email: d.email,
        }));
        setJobs(norm);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    loadCity();
  }, [city]);

  function toggleVoice() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  }

  function speak(text: string) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    window.speechSynthesis.speak(utter);
  }

  function playAudio(job: Job) {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (job.audioUrl) {
      const audio = new Audio(job.audioUrl);
      audioRef.current = audio;
      audio.play();
    } else {
      speak(`${job.title} at ${job.company}. ${job.description}`);
    }
  }

  function applyEmail(job: Job) {
    const subject = encodeURIComponent(`Application: ${job.title} - ${job.company}`);
    const body = encodeURIComponent(
      `Hello ${job.company} Team,\n\nI am excited to apply for the ${job.title} role. My experience aligns well with your requirements. I'd love to discuss how I can contribute.\n\nBest regards,\nYour Name\n`
    );
    const to = job.email || 'hr@example.com';
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }

  function applyDirect(job: Job) {
    alert(`Applied to ${job.title} at ${job.company}! (demo)`);
  }

  function toggleSave(job: Job) {
    setSaved((prev) => {
      const copy: Record<string, Job> = { ...prev };
      if (copy[job.id]) {
        delete copy[job.id];
      } else {
        copy[job.id] = job;
      }
      localStorage.setItem('voxjobs_saved_jobs', JSON.stringify(copy));
      return copy;
    });
  }

  return (
    <div className="p-6 md:p-8 text-white/90">
      <h1 className="text-xl md:text-2xl font-semibold mb-5">Find Jobs</h1>

      {/* Cleaner search bar */}
      <div className="rounded-2xl p-3 border border-white/10 mb-6 bg-white/5">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-md px-3 py-2">
            <span className="text-white/60">🔎</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Keywords: frontend, react, node" className="w-full bg-transparent text-white placeholder-white/40 outline-none" />
          </div>
          <div className="w-full md:w-[240px] flex items-center gap-2 bg-white/5 border border-white/10 rounded-md px-3 py-2">
            <span className="text-white/60">📍</span>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location or Remote" className="w-full bg-transparent text-white placeholder-white/40 outline-none" />
          </div>
          <div className="w-full md:w-[220px] flex items-center gap-2 bg-white/5 border border-white/10 rounded-md px-3 py-2">
            <span className="text-white/60">🏙️</span>
            <select value={city} onChange={(e) => setCity(e.target.value as any)} className="w-full bg-transparent text-white outline-none">
              <option value="" className="bg-purple-900 text-white">All Cities</option>
              <option value="Lahore" className="bg-purple-900 text-white">Lahore</option>
              <option value="Karachi" className="bg-purple-900 text-white">Karachi</option>
              <option value="Islamabad" className="bg-purple-900 text-white">Islamabad</option>
              <option value="Rawalpindi" className="bg-purple-900 text-white">Rawalpindi</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={onlyRemote} onChange={(e) => setOnlyRemote(e.target.checked)} /> Remote</label>
            <button onClick={toggleVoice} className={`px-3 py-2 rounded-md text-sm font-semibold ${listening ? 'bg-emerald-600' : 'bg-[#6A1E55]'} text-white`}>{listening ? '🎤 Listening' : '🎤 Voice'}</button>
          </div>
        </div>
      </div>

      {loading && <div className="text-white/70 mb-3">Loading jobs…</div>}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredJobs.map((job) => (
          <div key={job.id} className="rounded-xl p-5 border border-white/10 bg-white/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-white">{job.title}</div>
                <div className="text-white/70 text-sm">{job.company} • {job.location}</div>
              </div>
              <button onClick={() => playAudio(job)} className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white/10 hover:bg-white/15" aria-label="Hear job details">🔊</button>
            </div>
            <p className="text-white/80 text-sm mt-3">{job.description}</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => applyDirect(job)} className="px-4 py-2 rounded-md text-sm font-semibold bg-[#6A1E55] text-white">Apply Directly</button>
              <button onClick={() => applyEmail(job)} className="px-4 py-2 rounded-md text-sm font-semibold bg-white/10 hover:bg-white/15">Email with Cover Letter</button>
              <button onClick={() => toggleSave(job)} className="px-4 py-2 rounded-md text-sm font-semibold bg-white/10 hover:bg-white/15">{saved[job.id] ? 'Unsave' : 'Save'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


