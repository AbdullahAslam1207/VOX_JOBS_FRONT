import React from 'react';

type Props = {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
};

export default function ErrorDialog({ open, title = 'Something went wrong', message, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#221a26] text-white shadow-2xl">
        <div className="p-5 border-b border-white/10">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="p-5">
          <p className="text-white/80 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#6A1E55] hover:bg-[#7a2462] text-white text-sm font-semibold"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}


