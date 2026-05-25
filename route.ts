import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // Vercelで最大5分実行可能（Hobbyプランは10秒制限あり、Proなら300秒）
export const dynamic = "force-dynamic";

// エリア判定
function detectArea(lat: number, lng: number): string {
  // 大阪市内
  if (lat >= 34.6 && lat <= 34.75 && lng >= 135.45 && lng <= 135.58) {
    return "大阪市内";
  }
  // 神戸・芦屋
  if (lat >= 34.65 && lat <= 34.75 && lng >= 135.1 && lng <= 135.35) {
    return "神戸・芦屋";
  }
  // 京都市内
  if (lat >= 34.95 && lat <= 35.1 && lng >= 135.65 && lng <= 135.83) {
    return "京都市内";
  }
  // 北摂(豊中・吹田・茨木・高槻)
  if (lat >= 34.75 && lat <= 34.9 && lng >= 135.4 && lng <= 135.65) {
    return "北摂";
  }
  // 阪神間(尼崎・西宮・伊丹)
  if (lat >= 34.7 && lat <= 34.8 && lng >= 135.3 && lng <= 135.45) {
    return "阪神間";
  }
  // 奈良市内
  if (lat >= 34.65 && lat <= 34.72 && lng >= 135.78 && lng <= 135.85) {
    return "奈良市内";
  }
  return "その他";
}

// 住所組み立て
function buildAddress(tags: Record<string, string>): string {
  const parts = [
    tags["addr:province"],
    tags["addr:city"],
    tags["addr:suburb"],
    tags["addr:quarter"],
    tags["addr:neighbourhood"],
    tags["addr:block_number"],
    tags["addr:housenumber"],
    tags["addr:street"],
  ].filter(Boolean);
  return parts.join(" ");
}

export async function GET(request: NextRequest) {
  // 簡易セキュリティ：URLパラメータでsecret確認
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Overpass APIでパン屋を取得
    const query = `
      [out:json][timeout:60];
      (
        node["shop"="bakery"](34.5,134.95,35.15,135.95);
        way["shop"="bakery"](34.5,134.95,35.15,135.95);
      );
      out center tags;
    `;

    const overpassResponse = await fetch(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      }
    );

    if (!overpassResponse.ok) {
      throw new Error(`Overpass API failed: ${overpassResponse.status}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await overpassResponse.json();
    const totalElements = data.elements.length;

    // 整形
    const bakeries = data.elements
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((el: any) => el.tags)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((el: any) => {
        const lat = el.type === "node" ? el.lat : el.center?.lat;
        const lng = el.type === "node" ? el.lon : el.center?.lon;
        if (!lat || !lng) return null;

        return {
          id: el.id,
          osm_type: el.type,
          name: el.tags.name || null,
          name_en: el.tags["name:en"] || null,
          name_ja: el.tags["name:ja"] || null,
          latitude: lat,
          longitude: lng,
          brand: el.tags.brand || null,
          opening_hours: el.tags.opening_hours || null,
          phone: el.tags.phone || el.tags["contact:phone"] || null,
          website: el.tags.website || el.tags["contact:website"] || null,
          takeaway: el.tags.takeaway || null,
          wheelchair: el.tags.wheelchair || null,
          address: buildAddress(el.tags),
          area: detectArea(lat, lng),
          raw_tags: el.tags,
          updated_at: new Date().toISOString(),
        };
      })
      .filter(Boolean);

    // バッチでupsert
    const batchSize = 500;
    let inserted = 0;
    for (let i = 0; i < bakeries.length; i += batchSize) {
      const batch = bakeries.slice(i, i + batchSize);
      const { error } = await supabase
        .from("bakeries")
        .upsert(batch, { onConflict: "id" });

      if (error) {
        return NextResponse.json(
          {
            error: error.message,
            inserted,
            total: bakeries.length,
          },
          { status: 500 }
        );
      }
      inserted += batch.length;
    }

    return NextResponse.json({
      success: true,
      totalElements,
      filteredCount: bakeries.length,
      inserted,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
