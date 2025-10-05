"use client";
import React from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(15,23,42,.35)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:50
    }} onClick={onClose}>
      <div className="card" style={{width:"min(720px, 92vw)"}} onClick={(e)=>e.stopPropagation()}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:".5rem"}}>
          <h3 style={{margin:0}}>{title}</h3>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
