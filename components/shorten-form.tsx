"use client";

import { useState } from "react";
import Link from "next/link";

type ShortenResult = {
  shortUrl: string;
  code: string;
  longUrl: string;
  statsUrl: string;
};

export default function ShortenForm({
  notFoundCode,
  dbError,
}: {
  notFoundCode?: string;
  dbError?: string;
}) {
  const [url, setUrl] = useState("");
  const [custom, setCustom] = useState("");
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
        body: JSON.stringify({ url, custom }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Что-то пошло не так");
        return;
      }
      setResult(data);
      setUrl("");
      setCustom("");
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
      <form onSubmit={handleSubmit} className="card p-2 sm:p-3 flex flex-col sm:flex-row gap-2 shadow-lg">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Вставьте длинную ссылку…"
          className="flex-1 rounded-xl bg-white px-4 py-3 text-base text-slate-900 outline-none border border-slate-200 focus:border-accent focus:ring-2 focus:ring-accent/15 transition"
          autoComplete="off"
          spellCheck={false}
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
            placeholder="Свой код"
            maxLength={32}
            className="w-32 rounded-xl bg-white px-4 py-3 text-base text-slate-900 outline-none border border-slate-200 focus:border-accent focus:ring-2 focus:ring-accent/15 transition font-mono"
            autoComplete="off"
            spellCheck={false}
            title="Необязательно: свой короткий код (латиница, цифры, - и _)"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-accent to-accent-2 px-6 py-3 font-semibold text-white shadow-md shadow-accent/25 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? "Сокращаем…" : "Сократить"}
          </button>
        </div>
      </form>

      {dbError === "db" && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Сервис временно недоступен: не удалось подключиться к базе данных.
        </div>
      )}

      {notFoundCode && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Ссылка <span className="font-mono">/{notFoundCode}</span> не найдена. Создайте новую ниже.
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {result && (
        <div className="card mt-4 p-5 !border-accent/40">
          <p className="text-sm text-slate-500 mb-2">Ваша короткая ссылка готова:</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <a
              href={result.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 truncate rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 font-mono text-sm sm:text-base text-accent hover:border-accent/50 hover:bg-accent/5 transition-colors"
            >
              {result.shortUrl}
            </a>
            <button
              onClick={copyLink}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:border-accent hover:text-accent transition-colors whitespace-nowrap"
            >
              {copied ? "Скопировано!" : "Копировать"}
            </button>
            <Link
              href={`/track/${result.code}`}
              className="rounded-xl bg-gradient-to-r from-accent to-accent-2 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-accent/25 transition hover:opacity-90 text-center whitespace-nowrap"
            >
              Статистика
            </Link>
          </div>
          <p className="mt-3 truncate text-xs text-slate-400">{result.longUrl}</p>
        </div>
      )}
    </div>
  );
}
