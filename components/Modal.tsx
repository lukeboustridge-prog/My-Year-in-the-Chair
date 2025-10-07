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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl">
        <div className="card overflow-hidden">
          <div className="card-body space-y-4 max-h-[calc(100vh-5rem)] overflow-y-auto sm:max-h-[calc(100vh-6rem)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button className="navlink" onClick={onClose}>Close</button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}