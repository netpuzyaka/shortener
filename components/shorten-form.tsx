"use client";

import { useState } from "react";
import Link from "next/link";

type ShortenResult = {
  shortUrl: string;
  code: string;
  longUrl: string;
  trackUrl: string;
  external: boolean;
};

type Provider = "own" | "cleanuri" | "clckru";

const PROVIDER_LABELS: Record<Provider, string> = {
  own: "Обычный",
  cleanuri: "CleanURI",
  clckru: "clck.ru",
};

export default function ShortenForm({
  notFoundCode,
  dbError,
}: {
  notFoundCode?: string;
  dbError?: string;
}) {
  const [url, setUrl] = useState("");
  const [provider, setProvider] = useState<Provider>("own");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCopied(false);

    if (!url.trim()) {
      setError("Введите ссылку");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, provider }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Что-то пошло не так");
        return;
      }
      setResult(data);
      setUrl("");
    } catch {
      setError("Не удалось связаться с сервером");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = result.shortUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-col items-center gap-2">
        <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-1">
          {(Object.keys(PROVIDER_LABELS) as Provider[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                provider === p
                  ? "bg-gradient-to-r from-accent to-accent-2 text-white shadow-md shadow-accent/25"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {PROVIDER_LABELS[p]}
            </button>
          ))}
        </div>
        {provider === "own" ? (
          <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-xs text-amber-300 leading-relaxed">
            Предупреждение: обычный сократитель добавляет к домену 10 случайных
            символов, поэтому ссылка может получиться не короче исходной. Хотите
            действительно короткую ссылку — выберите CleanURI или clck.ru.
          </p>
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-zinc-400 leading-relaxed">
            Ссылка будет короче — от сервиса {PROVIDER_LABELS[provider]}.
            Статистика переходов по внешним сервисам у нас не отслеживается.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card p-2 sm:p-3 flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Вставьте длинную ссылку…"
          className="flex-1 rounded-xl bg-white/[0.04] px-4 py-3 text-base text-white outline-none border border-white/10 focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-accent to-accent-2 px-6 py-3 font-semibold text-white shadow-md shadow-accent/25 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? "Сокращаем…" : "Сократить"}
        </button>
      </form>

      {dbError === "db" && (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          Сервис временно недоступен: не удалось подключиться к базе данных.
        </div>
      )}

      {notFoundCode && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">
          Ссылка <span className="font-mono">/{notFoundCode}</span> не найдена. Создайте новую ниже.
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="card mt-4 p-5 !border-accent/40">
          <p className="text-sm text-zinc-400 mb-2">Ваша короткая ссылка готова:</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <a
              href={result.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 truncate rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 font-mono text-sm sm:text-base text-accent-2 hover:border-accent-2/50 hover:bg-accent/10 transition-colors"
            >
              {result.shortUrl}
            </a>
            <button
              onClick={copyLink}
              className="rounded-xl border border-white/15 bg-transparent px-5 py-3 text-sm font-medium text-zinc-300 hover:border-accent hover:text-white transition-colors whitespace-nowrap"
            >
              {copied ? "Скопировано!" : "Копировать"}
            </button>
            {!result.external && (
              <Link
                href={result.trackUrl}
                className="rounded-xl bg-gradient-to-r from-accent to-accent-2 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-accent/25 transition hover:opacity-90 text-center whitespace-nowrap"
              >
                Статистика
              </Link>
            )}
          </div>
          <p className="mt-3 truncate text-xs text-zinc-500">{result.longUrl}</p>
          {result.external && (
            <p className="mt-2 text-xs text-zinc-500">
              Это внешний сервис сокращения — статистика переходов на нашем сайте не отслеживается.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
