import React from "react";

export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 140"
      role="img"
      aria-label="Freemasons New Zealand logo"
      className={className}
    >
      <title>Freemasons New Zealand</title>
      <rect width="120" height="120" rx="18" fill="#0f172a" />
      <g stroke="#f8fafc" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 16 94 104" />
        <path d="M60 16 26 104" />
        <path d="M38 78 60 58 82 78" />
        <path d="M47 96 60 78 73 96" />
      </g>
      <text
        x="60"
        y="112"
        textAnchor="middle"
        fontSize="15"
        fontFamily="'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontWeight="600"
        fill="#f8fafc"
      >
        FREEMASONS
      </text>
      <text
        x="60"
        y="126"
        textAnchor="middle"
        fontSize="9"
        fontFamily="'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif"
        fill="#f8fafc"
      >
        NEW ZEALAND
      </text>
    </svg>
  );
}
