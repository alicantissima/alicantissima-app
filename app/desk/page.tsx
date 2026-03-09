


import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminQrScanner from "@/components/admin-qr-scanner";
import AdminFinishQrScanner from "@/components/admin-finish-qr-scanner";
import LogoutButton from "@/components/logout-button";

export default async function DeskPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return <div className="p-6">Acesso negado.</div>;
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Front Desk</h1>
          <p className="text-sm text-gray-500">Sessão: {profile.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Abrir Admin
          </Link>

          <Link
            href="/"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Homepage
          </Link>

          <LogoutButton />
        </div>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-bold">Check-in</h2>
            <p className="mt-1 text-sm text-gray-500">
              Faz scan do QR do cliente para marcar entrada e abrir a reserva.
            </p>
          </div>

          <div className="flex justify-center">
            <AdminQrScanner />
          </div>
        </div>

        <div className="rounded-3xl border p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-bold">Finish</h2>
            <p className="mt-1 text-sm text-gray-500">
              Faz scan do QR para finalizar a reserva no momento da saída.
            </p>
          </div>

          <div className="flex justify-center">
            <AdminFinishQrScanner />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-gray-50 p-5">
        <h3 className="text-lg font-bold">Sugestão de uso</h3>
        <p className="mt-2 text-sm text-gray-600">
          Guarda esta página como atalho no telemóvel ou no PC para teres um
          modo de balcão rápido:
          <span className="ml-1 font-semibold">/desk</span>
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-sm font-semibold">1. Abrir /desk</div>
            <div className="mt-1 text-sm text-gray-600">
              Deixa esta página pronta no balcão.
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4">
            <div className="text-sm font-semibold">2. Scan QR</div>
            <div className="mt-1 text-sm text-gray-600">
              Usa Check-in ou Finish conforme o momento do cliente.
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4">
            <div className="text-sm font-semibold">3. Reserva abre logo</div>
            <div className="mt-1 text-sm text-gray-600">
              O sistema leva-te diretamente ao detalhe da reserva.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}