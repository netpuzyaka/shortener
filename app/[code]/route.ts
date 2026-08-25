import { NextRequest, NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const BOT_RE =
  /bot|crawler|spider|slurp|curl|wget|python|headless|scrapy|semrush|ahrefs|petalbot|bytespider|bingpreview|facebookexternalhit|whatsapp|telegram|preview|monitoring|uptime|pingdom|newrelic|datadog|googlebot|yandex/i;

function getClientIp(req: NextRequest): string | null {
  const real = req.headers.get("x-real-ip");
  if (real) return real.split(",")[0].trim() || null;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || null;
  return null;
}

export async function GET(req: NextRequest, ctx: RouteContext<"/[code]">) {
  const { code } = await ctx.params;

  let supabase: SupabaseClient;
  try {
    supabase = getSupabase();
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(new URL("/?error=db", req.nextUrl.origin), 307);
  }

  let link: { id: string; url: string } | null = null;

  try {
    const { data } = await supabase
      .from("links")
      .select("id, url")
      .eq("code", code)
      .maybeSingle();
    link = data;
  } catch (err) {
    console.error("Ошибка поиска ссылки:", err);
    return NextResponse.redirect(
      new URL("/?error=db", req.nextUrl.origin),
      307
    );
  }

  if (!link) {
    return NextResponse.redirect(
      new URL(`/?notfound=${encodeURIComponent(code)}`, req.nextUrl.origin),
      307
    );
  }

  const userAgent = req.headers.get("user-agent") ?? "";
  const parsed = new UAParser(userAgent).getResult();

  let device: string = parsed.device.type ?? "desktop";
  if (BOT_RE.test(userAgent)) device = "bot";

  const click = {
    link_id: link.id,
    ip: getClientIp(req),
    country: req.headers.get("x-vercel-ip-country") ?? null,
    region: req.headers.get("x-vercel-ip-country-region") ?? null,
    city: req.headers.get("x-vercel-ip-city") ?? null,
    latitude: req.headers.get("x-vercel-ip-latitude") ?? null,
    longitude: req.headers.get("x-vercel-ip-longitude") ?? null,
    timezone: req.headers.get("x-vercel-ip-timezone") ?? null,
    device,
    browser: parsed.browser.name ?? null,
    os: parsed.os.name ?? null,
    referrer: req.headers.get("referer") ?? null,
    user_agent: userAgent.slice(0, 500) || null,
  };

  try {
    await supabase.from("clicks").insert(click);
  } catch (err) {
    console.error("Не удалось записать переход:", err);
  }

  return NextResponse.redirect(link.url, 307);
}
