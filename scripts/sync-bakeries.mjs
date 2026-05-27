import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: ws }
});

function detectArea(lat, lng) {
  if (lat >= 34.6 && lat <= 34.75 && lng >= 135.45 && lng <= 135.58) return '大阪市内';
  if (lat >= 34.65 && lat <= 34.75 && lng >= 135.1 && lng <= 135.35) return '神戸・芦屋';
  if (lat >= 34.95 && lat <= 35.1 && lng >= 135.65 && lng <= 135.83) return '京都市内';
  if (lat >= 34.75 && lat <= 34.9 && lng >= 135.4 && lng <= 135.65) return '北摂';
  if (lat >= 34.7 && lat <= 34.8 && lng >= 135.3 && lng <= 135.45) return '阪神間';
  if (lat >= 34.65 && lat <= 34.72 && lng >= 135.78 && lng <= 135.85) return '奈良市内';
  return 'その他';
}

function buildAddress(tags) {
  return [
    tags['addr:province'], tags['addr:city'], tags['addr:suburb'],
    tags['addr:quarter'], tags['addr:neighbourhood'],
    tags['addr:block_number'], tags['addr:housenumber'], tags['addr:street'],
  ].filter(Boolean).join(' ');
}

const query = `[out:json][timeout:120];(node["shop"="bakery"](34.5,134.95,35.15,135.95);way["shop"="bakery"](34.5,134.95,35.15,135.95););out center tags;`;

const USER_AGENT = 'gopan-bakery-app/1.0 (https://gopan.vercel.app; contact@example.com)';

async function fetchFromOverpass(serverUrl, method = 'POST') {
  let url, options;
  if (method === 'GET') {
    url = `${serverUrl}?data=${encodeURIComponent(query)}`;
    options = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(180000),
    };
  } else {
    url = serverUrl;
    options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(180000),
    };
  }
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('🥐 ゴパン: パン屋データ同期開始');

  const servers = [
    { url: 'https://overpass-api.de/api/interpreter', method: 'POST' },
    { url: 'https://overpass-api.de/api/interpreter', method: 'GET' },
    { url: 'https://overpass.kumi.systems/api/interpreter', method: 'POST' },
    { url: 'https://overpass.kumi.systems/api/interpreter', method: 'GET' },
    { url: 'https://overpass.openstreetmap.ru/api/interpreter', method: 'POST' },
  ];

  let data = null;
  for (const { url, method } of servers) {
    try {
      console.log(`試行中: ${method} ${url}`);
      data = await fetchFromOverpass(url, method);
      console.log(`✅ 成功!`);
      break;
    } catch (e) {
      console.log(`❌ 失敗: ${e.message}`);
      if (e.message.includes('429')) {
        console.log('30秒待機中...');
        await sleep(30000);
      }
    }
  }

  if (!data) throw new Error('全サーバーへのアクセスが失敗しました');
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
        area: detectArea(lat, lng),
        raw_tags: el.tags,
        updated_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  console.log(`整形済み: ${bakeries.length} 件`);

  const batchSize = 500;
  let inserted = 0;
  for (let i = 0; i < bakeries.length; i += batchSize) {
    const batch = bakeries.slice(i, i + batchSize);
    const { error } = await supabase
      .from('bakeries')
      .upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`バッチエラー:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`✅ ${inserted}/${bakeries.length} 件投入完了`);
  }

  console.log(`🎉 完了! 合計 ${inserted} 件のパン屋を投入しました`);
}

main().catch(e => {
  console.error('エラー:', e);
  process.exit(1);
});
