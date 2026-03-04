import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createHash } from "node:crypto";

type AuthResult =
  | { ok: true; keyId: number | null; readOnly: boolean }
  | { ok: false; status: number; error: string };

function hashKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const msg = String((error as { message?: unknown }).message || "").toLowerCase();
  const code = String((error as { code?: unknown }).code || "");
  return code === "42P01" || (msg.includes("relation") && msg.includes("user_api_keys") && msg.includes("does not exist"));
}

function isMissingReadOnlyColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const msg = String((error as { message?: unknown }).message || "").toLowerCase();
  const code = String((error as { code?: unknown }).code || "");
  return code === "PGRST204" && msg.includes("is_read_only");
}

export async function authorizeExternalRequest(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get("x-api-key");
  const internalKey = process.env.INTERNAL_API_KEY;

  if (!authHeader || !authHeader.trim()) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  if (internalKey && authHeader === internalKey) {
    return { ok: true, keyId: null, readOnly: false };
  }

  const supabase = createAdminClient();
  // user_api_keys may not yet be present in generated database types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const keyHash = hashKey(authHeader);

  let data: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  let error: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

  ({ data, error } = await db
    .from("user_api_keys")
    .select("id, is_active, is_read_only, requests_limit, requests_used")
    .eq("key_hash", keyHash)
    .maybeSingle());

  if (isMissingReadOnlyColumnError(error)) {
    ({ data, error } = await db
      .from("user_api_keys")
      .select("id, is_active, requests_limit, requests_used")
      .eq("key_hash", keyHash)
      .maybeSingle());
    if (data && typeof data === "object") {
      data.is_read_only = false;
    }
  }

  if (error) {
    if (isMissingTableError(error)) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }
    return { ok: false, status: 500, error: "Database error" };
  }

  if (!data || data.is_active !== true) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const used = Number(data.requests_used || 0);
  const limit = data.requests_limit == null ? null : Number(data.requests_limit);
  if (limit !== null && used >= limit) {
    return { ok: false, status: 429, error: "API key limit reached" };
  }

  const method = String(request.method || "GET").toUpperCase();
  const isReadMethod = method === "GET" || method === "HEAD" || method === "OPTIONS";
  if (data.is_read_only === true && !isReadMethod) {
    return { ok: false, status: 403, error: "API key is read-only" };
  }

  const { error: updateError } = await db
    .from("user_api_keys")
    .update({ requests_used: used + 1, last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  if (updateError) {
    return { ok: false, status: 500, error: "Database error" };
  }

  return { ok: true, keyId: Number(data.id), readOnly: data.is_read_only === true };
}
