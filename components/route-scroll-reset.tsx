


"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function RouteScrollReset() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const notifyParentAndScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      try {
        window.parent?.postMessage({ type: "alicantissima-scroll-top" }, "*");
      } catch {}
    };

    notifyParentAndScroll();

    const raf1 = requestAnimationFrame(notifyParentAndScroll);
    const raf2 = requestAnimationFrame(notifyParentAndScroll);
    const t1 = window.setTimeout(notifyParentAndScroll, 120);
    const t2 = window.setTimeout(notifyParentAndScroll, 300);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname, searchParams]);

  return null;
}