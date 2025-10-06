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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl card">
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{title}</h3>
            <button className="navlink" onClick={onClose}>Close</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}