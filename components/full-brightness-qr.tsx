


"use client";

import { useEffect, useState } from "react";
import BookingPass from "@/components/booking-pass";

type Props = {
  code: string;
  label: string;
  closeLabel: string;
};

export default function FullBrightnessQr({ code, label, closeLabel }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const checkLandscape = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const isSmallScreen = Math.max(window.innerWidth, window.innerHeight) < 1200;

      if (isLandscape && isSmallScreen) {
        setOpen(true);
      }
    };

    checkLandscape();
    window.addEventListener("resize", checkLandscape);
    window.addEventListener("orientationchange", checkLandscape);

    return () => {
      window.removeEventListener("resize", checkLandscape);
      window.removeEventListener("orientationchange", checkLandscape);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousBackground = document.body.style.backgroundColor;

    document.body.style.overflow = "hidden";
    document.body.style.backgroundColor = "#ffffff";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.backgroundColor = previousBackground;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex rounded-xl border px-4 py-2 text-sm font-medium"
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white p-4"
          onClick={() => setOpen(false)}
        >
          <div className="mb-4 text-sm font-medium text-gray-500">{closeLabel}</div>

          <div className="scale-125 sm:scale-150">
            <BookingPass code={code} />
          </div>
        </div>
      )}
    </>
  );
}