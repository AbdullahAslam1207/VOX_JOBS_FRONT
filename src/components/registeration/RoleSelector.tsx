// RoleSelector.jsx
import React from 'react';

const RoleSelector = ({ selectedRole, onRoleChange }) => (
  <div className="mb-4">
    <label className="block text-white font-semibold mb-1.5 text-sm">Select Role</label>
    <div className="grid grid-cols-3 gap-2.5">
      <button
        onClick={() => onRoleChange('admin')}
        className={`py-2.5 px-2.5 rounded-md font-medium text-xs transition-all ${
          selectedRole === 'admin'
            ? 'bg-purple-600 text-white'
            : 'bg-purple-900/40 text-purple-300 hover:bg-purple-900/60'
        }`}
      >
        <div className="flex flex-col items-center gap-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Admin</span>
        </div>
      </button>
      <button
        onClick={() => onRoleChange('jobseeker')}
        className={`py-2.5 px-2.5 rounded-md font-medium text-xs transition-all ${
          selectedRole === 'jobseeker'
            ? 'bg-purple-600 text-white'
            : 'bg-purple-900/40 text-purple-300 hover:bg-purple-900/60'
        }`}
      >
        <div className="flex flex-col items-center gap-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Job Seeker</span>
        </div>
      </button>
      <button
        onClick={() => onRoleChange('recruiter')}
        className={`py-2.5 px-2.5 rounded-md font-medium text-xs transition-all ${
          selectedRole === 'recruiter'
            ? 'bg-emerald-600 text-white'
            : 'bg-emerald-950/50 text-emerald-200 hover:bg-emerald-950/70'
        }`}
      >
        <div className="flex flex-col items-center gap-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-5-3.874M9 20H4v-2a4 4 0 015-3.874m0 0a4 4 0 110-7.252m0 7.252A4 4 0 109 4.873m8 11.253a4 4 0 110-7.252m0 7.252A4 4 0 1017 4.873" />
          </svg>
          <span>Recruiter</span>
        </div>
      </button>
    </div>
  </div>
);

export default RoleSelector;