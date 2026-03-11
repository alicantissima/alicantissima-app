


"use client";

import { useEffect } from "react";

export default function IframeHeightReporter() {
  useEffect(() => {
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

      window.parent.postMessage(
        {
          type: "ALICANTISSIMA_IFRAME_HEIGHT",
          height: getHeight(),
        },
        "*"
      );
    }

    const resizeObserver = new ResizeObserver(() => {
      postHeight();
    });

    resizeObserver.observe(document.body);
    resizeObserver.observe(document.documentElement);

    const timeout1 = window.setTimeout(postHeight, 200);
    const timeout2 = window.setTimeout(postHeight, 800);
    const timeout3 = window.setTimeout(postHeight, 1500);

    window.addEventListener("load", postHeight);
    window.addEventListener("resize", postHeight);

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "ALICANTISSIMA_REQUEST_HEIGHT") {
        postHeight();
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      resizeObserver.disconnect();
      window.clearTimeout(timeout1);
      window.clearTimeout(timeout2);
      window.clearTimeout(timeout3);
      window.removeEventListener("load", postHeight);
      window.removeEventListener("resize", postHeight);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return null;
}