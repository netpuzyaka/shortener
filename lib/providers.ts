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
  const res = await fetch(
    `https://clck.ru/--?url=${encodeURIComponent(url)}`
  );
  const text = (await res.text()).trim();

  if (!res.ok || !/^https:\/\/clck\.ru\/[a-zA-Z0-9]+$/.test(text)) {
    throw new Error(`CLCKRU_ERROR: HTTP ${res.status} ${text.slice(0, 120)}`);
  }

  return text;
}

export async function shortenExternal(
  provider: ExternalProvider,
  url: string
): Promise<string> {
  if (provider === "cleanuri") return shortenWithCleanuri(url);
  return shortenWithClckRu(url);
}
