import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/supabase";
import Dashboard from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Мои ссылки — LinkShort",
};

export const dynamic = "force-dynamic";

export type UserLink = {
  id: string;
  code: string;
  url: string;
  track_id: string | null;
  created_at: string;
  total_clicks: number;
  last_click_at: string | null;
};

export default async function DashboardPage() {
  let userEmail: string | null = null;
  let links: UserLink[] = [];

  try {
    const auth = await createClient();
    const {
      data: { user },
    } = await auth.auth.getUser();

    if (user) {
      const supabase = getSupabase();
      const { data } = await supabase.rpc("user_links_stats", {
        p_user_id: user.id,
      });
      userEmail = user.email ?? "";
      links = (data ?? []) as UserLink[];
    }
  } catch (err) {
    console.error("Ошибка загрузки кабинета:", err);
  }

  if (!userEmail) {
    redirect("/login?next=/dashboard");
  }

  return <Dashboard links={links} email={userEmail} />;
}
