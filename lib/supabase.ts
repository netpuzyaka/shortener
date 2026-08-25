import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY не заданы. " +
        "Создайте проект на https://supabase.com и добавьте ключи в переменные окружения " +
        "(локально — в файл .env, на Vercel — в Settings → Environment Variables)."
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false },
  });

  return client;
}
