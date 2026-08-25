"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LinkStats, RecentClick } from "@/lib/types";

const PIE_COLORS = ["#6d5dfc", "#22d3ee", "#f472b6", "#fbbf24", "#34d399", "#f87171", "#a3e635"];

const nf = new Intl.NumberFormat("ru-RU");
const fmt = (n: number) => nf.format(n);

function maskIp(ip: string | null): string {
  if (!ip) return "—";
  if (ip.includes(".")) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1] ?? "x"}.${parts[2] ?? "x"}.x`;
  }
  const groups = ip.split(":");
  return `${groups[0]}::x`;
}

function fmtDateTime(value: string): string {
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

function fmtDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU");
}

function hostOf(referrer: string | null): string {
  if (!referrer) return "—";
  try {
    return new URL(referrer).hostname;
  } catch {
    return referrer.length > 40 ? referrer.slice(0, 40) + "…" : referrer;
  }
}

function utcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type DayCount = { day: string; cnt: number };

function buildDaySeries(days: DayCount[], n: number) {
  const map = new Map(days.map((d) => [d.day, d.cnt]));
  const out: { day: string; cnt: number }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    const key = utcDay(d);
    out.push({ day: key, cnt: map.get(key) ?? 0 });
  }
  return out;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function ProgressList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: { name: string | null; cnt: number }[];
  emptyText: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.cnt));
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">{emptyText}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.slice(0, 8).map((item, i) => (
            <li key={i}>
              <div className="flex justify-between text-sm">
                <span className="truncate pr-2 text-slate-700">{item.name ?? "Неизвестно"}</span>
                <span className="text-slate-400 shrink-0">{fmt(item.cnt)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                  style={{ width: `${(item.cnt / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  fontSize: "13px",
  color: "#0f172a",
  boxShadow: "0 8px 24px -12px rgba(16,24,40,0.25)",
};

export default function StatsDashboard({
  code,
  url,
  createdAt,
  stats,
  recent,
}: {
  code: string;
  url: string | null;
  createdAt: string | null;
  stats: LinkStats | null;
  recent: RecentClick[];
}) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shortUrl = `${origin}/${code}`;

  const daySeries = useMemo(
    () => buildDaySeries(stats?.clicks_by_day ?? [], 30),
    [stats?.clicks_by_day]
  );

  const hourSeries = useMemo(() => {
    const map = new Map((stats?.clicks_by_hour ?? []).map((h) => [h.hour, h.cnt]));
    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      cnt: map.get(hour) ?? 0,
    }));
  }, [stats?.clicks_by_hour]);

  const todayKey = utcDay(new Date());
  const todayClicks = daySeries.find((d) => d.day === todayKey)?.cnt ?? 0;
  const weekClicks = daySeries.slice(-7).reduce((s, d) => s + d.cnt, 0);

  const countries = (stats?.clicks_by_country ?? []).slice(0, 10);
  const devices = stats?.clicks_by_device ?? [];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }

  if (!stats) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 text-center">
        <div className="card mx-auto max-w-xl p-8">
          <h1 className="text-2xl font-bold text-slate-900">База данных не настроена</h1>
          <p className="mt-3 text-slate-500">
            Выполните SQL-скрипт <span className="font-mono">schema.sql</span> в
            консоли Supabase (SQL Editor) и добавьте ключи проекта в переменные
            окружения.
          </p>
          <Link href="/" className="mt-6 inline-block text-accent hover:underline">
            ← На главную
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
        ← Создать ещё ссылку
      </Link>

      <div className="card mt-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Статистика ссылки
            </p>
            <div className="mt-1 flex items-center gap-2">
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate font-mono text-xl sm:text-2xl font-bold text-accent hover:underline"
              >
                {shortUrl}
              </a>
              <button
                onClick={copyLink}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-accent hover:text-accent transition-colors"
              >
                {copied ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <p className="mt-1 truncate text-sm text-slate-500">
              Ведёт на: <span className="text-slate-700">{url ?? "—"}</span>
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Создана {createdAt ? fmtDateTime(createdAt) : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Всего переходов" value={fmt(stats.total_clicks)} />
        <StatCard label="Уникальных посетителей" value={fmt(stats.unique_visitors)} hint="по IP-адресам" />
        <StatCard label="Переходов сегодня" value={fmt(todayClicks)} />
        <StatCard label="За последние 7 дней" value={fmt(weekClicks)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-900">Переходы за 30 дней</h3>
          {daySeries.every((d) => d.cnt === 0) ? (
            <p className="mt-3 text-sm text-slate-400">
              Пока нет переходов — график появится после первого клика.
            </p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daySeries} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6d5dfc" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.07)" />
                  <XAxis
                    dataKey="day"
                    tickFormatter={(v: string) => v.slice(8) + "." + v.slice(5, 7)}
                    stroke="#94a3b8"
                    fontSize={11}
                    interval={4}
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    labelFormatter={(v) => fmtDate(String(v))}
                    formatter={(v) => [fmt(Number(v ?? 0)), "переходов"]}
                  />
                  <Area type="monotone" dataKey="cnt" stroke="#6d5dfc" strokeWidth={2} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-900">Устройства</h3>
          {devices.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Нет данных</p>
          ) : (
            <>
              <div className="mt-2 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={devices.map((d) => ({ ...d, name: d.name ?? "Другое" }))}
                      dataKey="cnt"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {devices.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1.5">
                {devices.map((d, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-700">
                      <span
                        className="h-2.5 w-2.5 rounded-full inline-block"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      {d.name ?? "Другое"}
                    </span>
                    <span className="text-slate-400">{fmt(d.cnt)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-900">Топ стран</h3>
          {countries.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Нет данных</p>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={countries.map((c) => ({ ...c, name: c.name ?? "Неизвестно" }))}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.07)" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={110} stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v) => [fmt(Number(v ?? 0)), "переходов"]} />
                  <Bar dataKey="cnt" radius={[0, 6, 6, 0]} fill="#6d5dfc" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-900">Активность по часам (UTC)</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourSeries} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis
                  dataKey="hour"
                  stroke="#94a3b8"
                  fontSize={10}
                  interval={3}
                />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(v) => [fmt(Number(v ?? 0)), "переходов"]}
                />
                <Bar dataKey="cnt" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ProgressList title="Браузеры" items={stats.clicks_by_browser} emptyText="Нет данных" />
        <ProgressList title="Операционные системы" items={stats.clicks_by_os} emptyText="Нет данных" />
        <ProgressList title="Источники переходов" items={stats.clicks_by_referrer.map((r) => ({ ...r, name: hostOf(r.name) }))} emptyText="Нет данных" />
        <ProgressList title="Города" items={stats.clicks_by_city} emptyText="Нет данных" />
        <ProgressList title="Регионы" items={stats.clicks_by_region} emptyText="Нет данных" />
      </div>

      <div className="card mt-6 overflow-hidden">
        <h3 className="p-5 pb-3 font-semibold text-slate-900">Последние переходы</h3>
        {recent.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-slate-400">
            Переходов пока нет. Откройте короткую ссылку, чтобы увидеть статистику.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 font-medium">Время</th>
                  <th className="px-5 py-3 font-medium">IP</th>
                  <th className="px-5 py-3 font-medium">Страна</th>
                  <th className="px-5 py-3 font-medium">Регион</th>
                  <th className="px-5 py-3 font-medium">Город</th>
                  <th className="px-5 py-3 font-medium">Устройство</th>
                  <th className="px-5 py-3 font-medium">Браузер</th>
                  <th className="px-5 py-3 font-medium">Откуда</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                    <td className="px-5 py-3 whitespace-nowrap text-slate-600">{fmtDateTime(c.created_at)}</td>
                    <td className="px-5 py-3 font-mono text-slate-400">{maskIp(c.ip)}</td>
                    <td className="px-5 py-3 text-slate-700">{c.country ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-700">{c.region ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-700">{c.city ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-700">{c.device ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-700">{c.browser ?? "—"}</td>
                    <td className="px-5 py-3 max-w-40 truncate text-slate-400" title={c.referrer ?? ""}>
                      {hostOf(c.referrer)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
