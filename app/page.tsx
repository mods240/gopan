"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-amber-50">
      <p className="text-amber-800">🥐 地図を読み込み中...</p>
    </div>
  ),
});

interface Bakery {
  id: number;
  name: string | null;
  latitude: number;
  longitude: number;
  area: string | null;
  address: string | null;
  opening_hours: string | null;
  website: string | null;
  region: string | null;
  distance?: number;
}

const ALL_REGIONS = [
  { name: '関東', emoji: '🗼', desc: '東京・神奈川・埼玉・千葉など' },
  { name: '関西', emoji: '🏯', desc: '大阪・京都・兵庫・奈良など' },
  { name: '中京', emoji: '🏙️', desc: '愛知・岐阜・三重・静岡' },
  { name: '北海道', emoji: '🐻', desc: '北海道全域' },
  { name: '東北', emoji: '⛄', desc: '宮城・福島・青森・岩手など' },
  { name: '北陸・信越', emoji: '🦀', desc: '新潟・長野・富山・石川・福井' },
  { name: '中国・四国', emoji: '🍋', desc: '広島・岡山・香川・愛媛など' },
  { name: '九州', emoji: '🌋', desc: '福岡・熊本・鹿児島・長崎など' },
  { name: '沖縄', emoji: '🌺', desc: '沖縄全島' },
];

// リージョンの中心座標(近い順に並び替えるため)
const REGION_CENTERS: Record<string, [number, number]> = {
  '関東':     [35.68, 139.69],
  '関西':     [34.69, 135.50],
  '中京':     [35.18, 136.91],
  '北海道':   [43.06, 141.35],
  '東北':     [38.27, 140.87],
  '北陸・信越': [36.69, 137.21],
  '中国・四国': [34.40, 132.46],
  '九州':     [33.59, 130.42],
  '沖縄':     [26.21, 127.68],
};

function sortRegionsByLocation(lat: number, lng: number) {
  return [...ALL_REGIONS].sort((a, b) => {
    const [aLat, aLng] = REGION_CENTERS[a.name] || [35, 135];
    const [bLat, bLng] = REGION_CENTERS[b.name] || [35, 135];
    const distA = Math.sqrt((lat - aLat) ** 2 + (lng - aLng) ** 2);
    const distB = Math.sqrt((lat - bLat) ** 2 + (lng - bLng) ** 2);
    return distA - distB;
  });
}
const STORAGE_KEY = 'gopan_selected_regions';
const BOOKMARK_KEY = 'gopan_bookmarks';
const INTERESTED_KEY = 'gopan_interested';
const DEFAULT_CENTER: [number, number] = [34.7, 135.5];

