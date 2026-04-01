import React from 'react';

type ErrorPopupProps = {
  message: string;
  onClose: () => void;
};

export default function ErrorPopup({ message, onClose }: ErrorPopupProps) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-xl border border-red-300/40 bg-[#2a1321] p-5 text-white shadow-xl">
        <h3 className="text-lg font-semibold text-red-200">Something went wrong</h3>
        <p className="mt-2 text-sm text-white/85 whitespace-pre-wrap">{message}</p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-semibold bg-red-500/80 hover:bg-red-500 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
