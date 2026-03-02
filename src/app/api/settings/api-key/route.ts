import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";

function hashKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const msg = String((error as { message?: unknown }).message || "").toLowerCase();
  const code = String((error as { code?: unknown }).code || "");
  return code === "42P01" || (msg.includes("relation") && msg.includes("user_api_keys") && msg.includes("does not exist"));
}

async function getAuthedUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { userId: null, supabase };
  return { userId: user.id, supabase };
}

export async function GET() {
  const { userId, supabase } = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from("user_api_keys")
    .select("id, key_name, key_prefix, is_active, requests_limit, requests_used, last_used_at, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ keys: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    keys: (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.key_name ?? "API Key",
      keyPrefix: row.key_prefix ?? null,
      isActive: row.is_active ?? false,
      requestsLimit: row.requests_limit ?? null,
      requestsUsed: row.requests_used ?? 0,
      lastUsedAt: row.last_used_at ?? null,
      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const { userId, supabase } = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const keyName = typeof body?.name === "string" && body.name.trim().length > 0
    ? body.name.trim().slice(0, 80)
    : "API Key";
  const requestsLimit = body?.requestsLimit == null || body?.requestsLimit === ""
    ? null
    : Number(body.requestsLimit);

  if (requestsLimit != null && (!Number.isInteger(requestsLimit) || requestsLimit < 1)) {
    return NextResponse.json({ error: "requestsLimit must be an integer >= 1." }, { status: 400 });
  }

  const rawKey = `ccmp_${randomBytes(20).toString("hex")}`;
  const keyPrefix = rawKey.slice(0, 14);
  const keyHash = hashKey(rawKey);
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from("user_api_keys")
    .insert({
      user_id: userId,
      key_name: keyName,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      is_active: true,
      requests_limit: requestsLimit,
      requests_used: 0,
      updated_at: now,
      last_rotated_at: now,
    })
    .select("id, key_name, key_prefix, is_active, requests_limit, requests_used, last_used_at, created_at, updated_at")
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: "API key table is not available yet. Run latest database migrations." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    key: rawKey,
    item: {
      id: data.id,
      name: data.key_name,
      keyPrefix: data.key_prefix,
      isActive: data.is_active,
      requestsLimit: data.requests_limit,
      requestsUsed: data.requests_used,
      lastUsedAt: data.last_used_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const { userId, supabase } = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = Number(body?.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body?.isActive === "boolean") {
    updatePayload.is_active = body.isActive;
  }
  if (typeof body?.name === "string") {
    updatePayload.key_name = body.name.trim().slice(0, 80) || "API Key";
  }
  if (Object.prototype.hasOwnProperty.call(body, "requestsLimit")) {
    if (body.requestsLimit == null || body.requestsLimit === "") {
      updatePayload.requests_limit = null;
    } else {
      const limit = Number(body.requestsLimit);
      if (!Number.isInteger(limit) || limit < 1) {
        return NextResponse.json({ error: "requestsLimit must be an integer >= 1." }, { status: 400 });
      }
      updatePayload.requests_limit = limit;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from("user_api_keys")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, key_name, key_prefix, is_active, requests_limit, requests_used, last_used_at, created_at, updated_at")
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: "API key table is not available yet. Run latest database migrations." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    item: {
      id: data.id,
      name: data.key_name,
      keyPrefix: data.key_prefix,
      isActive: data.is_active,
      requestsLimit: data.requests_limit,
      requestsUsed: data.requests_used,
      lastUsedAt: data.last_used_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  });
}

export async function DELETE(request: NextRequest) {
  const { userId, supabase } = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id") || "");
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db
    .from("user_api_keys")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: "API key table is not available yet. Run latest database migrations." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
