'use client';
import React from 'react';

export default function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl card shadow-xl">
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-base sm:text-lg">{title}</h3>
            <button className="navlink" onClick={onClose}>
              Close
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}