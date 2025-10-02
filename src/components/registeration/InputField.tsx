// InputField.jsx
import React from 'react';

const InputField = ({ label, type, placeholder, value, onChange }) => (
  <div className="mb-4">
    <label className="block text-white font-medium text-sm mb-1.5">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full px-3.5 py-2.5 rounded-md bg-purple-950/50 border border-purple-800/50 text-white placeholder-purple-400 focus:outline-none focus:border-purple-600 transition-colors text-sm"
    />
  </div>
);

export default InputField;