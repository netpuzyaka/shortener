"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      /* noop */
    }
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="text-sm text-zinc-400 hover:text-white transition-colors"
    >
      Выйти
    </button>
  );
}
