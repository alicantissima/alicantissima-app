


"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    setIsInstalled(isInStandaloneMode());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowIosHelp(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (isInstalled) return;

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }

    if (isIos()) {
      setShowIosHelp(true);
      return;
    }

    alert("To install the app, use your browser menu and choose 'Install app' or 'Add to Home Screen'.");
  }

  if (isInstalled) return null;

  return (
    <div className="space-y-3">
      <button
        onClick={handleInstall}
        className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold border shadow-sm hover:opacity-90 transition"
      >
        Install App
      </button>

      {showIosHelp && (
        <div className="rounded-2xl border p-4 text-sm leading-6 bg-white/80">
          <p className="font-semibold mb-2">Install on iPhone</p>
          <p>
            In Safari, tap the <strong>Share</strong> button and then choose{" "}
            <strong>Add to Home Screen</strong>.
          </p>
        </div>
      )}
    </div>
  );
}