"use client";

import * as React from "react";

interface GoogleSignInButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  busyLabel: string;
  busy?: boolean;
}

function GoogleLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" {...props}>
      <g fill="none" fillRule="evenodd">
        <path
          d="M17.64 9.2045c0-.638-.0573-1.2517-.1636-1.8402H9v3.4813h4.8443c-.2087 1.1252-.8436 2.0783-1.7968 2.7189v2.258h2.9088c1.7028-1.5681 2.6837-3.8787 2.6837-6.618z"
          fill="#4285F4"
        />
        <path
          d="M9 18c2.43 0 4.4672-.8068 5.9564-2.1775l-2.9088-2.258c-.8068.54-1.84.8607-3.0476.8607-2.344 0-4.3287-1.5844-5.0364-3.7124H.9575v2.3313C2.438 15.983 5.482 18 9 18z"
          fill="#34A853"
        />
        <path
          d="M3.9636 10.7127c-.18-.54-.2825-1.1171-.2825-1.7127 0-.5957.1025-1.1728.2825-1.7128V4.956H.9575C.3475 6.1636 0 7.5435 0 9s.3475 2.8365.9575 4.0441l3.0061-2.3314z"
          fill="#FBBC05"
        />
        <path
          d="M9 3.5625c1.3212 0 2.5109.4545 3.4454 1.3463l2.5846-2.5847C13.4631.9075 11.426 0 9 0 5.482 0 2.438 2.017 0 4.9559L3.9636 7.2873C4.6713 5.1593 6.656 3.5625 9 3.5625z"
          fill="#EA4335"
        />
      </g>
    </svg>
  );
}

export function GoogleSignInButton({ label, busyLabel, busy, disabled, className = "", ...props }: GoogleSignInButtonProps) {
  const isDisabled = disabled || busy;

  return (
    <button
      type="button"
      className={`inline-flex w-full items-center justify-center gap-3 rounded-md bg-[#1a73e8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1664c4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a73e8] disabled:cursor-not-allowed disabled:opacity-75 ${className}`.trim()}
      disabled={isDisabled}
      {...props}
    >
      <GoogleLogo className="h-5 w-5" />
      <span>{busy ? busyLabel : label}</span>
    </button>
  );
}

export default GoogleSignInButton;
