// SubmitButton.jsx
import React from 'react';

const SubmitButton = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="w-full py-3 px-5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 text-sm"
  >
    {children}
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  </button>
);

export default SubmitButton;