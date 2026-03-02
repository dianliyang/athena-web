import { load } from "cheerio";
import { createClient } from "@supabase/supabase-js";

type ParsedRow = {
  provider: string;
  model: string;
  inputPerToken: number;
  outputPerToken: number;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function parseMoneyPerMillion(raw: string): number {
  const cleaned = raw.replace(/[$,\s]/g, "");
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

function normalizeProvider(raw: string): string {
  return raw.trim().toLowerCase();
}

function normalizeModelFromHref(provider: string, href: string, fallbackTitle: string): string {
  const slug = href.replace(/^\/models\//, "").trim().toLowerCase();
  if (!slug) return fallbackTitle.trim().toLowerCase().replace(/\s+/g, "-");
  const prefixed = `${provider}-`;
  if (slug.startsWith(prefixed)) return slug.slice(prefixed.length);
  return slug;
}

function parseRowsFromHtml(html: string): ParsedRow[] {
  const $ = load(html);
  const rows: ParsedRow[] = [];

  $("table tbody tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 6) return;

    const modelAnchor = tds.eq(1).find("a").first();
    const href = String(modelAnchor.attr("href") || "").trim();
    const modelTitle = modelAnchor.text().trim();
    const providerRaw = tds.eq(2).text().trim();
    const inputRaw = tds.eq(4).text().trim();
    const outputRaw = tds.eq(5).text().trim();

    const provider = normalizeProvider(providerRaw);
    if (!provider || !href.startsWith("/models/")) return;

    const model = normalizeModelFromHref(provider, href, modelTitle);
    if (!model) return;

    const inputPerMillion = parseMoneyPerMillion(inputRaw);
    const outputPerMillion = parseMoneyPerMillion(outputRaw);
    const inputPerToken = inputPerMillion / 1_000_000;
    const outputPerToken = outputPerMillion / 1_000_000;

    rows.push({
      provider,
      model,
      inputPerToken,
      outputPerToken,
    });
  });

  const dedupe = new Map<string, ParsedRow>();
  for (const row of rows) dedupe.set(`${row.provider}::${row.model}`, row);
  return Array.from(dedupe.values());
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const endpoint = "https://ai-pricing.vercel.app/models";

  const res = await fetch(endpoint, {
    headers: {
      "user-agent": "Mozilla/5.0 CodeCampus Pricing Sync",
      accept: "text/html",
      "cache-control": "no-cache",
      pragma: "no-cache",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch pricing page: HTTP ${res.status}`);
  const html = await res.text();
  const parsed = parseRowsFromHtml(html);
  if (parsed.length === 0) throw new Error("No pricing rows parsed from /models");

  const supabase = createClient(supabaseUrl, serviceRole);
  const { data: existingRows, error: existingError } = await supabase
    .from("ai_model_pricing")
    .select("provider, model, is_active");
  if (existingError) throw new Error(`Failed to load ai_model_pricing: ${existingError.message}`);

  const activeByKey = new Map<string, boolean>();
  for (const row of existingRows || []) {
    const provider = String((row as { provider?: string }).provider || "").trim().toLowerCase();
    const model = String((row as { model?: string }).model || "").trim().toLowerCase();
    const isActive = Boolean((row as { is_active?: boolean }).is_active);
    if (!provider || !model) continue;
    activeByKey.set(`${provider}::${model}`, isActive);
  }

  const now = new Date().toISOString();
  const upserts = parsed.map((row) => {
    const key = `${row.provider}::${row.model}`;
    const isActive = activeByKey.has(key) ? Boolean(activeByKey.get(key)) : false;
    return {
      provider: row.provider,
      model: row.model,
      input_per_token: row.inputPerToken,
      output_per_token: row.outputPerToken,
      is_active: isActive,
      updated_at: now,
    };
  });

  const batchSize = 200;
  for (let i = 0; i < upserts.length; i += batchSize) {
    const batch = upserts.slice(i, i + batchSize);
    const { error } = await supabase
      .from("ai_model_pricing")
      .upsert(batch, { onConflict: "provider,model" });
    if (error) throw new Error(`Upsert failed at batch ${i / batchSize + 1}: ${error.message}`);
  }

  const existed = upserts.filter((row) => activeByKey.has(`${row.provider}::${row.model}`)).length;
  const inserted = upserts.length - existed;
  console.log(
    JSON.stringify(
      {
        source: endpoint,
        parsed: parsed.length,
        upserted: upserts.length,
        existingMatched: existed,
        newInserted: inserted,
        policy: "preserve_existing_is_active; new_rows_is_active=false",
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[sync-ai-model-pricing-from-directory] failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
