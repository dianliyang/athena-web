import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { getModelCatalogByProvider } from "@/lib/ai/models";

export const runtime = "nodejs";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const modelCatalog = await getModelCatalogByProvider();

  return NextResponse.json(
    { modelCatalog, fetchedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

