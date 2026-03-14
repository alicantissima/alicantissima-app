


"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function RouteScrollReset() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const scrollNow = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      try {
        window.parent?.postMessage({ type: "alicantissima-scroll-top" }, "*");
      } catch {
        // ignore
      }
    };

    scrollNow();

    const raf1 = requestAnimationFrame(scrollNow);
    const raf2 = requestAnimationFrame(scrollNow);
    const timeout = window.setTimeout(scrollNow, 150);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timeout);
    };
  }, [pathname, searchParams]);

  return null;
}