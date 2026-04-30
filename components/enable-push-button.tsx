


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
        setMessage("Notificações ativas ✅");
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
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={enablePush}
        disabled={loading || enabled}
        className="rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        {loading
          ? "A ativar..."
          : enabled
            ? "Notificações ON"
            : "Ativar notificações"}
      </button>

      {message && (
        <p className="max-w-[130px] text-center text-xs text-slate-600">
          {message}
        </p>
      )}
    </div>
  );
}