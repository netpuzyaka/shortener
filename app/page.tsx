import ShortenForm from "@/components/shorten-form";
import Counter from "@/components/counter";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    title: "Геолокация переходов",
    text: "Страна, регион и город каждого посетителя определяются автоматически по IP — без внешних сервисов.",
  },
  {
    title: "Уникальные посетители",
    text: "Считаем не только клики, но и уникальных посетителей, чтобы вы видели реальный охват.",
  },
  {
    title: "Устройства и браузеры",
    text: "Телефон, планшет или компьютер — и какой браузер и ОС использовал посетитель.",
  },
  {
    title: "Источники переходов",
    text: "Откуда пришёл человек: с какого сайта, из мессенджера или по прямой ссылке.",
  },
  {
    title: "Графики по дням и часам",
    text: "Динамика переходов за 30 дней и активность по часам — когда ваша ссылка работает.",
  },
  {
    title: "Мгновенный редирект",
    text: "Переход происходит сразу после записи статистики — посетитель ничего не замечает.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Вставьте ссылку",
    text: "Любую длинную ссылку — уникальный короткий код сгенерируется автоматически.",
  },
  {
    step: "2",
    title: "Делитесь короткой ссылкой",
    text: "Отправляйте её в соцсетях, мессенджерах, на сайте или в рекламе.",
  },
  {
    step: "3",
    title: "Следите за аналитикой",
    text: "Каждый переход фиксируется: откуда, на каком устройстве и в какое время зашёл посетитель.",
  },
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const notFoundCode =
    typeof params.notfound === "string" ? params.notfound : undefined;
  const dbError = typeof params.error === "string" ? params.error : undefined;

  let totalLinks: number | null = null;
  let linksToday: number | null = null;

  try {
    const supabase = getSupabase();
    const { data } = await supabase.rpc("site_stats");
    totalLinks = data?.total_links ?? 0;
    linksToday = data?.links_24h ?? 0;
  } catch {
    totalLinks = null;
    linksToday = null;
  }

  return (
    <main className="flex-1 w-full">
      <section className="mx-auto w-full max-w-5xl px-4 pt-16 pb-14 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Бесплатно · Без регистрации · Без ограничений
        </div>
        <h1 className="mx-auto max-w-2xl text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-slate-900">
          Сокращайте ссылки и{" "}
          <span className="text-gradient">отслеживайте переходы</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
          Узнайте, кто переходит по вашей ссылке: страна, регион, город,
          устройство, браузер и источник каждого клика.
        </p>
        <div className="mx-auto mt-10 max-w-2xl">
          <ShortenForm notFoundCode={notFoundCode} dbError={dbError} />
        </div>

        {totalLinks !== null && linksToday !== null && (
          <div className="mx-auto mt-12 grid max-w-2xl gap-4 sm:grid-cols-2">
            <div className="card px-4 py-5">
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient">
                <Counter value={totalLinks} />
              </p>
              <p className="mt-1 text-sm text-slate-500">
                ссылок сокращено за всё время
              </p>
            </div>
            <div className="card px-4 py-5">
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                <Counter value={linksToday} />
              </p>
              <p className="mt-1 text-sm text-slate-500">ссылок за последние 24 часа</p>
            </div>
          </div>
        )}
      </section>

      <section id="features" className="mx-auto w-full max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Что умеет LinkShort
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card card-hover p-6">
              <h3 className="font-semibold text-lg text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto w-full max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Как это работает
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.step} className="card p-6 relative overflow-hidden">
              <div className="absolute -right-2 -top-4 text-7xl font-bold text-slate-900/[0.04] select-none">
                {s.step}
              </div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 font-bold text-white shadow-sm">
                {s.step}
              </div>
              <h3 className="font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
