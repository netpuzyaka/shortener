import "server-only";

export async function shortenWithTopvisor(url: string): Promise<string> {
  const userId = process.env.TOPVISOR_USER_ID;
  const apiKey = process.env.TOPVISOR_API_KEY;

  if (!userId || !apiKey) {
    throw new Error("TOPVISOR_NOT_CONFIGURED");
  }

  const res = await fetch(
    "https://api.topvisor.com/v2/json/add/tpvsr_2/short_link",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Id": userId,
        Authorization: `bearer ${apiKey}`,
      },
      body: JSON.stringify({ link: url, fields: ["id", "short_link", "link"] }),
    }
  );

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.result?.[0]?.short_link) {
    const errText = Array.isArray(data?.errors)
      ? data.errors.map((e: { message?: string }) => e.message ?? "").join(", ")
      : res.statusText;
    throw new Error(`TOPVISOR_ERROR: ${errText || res.status}`);
  }

  return String(data.result[0].short_link);
}
