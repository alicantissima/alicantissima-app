


"use client";

import { useEffect } from "react";

export default function IframeHeightReporter() {
  useEffect(() => {
    let lastSentHeight = 0;
    let frameRequested = false;
    let rafId = 0;

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

    function sendHeight(force = false) {
      if (window.parent === window) return;

      const height = getHeight();

      if (!force && Math.abs(height - lastSentHeight) < 24) return;

      lastSentHeight = height;

      window.parent.postMessage(
        {
          type: "ALICANTISSIMA_IFRAME_HEIGHT",
          height,
        },
        "*"
      );
    }

    function scheduleHeight(force = false) {
      cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        sendHeight(force);
      });
    }

    const resizeObserver = new ResizeObserver(() => {
      scheduleHeight(false);
    });

    resizeObserver.observe(document.body);
    resizeObserver.observe(document.documentElement);

    const mutationObserver = new MutationObserver(() => {
      scheduleHeight(false);
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: false,
    });

    const onLoad = () => scheduleHeight(true);
    const onResize = () => scheduleHeight(false);

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "ALICANTISSIMA_REQUEST_HEIGHT") {
        frameRequested = true;
        scheduleHeight(true);
      }
    };

    window.addEventListener("load", onLoad);
    window.addEventListener("resize", onResize);
    window.addEventListener("message", onMessage);

    const t1 = window.setTimeout(() => scheduleHeight(true), 150);
    const t2 = window.setTimeout(() => scheduleHeight(true), 600);
    const t3 = window.setTimeout(() => scheduleHeight(true), 1200);

    if (!frameRequested) {
      scheduleHeight(true);
    }

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener("load", onLoad);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return null;
}