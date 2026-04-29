


"use client";

import { useState } from "react";

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
  const [message, setMessage] = useState("");

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
        throw new Error("Erro ao guardar subscription");
      }

      setMessage("Notificações ativadas neste dispositivo ✅");
    } catch (error) {
      console.error(error);
      setMessage("Erro ao ativar notificações.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={enablePush}
        disabled={loading}
        className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "A ativar..." : "Ativar notificações"}
      </button>

      {message && (
        <p className="mt-2 text-sm text-slate-600">
          {message}
        </p>
      )}
    </div>
  );
}