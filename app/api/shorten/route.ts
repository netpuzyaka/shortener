import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const CODE_LENGTH = 10;

const RESERVED = new Set([
  "stats",
  "track",
  "api",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "index",
  "404",
  "not-found",
  "vercel",
]);

function generateCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
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

  let code = typeof body?.custom === "string" ? body.custom.trim() : "";

  if (code) {
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(code) || RESERVED.has(code.toLowerCase())) {
      return NextResponse.json(
        {
          error:
            "Код может содержать только латиницу, цифры, дефис и подчёркивание (от 3 до 32 символов)",
        },
        { status: 400 }
      );
    }
    try {
      const { data: existing } = await supabase
        .from("links")
        .select("id")
        .eq("code", code)
        .maybeSingle();
      if (existing) {
        return NextResponse.json(
          { error: "Этот код уже занят, выберите другой" },
          { status: 409 }
        );
      }
    } catch (err) {
      console.error("Ошибка проверки кода:", err);
      return NextResponse.json(
        { error: "Не удалось подключиться к базе данных. Проверьте переменные окружения" },
        { status: 500 }
      );
    }
  } else {
    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateCode();
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
    } catch (err) {
      console.error("Ошибка генерации кода:", err);
      return NextResponse.json(
        { error: "Не удалось подключиться к базе данных. Проверьте переменные окружения" },
        { status: 500 }
      );
    }
    if (!code) {
      return NextResponse.json(
        { error: "Не удалось сгенерировать код, попробуйте ещё раз" },
        { status: 500 }
      );
    }
  }

  try {
    const { data: link, error } = await supabase
      .from("links")
      .insert({ code, url })
      .select("code, url")
      .single();

    if (error || !link) {
      console.error("Ошибка создания ссылки:", error);
      const detail = error?.message ?? "неизвестная ошибка";
      return NextResponse.json(
        {
          error: `Не удалось создать ссылку: ${detail}. Если написано "relation ... does not exist" — выполните schema.sql в SQL Editor Supabase`,
        },
        { status: 500 }
      );
    }

    const origin = req.nextUrl.origin;

    return NextResponse.json({
      shortUrl: `${origin}/${link.code}`,
      code: link.code,
      longUrl: link.url,
      statsUrl: `${origin}/stats/${link.code}`,
    });
  } catch (err) {
    console.error("Ошибка создания ссылки:", err);
    return NextResponse.json(
      { error: "Не удалось подключиться к базе данных. Проверьте переменные окружения" },
      { status: 500 }
    );
  }
}
