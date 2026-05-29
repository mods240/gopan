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
  { name: '関西', emoji: '🏯', desc: '大阪・京都・兵庫・奈良など' },
  { name: '関東', emoji: '🗼', desc: '東京・神奈川・埼玉・千葉など' },
  { name: '中京', emoji: '🏙️', desc: '愛知・岐阜・三重・静岡' },
  { name: '東北', emoji: '⛄', desc: '宮城・福島・青森・岩手など' },
  { name: '北陸・信越', emoji: '🦀', desc: '新潟・長野・富山・石川・福井' },
  { name: '中国・四国', emoji: '🍋', desc: '広島・岡山・香川・愛媛など' },
  { name: '九州', emoji: '🌋', desc: '福岡・熊本・鹿児島・長崎など' },
  { name: '北海道', emoji: '🐻', desc: '北海道全域' },
  { name: '沖縄', emoji: '🌺', desc: '沖縄全島' },
];

const STORAGE_KEY = 'gopan_selected_regions';
const BOOKMARK_KEY = 'gopan_bookmarks';
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
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  const [showRegionSelect, setShowRegionSelect] = useState(false);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [hasLocation, setHasLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(true);
  const [view, setView] = useState<ViewType>("map");
  const [initialized, setInitialized] = useState(false);
  const [selectedBakery, setSelectedBakery] = useState<Bakery | null>(null);
  const currentPosRef = useRef<[number, number] | null>(null);

  // 現在地取得
  useEffect(() => {
    if (!navigator.geolocation) { setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCenter(coords);
        setHasLocation(true);
        setLocating(false);
        currentPosRef.current = coords;
      },
      () => setLocating(false),
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // 保存データ読み込み
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { setSelectedRegions(JSON.parse(saved)); }
    else { setShowRegionSelect(true); }
    const savedBookmarks = localStorage.getItem(BOOKMARK_KEY);
    if (savedBookmarks) { setBookmarks(new Set(JSON.parse(savedBookmarks))); }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized || selectedRegions.length === 0) return;
    fetchBakeries(selectedRegions);
  }, [selectedRegions, initialized]);

  // 現在地が取れたら距離を再計算
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
    // 現在地が既に取れていれば距離計算
    const pos = currentPosRef.current;
    if (pos) {
      const [lat, lng] = pos;
      setBakeries(raw.map(b => ({
        ...b,
        distance: calcDistance(lat, lng, b.latitude, b.longitude)
      })));
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

  // リストから地図にジャンプ
  function handleSelectBakery(bakery: Bakery) {
    setSelectedBakery(bakery);
    setView("map");
    // 地図をそのパン屋にフォーカス
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (window as any)._gopanMap;
    if (map) {
      map.setView([bakery.latitude, bakery.longitude], 16);
    }
  }

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
          <div className="grid grid-cols-1 gap-3">
            {ALL_REGIONS.map(region => {
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
          <p className="text-xs text-gray-400 text-center mt-6">
            パン屋の位置情報は <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a> のデータを使用しています。情報が古い・不正確な場合があります。
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
    const isSelected = selectedBakery?.id === bakery.id;
    return (
      <li
        className={`px-4 py-3 ${isSelected ? "bg-red-50 border-l-4 border-red-400" : "bg-white hover:bg-amber-50"}`}
      >
        <div className="flex justify-between items-start">
          <button
            className="flex-1 text-left"
            onClick={() => handleSelectBakery(bakery)}
          >
            <p className="font-medium text-amber-900 text-sm">
              {isSelected ? "📍" : "🥐"} {bakery.name || "名称不明"}
            </p>
            {bakery.distance != null && (
              <p className="text-xs text-amber-600 mt-0.5 font-medium">
                {formatDistance(bakery.distance)}
              </p>
            )}
            {bakery.address && <p className="text-xs text-gray-500 mt-0.5">{bakery.address}</p>}
            {bakery.opening_hours && <p className="text-xs text-gray-400 mt-0.5">🕐 {bakery.opening_hours}</p>}
          </button>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            <button onClick={() => toggleBookmark(bakery.id)}
              className={`text-xl ${isBookmarked ? "text-amber-400" : "text-gray-300"}`}
            >
              {isBookmarked ? "⭐" : "☆"}
            </button>
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
      </div>

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
              onToggleBookmark={toggleBookmark}
              selectedBakery={selectedBakery}
              onSelectBakery={setSelectedBakery}
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
          <div className="h-full overflow-y-auto">
            {sortedBakeries.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-gray-500 text-sm">パン屋が見つかりません</p>
              </div>
            ) : (
              <>
                {hasLocation && (
                  <p className="text-xs text-amber-700 text-center py-2 bg-amber-50 border-b border-amber-100">
                    📍 現在地から近い順　タップで地図に表示
                  </p>
                )}
                <ul className="divide-y divide-amber-100">
                  {sortedBakeries.map(bakery => <BakeryListItem key={bakery.id} bakery={bakery} />)}
                </ul>
                <p className="text-xs text-gray-400 text-center py-4 px-4">
                  位置情報は <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a> のデータを使用。情報が古い・不正確な場合があります。
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
