// TabButton.jsx
import React from 'react';

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2.5 px-5 rounded-md font-medium text-sm transition-all ${
      active
        ? 'bg-purple-800 text-white'
        : 'bg-transparent text-purple-300 hover:text-white'
    }`}
  >
    {children}
  </button>
);

export default TabButton;