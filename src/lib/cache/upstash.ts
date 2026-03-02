type UpstashResponse<T = unknown> = {
  result?: T;
  error?: string;
};

function getConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

async function runCommand<T = unknown>(command: unknown[]): Promise<T | null> {
  const cfg = getConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as UpstashResponse<T>;
    if (payload?.error) return null;
    return (payload?.result ?? null) as T | null;
  } catch {
    return null;
  }
}

export async function upstashGetJson<T>(key: string): Promise<T | null> {
  const raw = await runCommand<string>(["GET", key]);
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function upstashSetJson(
  key: string,
  value: unknown,
  ttlSeconds = 7200
): Promise<boolean> {
  const serialized = JSON.stringify(value);
  const result = await runCommand<string>(["SET", key, serialized, "EX", String(ttlSeconds)]);
  return result === "OK";
}

export async function upstashDelete(key: string): Promise<boolean> {
  const result = await runCommand<number>(["DEL", key]);
  return typeof result === "number" && result >= 0;
}

export async function upstashSetString(key: string, value: string): Promise<boolean> {
  const result = await runCommand<string>(["SET", key, value]);
  return result === "OK";
}

export async function upstashMGet(keys: string[]): Promise<Array<string | null>> {
  if (keys.length === 0) return [];
  const result = await runCommand<Array<string | null>>(["MGET", ...keys]);
  if (!Array.isArray(result)) return keys.map(() => null);
  return result.map((item) => (typeof item === "string" ? item : null));
}

export async function upstashSMembers(key: string): Promise<string[]> {
  const result = await runCommand<unknown[]>(["SMEMBERS", key]);
  if (!Array.isArray(result)) return [];
  return result.filter((item): item is string => typeof item === "string");
}
