import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/supabase";
import { shortenWithTopvisor } from "@/lib/topvisor";

export const dynamic = "force-dynamic";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const CODE_LENGTH = 10;
const TRACK_LENGTH = 16;

function generateToken(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let token = "";
  for (let i = 0; i < length; i++) {
    token += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return token;
}

function normalizeUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let value = raw.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = "https://" + value;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (
      process.env.NODE_ENV === "production" &&
      (parsed.hostname === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.hostname))
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const url = normalizeUrl(body?.url);

  if (!url) {
    return NextResponse.json(
      { error: "Некорректная ссылка. Пример: https://example.com/page" },
      { status: 400 }
    );
  }

  if (url.length > 2048) {
    return NextResponse.json(
      { error: "Ссылка слишком длинная (максимум 2048 символов)" },
      { status: 400 }
    );
  }

  let userId: string | null = null;
  try {
    const auth = await createClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  const provider = body?.provider === "topvisor" ? "topvisor" : "own";

  let externalShortUrl: string | null = null;
  if (provider === "topvisor") {
    try {
      externalShortUrl = await shortenWithTopvisor(url);
    } catch (err) {
      console.error("Ошибка Topvisor:", err);
      const message = err instanceof Error ? err.message : "";
      if (message.startsWith("TOPVISOR_NOT_CONFIGURED")) {
        return NextResponse.json(
          { error: "Сокращение через Topvisor не настроено на этом сайте" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error: message.startsWith("TOPVISOR_ERROR")
            ? `Topvisor не смог сократить ссылку: ${message.slice("TOPVISOR_ERROR: ".length)}`
            : "Topvisor временно недоступен, попробуйте ещё раз",
        },
        { status: 502 }
      );
    }
  }

  let supabase: SupabaseClient;
  try {
    supabase = getSupabase();
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "База данных не настроена. Добавьте SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в переменные окружения" },
      { status: 500 }
    );
  }

  let code = "";
  let trackId = "";

  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateToken(CODE_LENGTH);
      const { data: existing } = await supabase
        .from("links")
        .select("id")
        .eq("code", candidate)
        .maybeSingle();
      if (!existing) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      return NextResponse.json(
        { error: "Не удалось сгенерировать код, попробуйте ещё раз" },
        { status: 500 }
      );
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateToken(TRACK_LENGTH);
      const { data: existing } = await supabase
        .from("links")
        .select("id")
        .eq("track_id", candidate)
        .maybeSingle();
      if (!existing) {
        trackId = candidate;
        break;
      }
    }
    if (!trackId) {
      return NextResponse.json(
        { error: "Не удалось сгенерировать идентификатор статистики, попробуйте ещё раз" },
        { status: 500 }
      );
    }

    const { data: link, error } = await supabase
      .from("links")
      .insert({ code, url, user_id: userId, track_id: trackId, short_url: externalShortUrl })
      .select("code, url, track_id, short_url")
      .single();

    if (error || !link) {
      console.error("Ошибка создания ссылки:", error);
      const detail = error?.message ?? "неизвестная ошибка";
      let hint = "";
      if (detail.includes("fetch failed")) {
        hint = ". Сайт не может достучаться до Supabase: проверьте переменную SUPABASE_URL на Vercel — она должна быть вида https://ВАШ-ПРОЕКТ.supabase.co";
      } else if (detail.toLowerCase().includes("does not exist")) {
        hint = ". Выполните schema.sql в SQL Editor Supabase";
      }
      return NextResponse.json(
        { error: `Не удалось создать ссылку: ${detail}${hint}` },
        { status: 500 }
      );
    }

    const origin = req.nextUrl.origin;

    return NextResponse.json({
      shortUrl: link.short_url ?? `${origin}/${link.code}`,
      code: link.code,
      longUrl: link.url,
      trackUrl: `${origin}/track/${link.track_id}`,
      external: Boolean(link.short_url),
    });
  } catch (err) {
    console.error("Ошибка создания ссылки:", err);
    return NextResponse.json(
      { error: "Не удалось подключиться к базе данных. Проверьте переменные окружения" },
      { status: 500 }
    );
  }
}
