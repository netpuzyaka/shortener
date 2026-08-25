import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-7xl font-bold text-gradient">404</p>
      <h1 className="mt-4 text-2xl font-bold text-white">Страница не найдена</h1>
      <p className="mt-2 text-zinc-400">
        Возможно, такой короткой ссылки не существует.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-gradient-to-r from-accent to-accent-2 px-6 py-3 font-semibold text-white shadow-md shadow-accent/25 transition hover:opacity-90"
      >
        Создать короткую ссылку
      </Link>
    </main>
  );
}
