import React from 'react';

export default function AdminListings() {
  return (
    <div className="p-8 text-white/90" style={{ minHeight: '100vh' }}>
      <div className="rounded-3xl p-16 border border-white/10 flex flex-col items-center justify-center" style={{ background: 'radial-gradient(800px 500px at 50% 0%, rgba(166,77,121,0.2), transparent), linear-gradient(180deg, rgba(43,22,39,0.6), rgba(19,16,34,0.6))' }}>
        <div className="text-6xl mb-6">🕒</div>
        <h2 className="text-3xl font-semibold mb-2">Coming Soon</h2>
        <p className="text-white/70">The listings section is under development.</p>
      </div>
    </div>
  );
}



