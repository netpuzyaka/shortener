import "server-only";

export type ExternalProvider = "cleanuri" | "clckru" | "dagd" | "vurl";

export const PROVIDERS: Record<
  ExternalProvider,
  { name: string; domain: string }
> = {
  cleanuri: { name: "CleanURI", domain: "cleanuri.com" },
  clckru: { name: "clck.ru", domain: "clck.ru" },
  dagd: { name: "da.gd", domain: "da.gd" },
  vurl: { name: "vurl.com", domain: "vurl.com" },
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

async function shortenWithDaGd(url: string): Promise<string> {
  const res = await fetch(`https://da.gd/s?url=${encodeURIComponent(url)}`);
  const text = (await res.text()).trim();

  if (!res.ok || !/^https:\/\/da\.gd\/[A-Za-z0-9_-]+$/.test(text)) {
    throw new Error(`DAGD_ERROR: ${text.slice(0, 120) || `HTTP ${res.status}`}`);
  }

  return text;
}

async function shortenWithVurl(url: string): Promise<string> {
  const res = await fetch(`https://vurl.com/api.php?url=${encodeURIComponent(url)}`);
  const text = (await res.text()).trim();

  if (!res.ok || !/^https:\/\/vurl\.com\/[A-Za-z0-9_-]+$/.test(text)) {
    throw new Error(`VURL_ERROR: ${text.slice(0, 120) || `HTTP ${res.status}`}`);
  }

  return text;
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
    case "dagd":
      return shortenWithDaGd(url);
    case "vurl":
      return shortenWithVurl(url);
  }
}
