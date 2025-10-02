// Header.jsx
import React from 'react';

const Header = () => (
  <div className="text-center mb-8">
    <div className="flex justify-center mb-4">
      <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </div>
    </div>
    <h1 className="text-4xl font-bold text-white mb-2">VoxJobs</h1>
    <p className="text-purple-300 text-lg">Where your voice meets your next opportunity</p>
  </div>
);

export default Header;