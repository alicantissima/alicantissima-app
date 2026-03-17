


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function init() {
      setError("");

      const hash = window.location.hash;

      if (hash) {
        const params = new URLSearchParams(hash.replace("#", ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const type = params.get("type");

        if (type === "recovery" && access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) {
            setError("Link inválido ou expirado.");
            setChecking(false);
            return;
          }
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Link inválido ou expirado.");
        setChecking(false);
        return;
      }

      setChecking(false);
    }

    init();
  }, [supabase]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("A password deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords não coincidem.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setMessage("Password atualizada!");

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  }

  if (checking) {
    return <p style={{ padding: 20 }}>A validar...</p>;
  }

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "40px auto" }}>
      <h2>Nova password</h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: 12, marginTop: 16 }}
      >
        <input
          type="password"
          placeholder="Nova password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10 }}
        />

        <input
          type="password"
          placeholder="Confirmar password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ padding: 10 }}
        />

        <button disabled={loading} style={{ padding: 10 }}>
          {loading ? "A guardar..." : "Guardar"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      {message && <p style={{ color: "green", marginTop: 12 }}>{message}</p>}
    </div>
  );
}