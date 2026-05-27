const USER_AGENT = 'gopan-bakery-app/1.0 (https://gopan.vercel.app)';

const REGIONS = [
  { name: '関西', bbox: '33.5,134.5,35.5,136.5' },
  { name: '関東', bbox: '35.0,138.5,36.5,140.5' },
  { name: '中京', bbox: '34.5,136.5,35.5,138.0' },
  { name: '北陸・信越', bbox: '35.5,136.0,37.5,139.0' },
  { name: '東北', bbox: '37.0,139.5,41.5,142.0' },
  { name: '中国・四国', bbox: '32.5,130.5,35.0,134.5' },
  { name: '九州', bbox: '30.5,129.5,34.0,132.5' },
  { name: '北海道', bbox: '41.5,139.5,45.5,145.5' },
  { name: '沖縄', bbox: '24.0,122.5,27.0,128.5' },
];

function detectArea(lat, lng, regionName) {
  switch (regionName) {
    case '関西':
      if (lat >= 34.6 && lat <= 34.75 && lng >= 135.45 && lng <= 135.58) return '大阪市内';
      if (lat >= 34.65 && lat <= 34.75 && lng >= 135.1 && lng <= 135.35) return '神戸・芦屋';
      if (lat >= 34.95 && lat <= 35.1 && lng >= 135.65 && lng <= 135.83) return '京都市内';
      if (lat >= 34.75 && lat <= 34.9 && lng >= 135.4 && lng <= 135.65) return '北摂';
      if (lat >= 34.7 && lat <= 34.8 && lng >= 135.3 && lng <= 135.45) return '阪神間';
      if (lat >= 34.65 && lat <= 34.72 && lng >= 135.78 && lng <= 135.85) return '奈良市内';
      if (lat >= 34.2 && lat <= 34.6 && lng >= 135.1 && lng <= 135.6) return '和歌山・南大阪';
      if (lat >= 35.0 && lat <= 35.5 && lng >= 135.5 && lng <= 136.0) return '滋賀';
      return '関西その他';

    case '関東':
      if (lat >= 35.6 && lat <= 35.75 && lng >= 139.6 && lng <= 139.85) return '東京都心';
      if (lat >= 35.75 && lat <= 35.9 && lng >= 139.5 && lng <= 139.7) return '東京北部';
      if (lat >= 35.5 && lat <= 35.65 && lng >= 139.4 && lng <= 139.6) return '東京南部・世田谷';
      if (lat >= 35.55 && lat <= 35.75 && lng >= 139.2 && lng <= 139.45) return '神奈川北部';
      if (lat >= 35.3 && lat <= 35.55 && lng >= 139.3 && lng <= 139.65) return '横浜・川崎';
      if (lat >= 35.1 && lat <= 35.35 && lng >= 139.1 && lng <= 139.6) return '神奈川南部';
      if (lat >= 35.75 && lat <= 36.1 && lng >= 139.5 && lng <= 139.9) return '埼玉';
      if (lat >= 35.5 && lat <= 35.85 && lng >= 139.85 && lng <= 140.3) return '千葉';
      if (lat >= 35.9 && lat <= 36.5 && lng >= 139.8 && lng <= 140.5) return '茨城・栃木・群馬';
      return '関東その他';

    case '中京':
      if (lat >= 35.1 && lat <= 35.3 && lng >= 136.8 && lng <= 137.1) return '名古屋市内';
      if (lat >= 35.0 && lat <= 35.5 && lng >= 136.5 && lng <= 136.85) return '愛知西部';
      if (lat >= 34.8 && lat <= 35.1 && lng >= 137.0 && lng <= 137.5) return '愛知東部・豊橋';
      if (lat >= 35.3 && lat <= 35.7 && lng >= 136.7 && lng <= 137.2) return '岐阜';
      if (lat >= 34.5 && lat <= 35.0 && lng >= 136.2 && lng <= 136.8) return '三重';
      if (lat >= 34.7 && lat <= 35.2 && lng >= 137.5 && lng <= 138.2) return '静岡西部・浜松';
      if (lat >= 34.9 && lat <= 35.3 && lng >= 138.2 && lng <= 138.8) return '静岡中部・東部';
      return '中京その他';

    case '東北':
      if (lat >= 38.2 && lat <= 38.4 && lng >= 140.8 && lng <= 141.1) return '仙台';
      if (lat >= 37.3 && lat <= 37.6 && lng >= 140.0 && lng <= 140.5) return '福島';
      if (lat >= 39.6 && lat <= 39.8 && lng >= 141.1 && lng <= 141.3) return '盛岡';
      if (lat >= 38.8 && lat <= 39.1 && lng >= 141.1 && lng <= 141.4) return '一関・北上';
      if (lat >= 40.5 && lat <= 40.8 && lng >= 140.6 && lng <= 141.0) return '青森';
      if (lat >= 39.7 && lat <= 40.0 && lng >= 140.0 && lng <= 140.4) return '秋田';
      if (lat >= 38.2 && lat <= 38.5 && lng >= 140.2 && lng <= 140.5) return '山形';
      return '東北その他';

    case '北陸・信越':
      if (lat >= 36.5 && lat <= 36.7 && lng >= 137.1 && lng <= 137.3) return '富山';
      if (lat >= 36.5 && lat <= 36.7 && lng >= 136.6 && lng <= 136.8) return '金沢';
      if (lat >= 36.0 && lat <= 36.2 && lng >= 136.1 && lng <= 136.3) return '福井';
      if (lat >= 37.8 && lat <= 38.0 && lng >= 138.9 && lng <= 139.1) return '新潟';
      if (lat >= 36.6 && lat <= 36.7 && lng >= 138.1 && lng <= 138.3) return '長野';
      if (lat >= 36.2 && lat <= 36.4 && lng >= 137.8 && lng <= 138.0) return '松本';
      return '北陸・信越その他';

    case '中国・四国':
      if (lat >= 34.3 && lat <= 34.5 && lng >= 132.4 && lng <= 132.6) return '広島市内';
      if (lat >= 34.6 && lat <= 34.8 && lng >= 133.9 && lng <= 134.1) return '岡山';
      if (lat >= 34.1 && lat <= 34.3 && lng >= 131.4 && lng <= 131.6) return '山口・下関';
      if (lat >= 34.3 && lat <= 34.5 && lng >= 132.0 && lng <= 132.3) return '広島西部';
      if (lat >= 34.3 && lat <= 34.4 && lng >= 134.0 && lng <= 134.2) return '高松';
      if (lat >= 33.8 && lat <= 34.0 && lng >= 132.7 && lng <= 132.9) return '松山';
      if (lat >= 33.5 && lat <= 33.7 && lng >= 133.5 && lng <= 133.7) return '高知';
      if (lat >= 34.0 && lat <= 34.2 && lng >= 134.5 && lng <= 134.7) return '徳島';
      return '中国・四国その他';

    case '九州':
      if (lat >= 33.5 && lat <= 33.7 && lng >= 130.3 && lng <= 130.5) return '福岡市内';
      if (lat >= 33.8 && lat <= 34.0 && lng >= 130.9 && lng <= 131.1) return '北九州';
      if (lat >= 33.2 && lat <= 33.4 && lng >= 130.2 && lng <= 130.4) return '佐賀';
      if (lat >= 32.7 && lat <= 32.9 && lng >= 129.8 && lng <= 130.0) return '長崎';
      if (lat >= 32.7 && lat <= 32.9 && lng >= 130.7 && lng <= 130.9) return '熊本';
      if (lat >= 33.2 && lat <= 33.4 && lng >= 131.5 && lng <= 131.7) return '大分';
      if (lat >= 31.8 && lat <= 32.0 && lng >= 131.4 && lng <= 131.6) return '宮崎';
      if (lat >= 31.5 && lat <= 31.7 && lng >= 130.5 && lng <= 130.7) return '鹿児島';
      return '九州その他';

    case '北海道':
      if (lat >= 43.0 && lat <= 43.2 && lng >= 141.3 && lng <= 141.5) return '札幌';
      if (lat >= 43.7 && lat <= 43.9 && lng >= 142.3 && lng <= 142.5) return '旭川';
      if (lat >= 41.7 && lat <= 41.9 && lng >= 140.7 && lng <= 140.9) return '函館';
      if (lat >= 42.9 && lat <= 43.1 && lng >= 141.6 && lng <= 141.8) return '札幌東部・江別';
      if (lat >= 42.3 && lat <= 42.5 && lng >= 143.1 && lng <= 143.3) return '帯広';
      if (lat >= 43.7 && lat <= 43.9 && lng >= 144.3 && lng <= 144.5) return '釧路・根室';
      return '北海道その他';

    case '沖縄':
      if (lat >= 26.1 && lat <= 26.3 && lng >= 127.6 && lng <= 127.8) return '那覇';
      if (lat >= 26.3 && lat <= 26.6 && lng >= 127.7 && lng <= 128.0) return '沖縄中部';
      if (lat >= 26.6 && lat <= 26.9 && lng >= 128.0 && lng <= 128.3) return '沖縄北部';
      return '沖縄その他';

    default:
      return regionName;
  }
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
  throw new Error('全サーバーへのアクセスが失敗しました');
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
  const targetRegion = process.env.TARGET_REGION || 'all';

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
            id: el.id, osm_type: el.type,
            name: el.tags.name || null,
            name_en: el.tags['name:en'] || null,
            name_ja: el.tags['name:ja'] || null,
            latitude: lat, longitude: lng,
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
        }).filter(Boolean);

      console.log(`整形済み: ${bakeries.length} 件`);

      const batchSize = 500;
      let inserted = 0;
      for (let i = 0; i < bakeries.length; i += batchSize) {
        await upsertBakeries(supabaseUrl, supabaseKey, bakeries.slice(i, i + batchSize));
        inserted += bakeries.slice(i, i + batchSize).length;
        console.log(`  ✅ ${inserted}/${bakeries.length} 件投入`);
      }
      console.log(`✅ ${region.name} 完了: ${bakeries.length} 件`);

      if (regions.indexOf(region) < regions.length - 1) {
        console.log('次のエリアまで10秒待機...');
        await sleep(10000);
      }
    } catch (e) {
      console.error(`❌ ${region.name} 失敗: ${e.message}`);
    }
  }
  console.log('\n🎉 全国データ同期完了!');
}

main().catch(e => { console.error('エラー:', e.message); process.exit(1); });
