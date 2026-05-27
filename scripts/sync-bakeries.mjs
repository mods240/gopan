// 全国対応版 - エリアごとに分割して取得

const USER_AGENT = 'gopan-bakery-app/1.0 (https://gopan.vercel.app)';

// 全国のエリア定義
const REGIONS = [
  {
    name: '関西',
    bbox: '33.5,134.5,35.5,136.5', // 南緯,西経,北緯,東経
  },
  {
    name: '関東',
    bbox: '35.0,138.5,36.5,140.5',
  },
  {
    name: '中京',
    bbox: '34.5,136.5,35.5,138.0',
  },
  {
    name: '北陸・信越',
    bbox: '35.5,136.0,37.5,139.0',
  },
  {
    name: '東北',
    bbox: '37.0,139.5,41.5,142.0',
  },
  {
    name: '中国・四国',
    bbox: '32.5,130.5,35.0,134.5',
  },
  {
    name: '九州',
    bbox: '30.5,129.5,34.0,132.5',
  },
  {
    name: '北海道',
    bbox: '41.5,139.5,45.5,145.5',
  },
  {
    name: '沖縄',
    bbox: '24.0,122.5,27.0,128.5',
  },
];

function detectArea(lat, lng, regionName) {
  // 関西エリアの詳細分類
  if (regionName === '関西') {
    if (lat >= 34.6 && lat <= 34.75 && lng >= 135.45 && lng <= 135.58) return '大阪市内';
    if (lat >= 34.65 && lat <= 34.75 && lng >= 135.1 && lng <= 135.35) return '神戸・芦屋';
    if (lat >= 34.95 && lat <= 35.1 && lng >= 135.65 && lng <= 135.83) return '京都市内';
    if (lat >= 34.75 && lat <= 34.9 && lng >= 135.4 && lng <= 135.65) return '北摂';
    if (lat >= 34.7 && lat <= 34.8 && lng >= 135.3 && lng <= 135.45) return '阪神間';
    if (lat >= 34.65 && lat <= 34.72 && lng >= 135.78 && lng <= 135.85) return '奈良市内';
  }
  // 関東エリアの詳細分類
  if (regionName === '関東') {
    if (lat >= 35.5 && lat <= 35.8 && lng >= 139.5 && lng <= 139.9) return '東京都心';
    if (lat >= 35.3 && lat <= 35.55 && lng >= 139.3 && lng <= 139.65) return '神奈川';
    if (lat >= 35.8 && lat <= 36.0 && lng >= 139.5 && lng <= 139.9) return '埼玉';
    if (lat >= 35.5 && lat <= 35.8 && lng >= 139.9 && lng <= 140.3) return '千葉';
  }
  return regionName; // デフォルトはリージョン名
}

function buildAddress(tags) {
  return [
    tags['addr:province'], tags['addr:city'], tags['addr:suburb'],
    tags['addr:quarter'], tags['addr:neighbourhood'],
    tags['addr:block_number'], tags['addr:housenumber'], tags['addr:street'],
  ].filter(Boolean).join(' ');
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchFromOverpass(bbox) {
  const query = `[out:json][timeout:120];(node["shop"="bakery"](${bbox});way["shop"="bakery"](${bbox}););out center tags;`;
  const servers = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  for (const server of servers) {
    try {
      const response = await fetch(server, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(180000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      console.log(`❌ ${server}: ${e.message}`);
      if (e.message.includes('429')) await sleep(30000);
    }
  }
  throw new Error(`全サーバーへのアクセスが失敗しました`);
}

async function upsertBakeries(supabaseUrl, supabaseKey, bakeries) {
  const response = await fetch(`${supabaseUrl}/rest/v1/bakeries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(bakeries),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error ${response.status}: ${text}`);
  }
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const targetRegion = process.env.TARGET_REGION || 'all'; // 特定リージョンのみ実行可能

  console.log(`🥐 ゴパン全国版: データ同期開始 (対象: ${targetRegion})`);

  const regions = targetRegion === 'all'
    ? REGIONS
    : REGIONS.filter(r => r.name === targetRegion);

  for (const region of regions) {
    console.log(`\n📍 ${region.name} の取得開始...`);

    try {
      const data = await fetchFromOverpass(region.bbox);
      console.log(`取得件数: ${data.elements.length}`);

      const bakeries = data.elements
        .filter(el => el.tags && el.tags.name)
        .map(el => {
          const lat = el.type === 'node' ? el.lat : el.center?.lat;
          const lng = el.type === 'node' ? el.lon : el.center?.lon;
          if (!lat || !lng) return null;
          return {
            id: el.id,
            osm_type: el.type,
            name: el.tags.name || null,
            name_en: el.tags['name:en'] || null,
            name_ja: el.tags['name:ja'] || null,
            latitude: lat,
            longitude: lng,
            brand: el.tags.brand || null,
            opening_hours: el.tags.opening_hours || null,
            phone: el.tags.phone || el.tags['contact:phone'] || null,
            website: el.tags.website || el.tags['contact:website'] || null,
            takeaway: el.tags.takeaway || null,
            wheelchair: el.tags.wheelchair || null,
            address: buildAddress(el.tags),
            area: detectArea(lat, lng, region.name),
            region: region.name,
            raw_tags: el.tags,
            updated_at: new Date().toISOString(),
          };
        })
        .filter(Boolean);

      console.log(`整形済み: ${bakeries.length} 件`);

      // 500件ずつ投入
      const batchSize = 500;
      let inserted = 0;
      for (let i = 0; i < bakeries.length; i += batchSize) {
        await upsertBakeries(supabaseUrl, supabaseKey, bakeries.slice(i, i + batchSize));
        inserted += bakeries.slice(i, i + batchSize).length;
        console.log(`  ✅ ${inserted}/${bakeries.length} 件投入`);
      }

      console.log(`✅ ${region.name} 完了: ${bakeries.length} 件`);

      // サーバー負荷軽減のため少し待つ
      if (regions.indexOf(region) < regions.length - 1) {
        console.log('次のエリアまで10秒待機...');
        await sleep(10000);
      }
    } catch (e) {
      console.error(`❌ ${region.name} 失敗: ${e.message}`);
      // 1エリア失敗しても続行
    }
  }

  console.log('\n🎉 全国データ同期完了!');
}

main().catch(e => { console.error('エラー:', e.message); process.exit(1); });
