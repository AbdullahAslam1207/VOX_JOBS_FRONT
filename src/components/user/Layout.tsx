<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Chatbot from '../landingpage/Chatbot';
import { clearStoredUser, getProfilePictureMetadata, getStoredUser, getProfilePictureDownloadUrl } from '../../api';

export default function UserLayout() {
  const [showChatbot, setShowChatbot] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const user = getStoredUser();
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    const loadProfilePicture = async () => {
      if (!user?.email) {
        setAvatarUrl('');
        return;
      }

      try {
        await getProfilePictureMetadata(user.email);
        setAvatarUrl(`${getProfilePictureDownloadUrl(user.email)}?t=${Date.now()}`);
      } catch {
        setAvatarUrl('');
      }
    };
    loadProfilePicture();
  }, [user?.email]);

  const displayName = user?.fullname || 'User';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
=======
import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Chatbot from '../landingpage/Chatbot';

export default function UserLayout() {
  const [showChatbot, setShowChatbot] = useState(false);
>>>>>>> 6f783d3fa3c3bd8ab72097364a0bf8337a445d20

  return (
    <div className="min-h-screen w-full grid grid-cols-[260px_1fr]" style={{ background: 'radial-gradient(1200px 800px at 70% 0%, rgba(166,77,121,0.15), transparent 60%), radial-gradient(800px 600px at 0% 100%, rgba(106,30,85,0.15), transparent 60%)', backgroundColor: '#120f16' }}>
      <aside className="h-screen sticky top-0 bg-[#131022] text-white/90">
        <div className="px-6 py-6 flex items-center gap-3 border-b border-white/10">
          <img src="/logo.png" alt="VoxJobs" className="w-16 h-16 rounded-md object-contain" />
          <div>
            <div className="text-2xl font-bold">VoxJobs</div>
            <div className="text-xs text-white/60">Job Seeker</div>
          </div>
        </div>
        <nav className="px-4 py-4 space-y-2">
          <NavItem to="." label="Dashboard" />
          <NavItem to="jobs" label="Browse Jobs" />
          <NavItem to="saved" label="Saved Jobs" />
<<<<<<< HEAD
          <NavItem to="applied-jobs" label="Applied Jobs" />
          <NavItem to="mock-interview" label="Mock Interview" />
=======
          <NavItem to="settings" label="Settings" />
>>>>>>> 6f783d3fa3c3bd8ab72097364a0bf8337a445d20
        </nav>
        <button onClick={() => setShowChatbot(true)} className="mx-4 mt-4 w-[calc(100%-2rem)] px-4 py-3 rounded-lg font-medium text-sm bg-[#6A1E55] hover:bg-[#7A2E65] text-white transition-colors">
          💬 Chat with Assistant
        </button>
<<<<<<< HEAD
=======
        <button onClick={() => (window.location.href = '/')} className="mt-auto w-full text-left px-4 py-6 text-sm text-white/80 hover:text-white/100">Logout</button>
>>>>>>> 6f783d3fa3c3bd8ab72097364a0bf8337a445d20
      </aside>
      <main className="min-h-screen flex flex-col">
        <header className="h-16 px-6 md:px-8 border-b border-white/10 flex items-center justify-end">
          <button
            onClick={() => setShowMenu(true)}
            className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 text-white text-sm font-medium flex items-center gap-2"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-7 h-7 rounded-full object-cover border border-white/20"
                onError={() => setAvatarUrl('')}
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#6A1E55] text-white text-xs font-semibold flex items-center justify-center">
                {initials}
              </div>
            )}
            <span>{displayName}</span>
            <span>▸</span>
          </button>
        </header>

        <div
          className={`fixed inset-0 z-30 transition-opacity ${showMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setShowMenu(false)}
        >
          <div className="absolute inset-0 bg-black/45" />
        </div>

        <aside
          className={`fixed top-0 right-0 z-40 w-[320px] max-w-[90vw] h-auto rounded-bl-2xl border-l border-b border-white/10 bg-[#1b1527] shadow-2xl transform transition-transform duration-300 ${showMenu ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-5 border-b border-white/10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border border-white/20"
                  onError={() => setAvatarUrl('')}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#6A1E55] text-white text-xl font-semibold flex items-center justify-center">
                  {initials}
                </div>
              )}
              <div>
                <div className="text-white text-lg font-semibold">{displayName}</div>
                <div className="text-white/60 text-xs">Job Seeker</div>
              </div>
            </div>
            <button onClick={() => setShowMenu(false)} className="text-white/70 hover:text-white text-xl leading-none">×</button>
          </div>

          <div className="p-3">
            <NavLink
              to="profile"
              onClick={() => setShowMenu(false)}
              className="block px-4 py-2.5 text-sm text-white/90 rounded-md hover:bg-white/10"
            >
              Profile
            </NavLink>
            <button
              onClick={() => {
                clearStoredUser();
                window.location.href = '/';
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-200 rounded-md hover:bg-red-500/15"
            >
              Logout
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <Outlet />
        </div>
      </main>
<<<<<<< HEAD
      
      {/* Chatbot */}
=======

>>>>>>> 6f783d3fa3c3bd8ab72097364a0bf8337a445d20
      <Chatbot isOpen={showChatbot} onClose={() => setShowChatbot(false)} />
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      end
      to={to}
      className={({ isActive }) =>
        `block px-4 py-3 rounded-lg font-medium transition-colors ${
          isActive ? 'bg-[#2a2040] text-white' : 'text-white/80 hover:text-white hover:bg-white/5'
        }`
      }
    >
      {label}
    </NavLink>
  );
}
