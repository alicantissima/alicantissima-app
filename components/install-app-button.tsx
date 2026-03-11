


"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "alicantissima-install-banner-dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const installed = isStandalone();
    setIsInstalled(installed);

    if (installed) {
      setShowBanner(false);
      return;
    }

    const dismissed = localStorage.getItem(STORAGE_KEY) === "true";

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      setShowIosHelp(false);
      localStorage.setItem(STORAGE_KEY, "true");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    let timer: number | undefined;

    if (!dismissed) {
      timer = window.setTimeout(() => {
        setShowBanner(true);
      }, 5000);
    }

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }

      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (isInstalled) return;

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === "accepted") {
        localStorage.setItem(STORAGE_KEY, "true");
        setShowBanner(false);
      }

      setDeferredPrompt(null);
      return;
    }

    if (isIos()) {
      setShowIosHelp(true);
      return;
    }

    alert("Use your browser menu and choose 'Install app' or 'Add to Home Screen'.");
  }

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, "true");
    setShowBanner(false);
    setShowIosHelp(false);
  }

  if (isInstalled || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 md:hidden">
      <div className="w-full max-w-md rounded-2xl border bg-white p-3 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold">
              App Alicantíssima
            </span>
            <span className="text-xs text-gray-500">
              Faster booking on your phone
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="rounded-xl border px-3 py-1 text-sm font-semibold hover:bg-gray-50"
            >
              Install
            </button>

            <button
              onClick={handleClose}
              aria-label="Close"
              className="rounded-xl border px-3 py-1 text-sm text-gray-500 hover:bg-gray-50"
            >
              ✕
            </button>
          </div>
        </div>

        {showIosHelp && (
          <div className="mt-3 rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
            In Safari, tap <strong>Share</strong> and then{" "}
            <strong>Add to Home Screen</strong>.
          </div>
        )}
      </div>
    </div>
  );
}