type ViewType = "map" | "list" | "bookmarks";

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export default function Home() {
  const [bakeries, setBakeries] = useState<Bakery[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [sortedRegions, setSortedRegions] = useState(ALL_REGIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  const [interested, setInterested] = useState<Set<number>>(new Set());
  const [showRegionSelect, setShowRegionSelect] = useState(false);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [hasLocation, setHasLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(true);
  const [view, setView] = useState<ViewType>("map");
  const [initialized, setInitialized] = useState(false);
  const currentPosRef = useRef<[number, number] | null>(null);

  // ペアリング
  const [pairId, setPairId] = useState<string | null>(null);
  const [showPairModal, setShowPairModal] = useState(false);
  const [pairInput, setPairInput] = useState("");
  const [receivedBakery, setReceivedBakery] = useState<Bakery | null>(null);
  const pairIdRef = useRef<string | null>(null);

  // pairIdをrefに同期
  useEffect(() => { pairIdRef.current = pairId; }, [pairId]);

  // 自分のsenderIdを生成(初回のみ)
  const senderIdRef = useRef<string>('');
  useEffect(() => {
    const saved = localStorage.getItem('gopan_sender_id');
    if (saved) {
      senderIdRef.current = saved;
    } else {
      const id = Math.random().toString(36).substring(2, 10);
      localStorage.setItem('gopan_sender_id', id);
      senderIdRef.current = id;
    }
  }, []);

  // ペアルーム作成
  const createPair = async () => {
    const newId = Math.random().toString(36).substring(2, 8).toLowerCase();
    const { error } = await supabase.from('gopan_pairs').insert({ id: newId });
    if (error) { alert('ルーム作成に失敗しました: ' + error.message); return; }
    setPairId(newId);
    localStorage.setItem('gopan_pair_id', newId);
    subscribePair(newId);
    // モーダルは閉じない(コードを表示したまま)
  };

  // ペアルーム参加
  const joinPair = async (id: string) => {
    const trimmed = id.trim().toLowerCase();
    const { data, error } = await supabase.from('gopan_pairs').select('id').eq('id', trimmed).maybeSingle();
    console.log('joinPair', trimmed, data, error);
    if (!data) { alert('ルームが見つかりません。コードを確認してください。'); return; }
    setPairId(trimmed);
    localStorage.setItem('gopan_pair_id', trimmed);
    subscribePair(trimmed);
  };

  // ペア解除
  const leavePair = () => {
    setPairId(null);
    localStorage.removeItem('gopan_pair_id');
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
  };

  // ポーリングで受信確認(5秒おき)
  const lastReceivedIdRef = useRef<number>(0);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef<boolean>(false);

  const subscribePair = (id: string) => {
    // 既存のポーリングを停止
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    isPollingRef.current = false;

    // 最新のIDを取得して基準点にする(自分が送ったものも含めて既読扱い)
    supabase
      .from('gopan_shared_bakeries')
      .select('id')
      .eq('pair_id', id)
      .order('id', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          lastReceivedIdRef.current = data[0].id;
        }
        // 基準点取得後にポーリング開始
        pollingIntervalRef.current = setInterval(async () => {
          if (isPollingRef.current) return; // 前のリクエストが終わっていない場合はスキップ
          isPollingRef.current = true;
          try {
            const { data: newData } = await supabase
              .from('gopan_shared_bakeries')
              .select('*')
              .eq('pair_id', id)
              .gt('id', lastReceivedIdRef.current)
              .order('id', { ascending: false })
              .limit(1);

            if (newData && newData.length > 0) {
              const row = newData[0];
              lastReceivedIdRef.current = row.id;
              // 自分が送ったものは無視
              const mySenderId = senderIdRef.current || localStorage.getItem('gopan_sender_id') || '';
              if (row.sender_id !== mySenderId) {
                setReceivedBakery({
                  id: row.bakery_id,
                  name: row.bakery_name,
                  latitude: row.latitude,
                  longitude: row.longitude,
                  address: row.address,
                  area: null,
                  opening_hours: null,
                  website: null,
                  region: null,
                });
              }
            }
          } finally {
            isPollingRef.current = false;
          }
        }, 5000);
      });

    console.log('Polling started for pair:', id);
  };

  // 店舗を送信
  const shareBakery = async (bakery: Bakery) => {
    if (!pairIdRef.current) { alert('ペアリングしてから送信してください'); return; }
    const senderId = senderIdRef.current || localStorage.getItem('gopan_sender_id') || '';
    const { error } = await supabase.from('gopan_shared_bakeries').insert({
      pair_id: pairIdRef.current,
      bakery_id: bakery.id,
      bakery_name: bakery.name,
      latitude: bakery.latitude,
      longitude: bakery.longitude,
      address: bakery.address,
      sender_id: senderId,
    });
    if (error) {
      console.error('送信エラー:', JSON.stringify(error));
      alert('送信失敗: ' + error.message);
      return;
    }
    alert('📤 送信しました！');
  };

  // 起動時にペアを復元
  useEffect(() => {
    const saved = localStorage.getItem('gopan_pair_id');
    if (saved) { setPairId(saved); subscribePair(saved); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 近接アラート
  const [nearbyAlert, setNearbyAlert] = useState<Bakery | null>(null);
  const notifiedRef = useRef<Record<number, number>>({}); // id -> 通知時刻
  const bakeriesRef = useRef<Bakery[]>([]);
  const interestedRef = useRef<Set<number>>(new Set());
  const bookmarksRef = useRef<Set<number>>(new Set());

  // bakeries・interested・bookmarksの最新値をrefに同期
  useEffect(() => { bakeriesRef.current = bakeries; }, [bakeries]);
  useEffect(() => { interestedRef.current = interested; }, [interested]);
  useEffect(() => { bookmarksRef.current = bookmarks; }, [bookmarks]);

  useEffect(() => {
    if (!navigator.geolocation) { setLocating(false); return; }

    // 初回取得
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCenter(coords);
        setHasLocation(true);
        setLocating(false);
        currentPosRef.current = coords;
        setSortedRegions(sortRegionsByLocation(coords[0], coords[1]));
      },
      () => setLocating(false),
      { timeout: 10000, maximumAge: 60000 }
    );

    // 継続監視(30秒ごとに位置更新)
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCenter(coords);
        currentPosRef.current = coords;

        // 気になる・お気に入り店の近接チェック
        const now = Date.now();
        const ALERT_RADIUS_KM = 0.5; // 500m
        const COOLDOWN_MS = 3 * 60 * 1000; // 3分

        for (const bakery of bakeriesRef.current) {
          const isInterested = interestedRef.current.has(bakery.id);
          const isBookmarked = bookmarksRef.current.has(bakery.id);
          if (!isInterested && !isBookmarked) continue;
          const dist = calcDistance(coords[0], coords[1], bakery.latitude, bakery.longitude);
          if (dist <= ALERT_RADIUS_KM) {
            const lastNotified = notifiedRef.current[bakery.id] || 0;
            if (now - lastNotified > COOLDOWN_MS) {
              notifiedRef.current[bakery.id] = now;
              setNearbyAlert({ ...bakery, distance: dist });
              break;
            }
          }
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { setSelectedRegions(JSON.parse(saved)); }
    else { setShowRegionSelect(true); }
    const savedBookmarks = localStorage.getItem(BOOKMARK_KEY);
    if (savedBookmarks) { setBookmarks(new Set(JSON.parse(savedBookmarks))); }
    const savedInterested = localStorage.getItem(INTERESTED_KEY);
    if (savedInterested) { setInterested(new Set(JSON.parse(savedInterested))); }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized || selectedRegions.length === 0) return;
    fetchBakeries(selectedRegions);
  }, [selectedRegions, initialized]);

  useEffect(() => {
    if (!hasLocation || bakeries.length === 0) return;
    const [lat, lng] = center;
    setBakeries(prev => prev.map(b => ({
      ...b,
      distance: calcDistance(lat, lng, b.latitude, b.longitude)
    })));
  }, [hasLocation]);

  async function fetchBakeries(regions: string[]) {
    setLoading(true);
    const { data, error } = await supabase
      .from("bakeries")
      .select("id, name, latitude, longitude, area, address, opening_hours, website, region")
      .in("region", regions);
    if (error) console.error("Supabase error:", error);
    const raw = data || [];
    const pos = currentPosRef.current;
    if (pos) {
      const [lat, lng] = pos;
      setBakeries(raw.map(b => ({ ...b, distance: calcDistance(lat, lng, b.latitude, b.longitude) })));
    } else {
      setBakeries(raw);
    }
    setLoading(false);
  }

  const toggleBookmark = useCallback((id: number) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const toggleInterested = useCallback((id: number) => {
    setInterested(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      localStorage.setItem(INTERESTED_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  function handleRegionToggle(region: string) {
    setSelectedRegions(prev =>
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  }

  function handleRegionConfirm() {
    if (selectedRegions.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedRegions));
    setShowRegionSelect(false);
  }

  const sortedBakeries = [...bakeries].sort((a, b) => {
    if (a.distance != null && b.distance != null) return a.distance - b.distance;
    if (a.distance != null) return -1;
    if (b.distance != null) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  // 検索フィルタ
  const searchedBakeries = searchQuery.trim()
    ? sortedBakeries.filter(b =>
        (b.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.address || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedBakeries;

  const bookmarkedBakeries = sortedBakeries.filter(b => bookmarks.has(b.id));

  if (showRegionSelect) {
    return (
      <div className="flex flex-col min-h-screen bg-amber-50">
        <header className="bg-amber-800 text-white px-4 py-4 text-center">
          <h1 className="text-2xl font-bold">🥐 ゴパン</h1>
          <p className="text-sm text-amber-200 mt-1">使うエリアを選んでください</p>
        </header>
        <div className="flex-1 px-4 py-4">
          <p className="text-xs text-gray-500 mb-4 text-center">複数選択できます。後から変更も可能です。</p>
          {/* プライバシーポリシーを上部に */}
          <div className="bg-amber-100 rounded-lg px-4 py-3 mb-4 text-center">
            <a href="/about" className="text-amber-700 text-xs underline font-medium">
              📋 プライバシーポリシー・免責事項・ご注意
            </a>
            <p className="text-xs text-gray-500 mt-1">ご利用前にご確認ください</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {sortedRegions.map(region => {
              const isSelected = selectedRegions.includes(region.name);
              return (
                <button key={region.name} onClick={() => handleRegionToggle(region.name)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected ? "bg-amber-700 border-amber-700 text-white" : "bg-white border-amber-200 text-amber-900"
                  }`}
                >
                  <span className="text-2xl">{region.emoji}</span>
                  <div>
                    <p className="font-bold text-sm">{region.name}</p>
                    <p className={`text-xs mt-0.5 ${isSelected ? "text-amber-200" : "text-gray-500"}`}>{region.desc}</p>
                  </div>
                  {isSelected && <span className="ml-auto text-white text-lg">✓</span>}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            位置情報は <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a> のデータを使用しています。
          </p>
        </div>
        <div className="sticky bottom-0 p-4 bg-amber-50 border-t border-amber-200">
          <button onClick={handleRegionConfirm} disabled={selectedRegions.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
              selectedRegions.length > 0 ? "bg-amber-700 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {selectedRegions.length > 0 ? `${selectedRegions.join('・')}で始める 🥐` : "エリアを選んでください"}
          </button>
        </div>
      </div>
    );
  }

  const BakeryListItem = ({ bakery }: { bakery: Bakery }) => {
    const isBookmarked = bookmarks.has(bakery.id);
    const isInterested = interested.has(bakery.id);
    return (
      <li className={`px-4 py-3 ${isInterested ? "bg-red-50" : "bg-white"} hover:bg-amber-50`}>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p
              className="font-medium text-amber-900 text-sm truncate cursor-pointer underline decoration-amber-300"
              onClick={() => {
                setView("map");
                setTimeout(() => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const map = (window as any)._gopanMap;
                  if (map) map.setView([bakery.latitude, bakery.longitude], 17);
                }, 100);
              }}
              title="地図で見る"
            >
              🥐 {bakery.name || "名称不明"}
            </p>
            {bakery.distance != null && (
              <p className="text-xs text-amber-600 mt-0.5 font-medium">
                📍 {formatDistance(bakery.distance)}
              </p>
            )}
            {bakery.address && <p className="text-xs text-gray-500 mt-0.5 truncate">{bakery.address}</p>}
            {bakery.opening_hours && <p className="text-xs text-gray-400 mt-0.5 truncate">🕐 {bakery.opening_hours}</p>}
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            {/* 気になる(赤丸) */}
            <button
              onClick={() => toggleInterested(bakery.id)}
              style={{
                width: "28px", height: "28px",
                borderRadius: "50%",
                border: `2px solid ${isInterested ? "#ef4444" : "#d1d5db"}`,
                background: isInterested ? "#ef4444" : "white",
                color: isInterested ? "white" : "#d1d5db",
                fontSize: "14px",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
              title="気になる"
            >
              ♥
            </button>
            {/* お気に入り(星) */}
            <button
              onClick={() => toggleBookmark(bakery.id)}
              className={`text-xl ${isBookmarked ? "text-amber-400" : "text-gray-300"}`}
            >
              {isBookmarked ? "⭐" : "☆"}
            </button>
            {/* ペアに送る */}
            {pairId && (
              <button
                onClick={() => shareBakery(bakery)}
                style={{
                  width: "28px", height: "28px",
                  borderRadius: "50%",
                  border: "2px solid #f59e0b",
                  background: "white",
                  color: "#f59e0b",
                  fontSize: "13px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
                title="ペアに送る"
              >
                📤
              </button>
            )}
            {/* LINE共有 */}
            <a
              href={"https://line.me/R/share?text=" + encodeURIComponent("🥐 " + (bakery.name || "") + "
" + (bakery.address || "") + "
https://gopan.vercel.app")}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: "28px", height: "28px",
                borderRadius: "50%",
                border: "2px solid #06C755",
                background: "white",
                color: "#06C755",
                fontSize: "13px",
                display: "flex", alignItems: "center", justifyContent: "center",
                textDecoration: "none",
              }}
              title="LINEで共有"
            >
              L
            </a>
            {/* X投稿 */}
            <a
              href={"https://twitter.com/intent/tweet?text=" + encodeURIComponent("🥐 " + (bakery.name || "") + " に行ってきた！
" + (bakery.address || "") + "
#ゴパン #パン活
https://gopan.vercel.app")}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: "28px", height: "28px",
                borderRadius: "50%",
                border: "2px solid #000",
                background: "white",
                color: "#000",
                fontSize: "11px",
                fontWeight: "bold",
                display: "flex", alignItems: "center", justifyContent: "center",
                textDecoration: "none",
              }}
              title="Xに投稿"
            >
              X
            </a>
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      <header className="bg-amber-800 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <button onClick={() => setShowRegionSelect(true)} className="text-left">
          <h1 className="text-xl font-bold">🥐 ゴパン</h1>
          <p className="text-xs text-amber-300">タップでエリア変更</p>
        </button>
        <p className="text-xs text-amber-200">
          {loading ? "読込中..." : `${bakeries.length}件`}
        </p>
      </header>

      {/* 近接アラートバナー */}
      {nearbyAlert && (
        <div
          className="bg-red-500 text-white px-4 py-3 flex items-center justify-between cursor-pointer shadow-lg"
          onClick={() => {
            setNearbyAlert(null);
            setView("map");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const map = (window as any)._gopanMap;
            if (map) map.setView([nearbyAlert.latitude, nearbyAlert.longitude], 16);
          }}
        >
          <div className="flex-1">
            <p className="font-bold text-sm">🥐 近くに気になるお店があります!</p>
            <p className="text-xs mt-0.5 text-red-100">
              {nearbyAlert.name} — {nearbyAlert.distance != null ? formatDistance(nearbyAlert.distance) : ""}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setNearbyAlert(null); }}
            className="text-red-200 text-lg ml-3"
          >✕</button>
        </div>
      )}

      {/* 受信バナー */}
      {receivedBakery && (
        <div
          className="bg-amber-500 text-white px-4 py-3 flex items-center justify-between cursor-pointer shadow-lg"
          onClick={() => {
            setReceivedBakery(null);
            setView("map");
            setTimeout(() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const map = (window as any)._gopanMap;
              if (map) map.setView([receivedBakery.latitude, receivedBakery.longitude], 17);
            }, 100);
          }}
        >
          <div className="flex-1">
            <p className="font-bold text-sm">📤 パン屋が送られてきました！</p>
            <p className="text-xs mt-0.5 text-amber-100">{receivedBakery.name} — タップで地図を表示</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setReceivedBakery(null); }}
            className="text-amber-200 text-lg ml-3"
          >✕</button>
        </div>
      )}

      <div className="flex bg-white border-b border-amber-100">
        <button onClick={() => setView("map")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${view === "map" ? "text-amber-800 border-b-2 border-amber-700" : "text-gray-400"}`}
        >🗺️ 地図</button>
        <button onClick={() => setView("list")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${view === "list" ? "text-amber-800 border-b-2 border-amber-700" : "text-gray-400"}`}
        >📋 リスト</button>
        <button onClick={() => setView("bookmarks")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${view === "bookmarks" ? "text-amber-800 border-b-2 border-amber-700" : "text-gray-400"}`}
        >⭐ {bookmarks.size > 0 ? bookmarks.size : ""}</button>
        <button onClick={() => setShowPairModal(true)}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${pairId ? "text-amber-800 border-b-2 border-amber-700" : "text-gray-400"}`}
        >{pairId ? "🔗" : "🔗"}</button>
      </div>

      {/* ペアリングモーダル */}
      {showPairModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-amber-900 mb-1">🔗 ペアリング</h2>
            <p className="text-xs text-gray-500 mb-4">同乗者とパン屋を共有できます</p>

            {pairId ? (
              <div>
                <div className="bg-amber-50 rounded-xl p-4 mb-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">ルームコード</p>
                  <p className="text-3xl font-bold tracking-widest text-amber-800">{pairId}</p>
                  <p className="text-xs text-gray-400 mt-1">相手にこのコードを伝えてください</p>
                </div>
                <p className="text-xs text-center text-gray-500 mb-4">
                  リストの 📤 ボタンでパン屋を送れます
                </p>
                <button
                  onClick={() => { leavePair(); setShowPairModal(false); }}
                  className="w-full py-2 rounded-xl border border-red-300 text-red-500 text-sm font-medium mb-2"
                >ペアを解除する</button>
                <button
                  onClick={() => setShowPairModal(false)}
                  className="w-full py-2 rounded-xl bg-amber-700 text-white text-sm font-bold"
                >閉じる</button>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => { createPair(); }}
                  className="w-full py-3 rounded-xl bg-amber-700 text-white font-bold mb-3"
                >🆕 ルームを作成する</button>
                <p className="text-xs text-center text-gray-400 mb-3">または</p>
                <input
                  type="text"
                  value={pairInput}
                  onChange={e => setPairInput(e.target.value.toLowerCase())}
                  placeholder="コードを入力(例: AB1234)"
                  className="w-full px-4 py-2 border border-amber-200 rounded-xl text-sm mb-2 focus:outline-none focus:border-amber-500 text-center tracking-widest font-bold"
                  maxLength={6}
                />
                <button
                  onClick={() => { joinPair(pairInput); setShowPairModal(false); }}
                  disabled={pairInput.length < 4}
                  className="w-full py-2 rounded-xl bg-amber-100 text-amber-800 text-sm font-bold mb-3 disabled:opacity-40"
                >参加する</button>
                <button
                  onClick={() => setShowPairModal(false)}
                  className="w-full py-2 rounded-xl border border-gray-200 text-gray-500 text-sm"
                >キャンセル</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {loading || locating ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-amber-800">🥐 読み込み中...</p>
          </div>
        ) : view === "map" ? (
          <div className="h-full">
            <Map
              bakeries={bakeries}
              center={center}
              bookmarks={bookmarks}
              interested={interested}
              onToggleBookmark={toggleBookmark}
              onToggleInterested={toggleInterested}
              onShareBakery={shareBakery}
              pairId={pairId}
            />
          </div>
        ) : view === "bookmarks" ? (
          <div className="h-full overflow-y-auto">
            {bookmarkedBakeries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <p className="text-gray-500 text-sm">お気に入りはまだありません</p>
                <p className="text-gray-400 text-xs">リストの ☆ から登録できます</p>
              </div>
            ) : (
              <ul className="divide-y divide-amber-100">
                {bookmarkedBakeries.map(bakery => <BakeryListItem key={bakery.id} bakery={bakery} />)}
              </ul>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col overflow-hidden">
            {/* 検索バー */}
            <div className="px-3 py-2 bg-white border-b border-amber-100">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="店舗名・住所で検索..."
                  className="w-full pl-8 pr-8 py-2 text-sm border border-amber-200 rounded-full bg-amber-50 focus:outline-none focus:border-amber-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                  >✕</button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {searchedBakeries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <p className="text-gray-500 text-sm">
                    {searchQuery ? `「${searchQuery}」は見つかりませんでした` : "パン屋が見つかりません"}
                  </p>
                  {searchQuery && (
                    <p className="text-gray-400 text-xs">別のエリアも選択してみてください</p>
                  )}
                </div>
              ) : (
                <>
                  {!searchQuery && hasLocation && (
                    <p className="text-xs text-amber-700 text-center py-2 bg-amber-50 border-b border-amber-100">
                      📍 現在地から近い順　♥気になる　☆お気に入り
                    </p>
                  )}
                  {searchQuery && (
                    <p className="text-xs text-amber-700 text-center py-2 bg-amber-50 border-b border-amber-100">
                      🔍 「{searchQuery}」の検索結果 {searchedBakeries.length}件
                    </p>
                  )}
                  <ul className="divide-y divide-amber-100">
                    {searchedBakeries.map(bakery => <BakeryListItem key={bakery.id} bakery={bakery} />)}
                  </ul>
                  <p className="text-xs text-gray-400 text-center py-4 px-4">
                    位置情報は <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a> のデータを使用。情報が古い・不正確な場合があります。<br/>
                    ⭐♥の登録はこの端末のブラウザに保存されます。キャッシュ削除で消える場合があります。<br/>
                    <a href="/about" className="text-amber-600 underline mt-1 inline-block">
                      📋 プライバシーポリシー・免責事項
                    </a>
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
