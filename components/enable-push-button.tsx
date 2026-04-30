


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
  alert("Notificações já estão ativas ✅");
  return;
}
    }

    checkExistingSubscription();
  }, []);

  async function enablePush() {
    try {
      setLoading(true);
      setMessage("");

      if (!("serviceWorker" in navigator)) {
        setMessage("Este browser não suporta notificações.");
        return;
      }

      if (!("PushManager" in window)) {
        setMessage("Este dispositivo não suporta push notifications.");
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setMessage("Notificações não autorizadas.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");

      const existingSubscription =
        await registration.pushManager.getSubscription();

      if (existingSubscription) {
        setEnabled(true);
        setMessage("Notificações já estavam ativas ✅");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Push subscribe API error:", res.status, errorText);
        throw new Error(`Erro ao guardar subscription: ${res.status}`);
      }

      setEnabled(true);
      setMessage("Notificações ativadas ✅");
    } catch (error) {
      console.error("Enable push error:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Erro ao ativar notificações."
      );
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