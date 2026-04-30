


"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function EnablePushButton() {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
  async function checkExistingSubscription() {
    if (!("serviceWorker" in navigator)) return;
    if (!("PushManager" in window)) return;

    const registration = await navigator.serviceWorker.register("/sw.js");
    const existingSubscription =
      await registration.pushManager.getSubscription();

    if (existingSubscription) {
      setEnabled(true);
    }
  }

  checkExistingSubscription();
}, []);

  async function enablePush() {
  try {
    setLoading(true);

    if (!("serviceWorker" in navigator)) return;
    if (!("PushManager" in window)) return;

    const registration = await navigator.serviceWorker.register("/sw.js");

    const existingSubscription =
      await registration.pushManager.getSubscription();

    // 👉 SE JÁ ESTÁ ATIVO → DESLIGA
    if (existingSubscription) {
      await existingSubscription.unsubscribe();
      setEnabled(false);
      setMessage("Notificações desligadas 🔕");
      return;
    }

    // 👉 SENÃO → ATIVA
    const permission = await Notification.requestPermission();

    if (permission !== "granted") return;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    });

    setEnabled(true);
    setMessage("Notificações ativadas 🔔");
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
}

  return (
  <button
    type="button"
    onClick={enablePush}
    disabled={loading}
    className={`flex items-center justify-center rounded-full px-3 py-1 text-xs transition
      ${
        enabled
          ? "bg-gray-200 text-gray-700"
          : "bg-black text-white hover:opacity-90"
      }
      disabled:opacity-60
    `}
  >
    {loading ? "…" : enabled ? "🔔" : "Ativar 🔔"}
  </button>
);
}