


"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Props = {
  className?: string;
};

export default function LogoutButton({ className }: Props) {
  const supabase = createClient();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className={
        className ??
        "inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium hover:bg-gray-50"
      }
    >
      Logout
    </button>
  );
}