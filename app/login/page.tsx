import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Вход — LinkShort",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const failed = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-16">
      <AuthForm mode="login" next={next} />
      {failed === "verify" && (
        <div className="card mx-auto mt-4 w-full max-w-md px-6 py-4 text-center text-sm text-amber-300 border-amber-400/30 bg-amber-400/10">
          Не удалось подтвердить email. Попробуйте войти ещё раз.
        </div>
      )}
      <p className="mt-6 text-sm text-zinc-400">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-accent-2 hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </main>
  );
}
