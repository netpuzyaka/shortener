import { notFound, redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function StatsRedirect({ params }: PageProps<"/stats/[code]">) {
  const { code } = await params;

  try {
    const supabase = getSupabase();
    const { data: link } = await supabase
      .from("links")
      .select("code, track_id")
      .eq("code", code)
      .maybeSingle();

    if (link) {
      redirect(`/track/${link.track_id ?? link.code}`);
    }
  } catch (err) {
    console.error("Ошибка редиректа статистики:", err);
  }

  notFound();
}
