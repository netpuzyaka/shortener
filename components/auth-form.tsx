"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function translateError(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Неверный email или пароль";
  if (/user already registered/i.test(message)) return "Пользователь с таким email уже зарегистрирован";
  if (/email not confirmed/i.test(message)) return "Подтвердите email — мы отправили вам письмо";
  if (/password should be at least/i.test(message)) return "Пароль должен быть не короче 6 символов";
  if (/invalid email/i.test(message)) return "Введите корректный email";
  if (/rate limit/i.test(message)) return "Слишком много попыток. Подождите немного";
  return "Что-то пошло не так. Попробуйте ещё раз";
}

export default function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "register";
  next?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const origin = window.location.origin;

      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${origin}/auth/callback?next=/dashboard` },
        });
        if (error) {
          setError(translateError(error.message));
          return;
        }
        if (!data.session) {
          setSent(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(translateError(error.message));
          return;
        }
      }

      router.push(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch {
      setError("Не удалось связаться с сервером авторизации");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="card mx-auto w-full max-w-md p-8 text-center">
        <h2 className="text-xl font-bold text-white">Проверьте почту</h2>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Мы отправили письмо на <span className="text-zinc-200">{email}</span>.
          Перейдите по ссылке в письме, чтобы подтвердить регистрацию.
        </p>
        <p className="mt-4 text-xs text-zinc-500">
          Письмо не пришло? Проверьте папку «Спам».
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card mx-auto w-full max-w-md p-8">
      <h2 className="text-xl font-bold text-white">
        {isRegister ? "Регистрация" : "Вход"}
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        {isRegister
          ? "Создайте аккаунт, чтобы хранить все свои ссылки в одном месте"
          : "Войдите, чтобы увидеть свои ссылки"}
      </p>

      <label className="mt-6 block text-sm text-zinc-400">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1.5 w-full rounded-xl bg-white/[0.04] px-4 py-3 text-white outline-none border border-white/10 focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
          autoComplete="email"
        />
      </label>

      <label className="mt-4 block text-sm text-zinc-400">
        Пароль
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isRegister ? "Минимум 6 символов" : "Ваш пароль"}
          className="mt-1.5 w-full rounded-xl bg-white/[0.04] px-4 py-3 text-white outline-none border border-white/10 focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
          autoComplete={isRegister ? "new-password" : "current-password"}
        />
      </label>

      {error && (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-accent to-accent-2 px-6 py-3 font-semibold text-white shadow-md shadow-accent/25 transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
      >
        {loading
          ? "Подождите…"
          : isRegister
            ? "Создать аккаунт"
            : "Войти"}
      </button>
    </form>
  );
}
