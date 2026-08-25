"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { UserLink } from "@/app/dashboard/page";

const nf = new Intl.NumberFormat("ru-RU");

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function providerBadge(shortUrl: string | null): string | null {
  if (!shortUrl) return null;
  try {
    const host = new URL(shortUrl).hostname;
    if (host.includes("cleanuri")) return "CleanURI";
    if (host.includes("clck.ru")) return "clck.ru";
    return "Внешний";
  } catch {
    return null;
  }
}

export default function Dashboard({
  links,
  email,
}: {
  links: UserLink[];
  email: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<UserLink[]>(links);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function copy(value: string) {
    const text = value.startsWith("http") ? value : `${origin}/${value}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(value);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      /* noop */
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Удалить ссылку и всю её статистику?")) return;
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Не удалось удалить ссылку");
        return;
      }
      setItems((prev) => prev.filter((l) => l.id !== id));
      router.refresh();
    } catch {
      setError("Не удалось связаться с сервером");
    } finally {
      setDeleting(null);
    }
  }

  const totalClicks = items.reduce((s, l) => s + l.total_clicks, 0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Мои ссылки
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {email} · {nf.format(items.length)} ссылок · {nf.format(totalClicks)}{" "}
            переходов всего
          </p>
        </div>
        <Link
          href="/"
          className="rounded-xl bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/25 transition hover:opacity-90 text-center"
        >
          + Новая ссылка
        </Link>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-lg font-semibold text-white">Здесь пока пусто</p>
          <p className="mt-2 text-sm text-zinc-400">
            Сократите первую ссылку — она появится в этом списке, если вы
            вошли в аккаунт.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-gradient-to-r from-accent to-accent-2 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-accent/25 transition hover:opacity-90"
          >
            Сократить ссылку
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {items.map((link) => (
            <div
              key={link.id}
              className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <a
                    href={link.short_url ?? `${origin}/${link.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate font-mono text-base sm:text-lg font-semibold text-accent-2 hover:underline"
                  >
                    {link.short_url ?? `${origin}/${link.code}`}
                  </a>
                  <button
                    onClick={() => copy(link.short_url ?? link.code)}
                    className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1 text-xs text-zinc-300 hover:border-accent hover:text-white transition-colors"
                  >
                    {copiedCode === (link.short_url ?? link.code) ? "Скопировано!" : "Копировать"}
                  </button>
                  {providerBadge(link.short_url) && (
                    <span className="shrink-0 rounded-md border border-accent-2/30 bg-accent-2/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-2">
                      {providerBadge(link.short_url)}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-zinc-400">
                  Ведёт на: <span className="text-zinc-300">{link.url}</span>
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Создана {fmtDate(link.created_at)}
                  {link.last_click_at
                    ? ` · последний переход ${fmtDate(link.last_click_at)}`
                    : " · переходов пока нет"}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-xl font-bold text-white">
                    {nf.format(link.total_clicks)}
                  </p>
                  <p className="text-xs text-zinc-500">переходов</p>
                </div>
                <Link
                  href={`/track/${link.track_id ?? link.code}`}
                  className="rounded-xl bg-gradient-to-r from-accent to-accent-2 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/25 transition hover:opacity-90 whitespace-nowrap"
                >
                  Статистика
                </Link>
                <button
                  onClick={() => remove(link.id)}
                  disabled={deleting === link.id}
                  className="rounded-xl border border-red-400/30 px-4 py-2.5 text-sm text-red-300 hover:bg-red-400/10 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {deleting === link.id ? "…" : "Удалить"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
