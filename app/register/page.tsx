import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Регистрация — LinkShort",
};

export default function RegisterPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-16">
      <AuthForm mode="register" />
      <p className="mt-6 text-sm text-zinc-400">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-accent-2 hover:underline">
          Войти
        </Link>
      </p>
    </main>
  );
}
