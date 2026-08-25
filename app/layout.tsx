import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logout-button";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "LinkShort — сократитель ссылок с аналитикой переходов",
  description:
    "Бесплатный сократитель ссылок с отслеживанием переходов: страна, регион, город, устройство, браузер и источник каждого клика.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  let email: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
  } catch {
    email = null;
  }

  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-sm font-bold text-white shadow-sm">
                L
              </span>
              <span>LinkShort</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-400">
              <Link href="/#features" className="hidden sm:block hover:text-white transition-colors">
                Возможности
              </Link>
              {email ? (
                <>
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    Мои ссылки
                  </Link>
                  <span className="hidden md:block text-zinc-500 max-w-40 truncate">
                    {email}
                  </span>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Войти
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-gradient-to-r from-accent to-accent-2 px-3.5 py-1.5 font-medium text-white shadow-sm shadow-accent/25 transition hover:opacity-90"
                  >
                    Регистрация
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <div className="flex-1 flex flex-col">{children}</div>
        <footer className="border-t border-white/10 py-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-1.5 px-4 text-sm text-zinc-500">
            <p>LinkShort — бесплатный сократитель ссылок с аналитикой переходов</p>
            <p className="text-xs">Хостинг: Vercel · База данных: Supabase</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
