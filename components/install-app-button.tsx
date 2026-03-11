

"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (standalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 5000); // aparece após 5 segundos

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const isIOS =
    typeof window !== "undefined" &&
    /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  async function handleInstall() {
    if (isInstalled) return;

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowBanner(false);
      return;
    }

    if (isIOS) {
      setShowIosHelp(true);
      return;
    }

    alert("Use your browser menu and choose 'Install app' or 'Add to Home Screen'.");
  }

  if (isInstalled || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 md:hidden">
      <div className="flex w-full max-w-md items-center justify-between rounded-2xl border bg-white p-3 shadow-lg">

        <div className="flex flex-col text-left">
          <span className="text-sm font-semibold">
            Install Alicantíssima
          </span>
          <span className="text-xs text-gray-500">
            Faster booking on your phone
          </span>
        </div>

        <button
          onClick={handleInstall}
          className="ml-4 rounded-xl border px-3 py-1 text-sm font-semibold hover:bg-gray-50"
        >
          Install
        </button>

      </div>

      {showIosHelp && (
        <div className="absolute bottom-20 rounded-xl border bg-white p-4 text-sm shadow">
          In Safari tap <strong>Share</strong> →{" "}
          <strong>Add to Home Screen</strong>
        </div>
      )}
    </div>
  );
}