import "server-only";

export type ExternalProvider = "cleanuri" | "clckru";

export const PROVIDERS: Record<
  ExternalProvider,
  { name: string; domain: string }
> = {
  cleanuri: { name: "CleanURI", domain: "cleanuri.com" },
  clckru: { name: "clck.ru", domain: "clck.ru" },
};

async function shortenWithCleanuri(url: string): Promise<string> {
  const res = await fetch("https://cleanuri.com/api/v1/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ url }).toString(),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.result_url) {
    const detail = data?.error ?? `HTTP ${res.status}`;
    throw new Error(`CLEANURI_ERROR: ${detail}`);
  }

  return String(data.result_url);
}

async function shortenWithClckRu(url: string): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(
      `https://clck.ru/--?url=${encodeURIComponent(url)}`
    );
    const text = (await res.text()).trim();

    if (res.ok && /^https:\/\/clck\.ru\/[a-zA-Z0-9]+$/.test(text)) {
      return text;
    }

    // 400/429 = лимит запросов clck.ru (примерно 1 в секунду) — пробуем ещё раз с паузой
    if ((res.status === 400 || res.status === 429) && attempt < 2) {
      await new Promise((r) => setTimeout(r, 1600 * (attempt + 1)));
      continue;
    }

    throw new Error(
      `CLCKRU_ERROR: HTTP ${res.status} ${text.slice(0, 120)}`
    );
  }

  throw new Error("CLCKRU_RATELIMIT");
}

export async function shortenExternal(
  provider: ExternalProvider,
  url: string
): Promise<string> {
  switch (provider) {
    case "cleanuri":
      return shortenWithCleanuri(url);
    case "clckru":
      return shortenWithClckRu(url);
  }
}
