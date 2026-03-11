


"use client";

import { useEffect } from "react";

export default function IframeHeightReporter() {
  useEffect(() => {
    let lastHeight = 0;

    function getHeight() {
      const body = document.body;
      const html = document.documentElement;

      return Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.scrollHeight,
        html.offsetHeight,
        html.clientHeight
      );
    }

    function postHeight() {
      if (window.parent === window) return;

      const height = getHeight();

      if (Math.abs(height - lastHeight) < 20) return;

      lastHeight = height;

      window.parent.postMessage(
        {
          type: "ALICANTISSIMA_IFRAME_HEIGHT",
          height,
        },
        "*"
      );
    }

    const observer = new ResizeObserver(() => {
      postHeight();
    });

    observer.observe(document.body);

    const t1 = setTimeout(postHeight, 200);
    const t2 = setTimeout(postHeight, 800);

    window.addEventListener("load", postHeight);
    window.addEventListener("resize", postHeight);

    return () => {
      observer.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("load", postHeight);
      window.removeEventListener("resize", postHeight);
    };
  }, []);

  return null;
}