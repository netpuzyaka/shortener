import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import StatsDashboard from "@/components/stats-dashboard";
import type { LinkStats, RecentClick } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/track/[code]">): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Статистика /${code} — LinkShort`,
    description: `Статистика переходов по ссылке /${code}`,
  };
}

export default async function TrackPage({ params }: PageProps<"/track/[code]">) {
  const { code } = await params;

  let dbError = false;
  let link: { id: string; code: string; url: string; created_at: string } | null = null;
  let stats: LinkStats | null = null;
  let recent: RecentClick[] = [];

  try {
    const supabase = getSupabase();

    const linkResult = await supabase
      .from("links")
      .select("id, code, url, created_at")
      .eq("code", code)
      .maybeSingle();
    link = linkResult.data;

    if (link) {
      const statsResult = await supabase.rpc("link_stats", {
        p_link_id: link.id,
      });
      stats = statsResult.data as LinkStats | null;

      const recentResult = await supabase
        .from("clicks")
        .select("ip, country, region, city, device, browser, os, referrer, created_at")
        .eq("link_id", link.id)
        .order("created_at", { ascending: false })
        .limit(20);
      recent = (recentResult.data ?? []) as RecentClick[];
    }
  } catch (err) {
    console.error("Ошибка загрузки статистики:", err);
    dbError = true;
  }

  if (dbError) {
    return <StatsDashboard code={code} url={null} createdAt={null} stats={null} recent={[]} />;
  }

  if (!link) notFound();

  return (
    <StatsDashboard
      code={link.code}
      url={link.url}
      createdAt={link.created_at}
      stats={stats}
      recent={recent}
    />
  );
}
