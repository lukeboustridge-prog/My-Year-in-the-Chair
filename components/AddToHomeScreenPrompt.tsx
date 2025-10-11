"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "my-year-in-the-chair:a2hs-dismissed";

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

function isStandaloneDisplay() {
  if (typeof window === "undefined") {
    return false;
  }

  const nav = window.navigator as NavigatorWithStandalone;
  const navigatorStandalone = typeof nav.standalone === "boolean" ? nav.standalone : false;

  const matchMediaStandalone =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: minimal-ui)").matches
      : false;

  return navigatorStandalone || matchMediaStandalone;
}

function isMobileDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /iphone|ipad|android/i.test(navigator.userAgent);
}

export default function AddToHomeScreenPrompt() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore storage failures
    }
    setVisible(false);
    setDismissed(true);
  }, []);

  useEffect(() => {
    let storedDismissed = false;
    try {
      storedDismissed = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      storedDismissed = false;
    }

    if (storedDismissed || !isMobileDevice()) {
      setDismissed(true);
      return;
    }

    const updateVisibility = () => {
      setVisible(!isStandaloneDisplay());
    };

    updateVisibility();

    const mediaQuery =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(display-mode: standalone)")
        : null;

    const mediaListener = (event: MediaQueryListEvent) => {
      setVisible(!event.matches);
    };

    if (mediaQuery) {
      if (typeof mediaQuery.addEventListener === "function") {
        mediaQuery.addEventListener("change", mediaListener);
      } else if (typeof mediaQuery.addListener === "function") {
        mediaQuery.addListener(mediaListener);
      }
    }

    const handleAppInstalled = () => {
      dismiss();
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (mediaQuery) {
        if (typeof mediaQuery.removeEventListener === "function") {
          mediaQuery.removeEventListener("change", mediaListener);
        } else if (typeof mediaQuery.removeListener === "function") {
          mediaQuery.removeListener(mediaListener);
        }
      }
    };
  }, [dismiss]);

  if (!visible || dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[60]">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Dismiss install instructions"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
            <path
              d="M5 5l10 10m0-10L5 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="grid gap-4 p-4 sm:p-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Install My Year in the Chair</h2>
            <p className="mt-1 text-sm text-slate-600">
              Add this site to your home screen for a full-screen app experience and quicker access.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">iPhone or iPad (Safari)</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-slate-600">
                <li>Tap the <strong>Share</strong> button.</li>
                <li>Select <strong>Add to Home Screen</strong>.</li>
                <li>Choose <strong>Add</strong> to confirm.</li>
              </ol>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Android (Chrome)</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-slate-600">
                <li>Open the <strong>⋮</strong> menu.</li>
                <li>Tap <strong>Add to Home screen</strong>.</li>
                <li>Select <strong>Install</strong> to finish.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
