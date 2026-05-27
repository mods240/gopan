"use client";

import { useEffect, useState } from "react";
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

const REGION_AREAS: Record<string, string[]> = {
  '関西': ['大阪市内', '神戸・芦屋', '京都市内', '北摂', '阪神間', '奈良市内', '和歌山・南大阪', '滋賀', '関西その他'],
  '関東': ['東京都心', '東京北部', '東京南部・世田谷', '横浜・川崎', '神奈川北部', '神奈川南部', '埼玉', '千葉', '茨城・栃木・群馬', '関東その他'],
  '中京': ['名古屋市内', '愛知西部', '愛知東部・豊橋', '岐阜', '三重', '静岡西部・浜松', '静岡中部・東部', '中京その他'],
  '東北': ['仙台', '福島', '盛岡', '一関・北上', '青森', '秋田', '山形', '東北その他'],
  '北陸・信越': ['富山', '金沢', '福井', '新潟', '長野', '松本', '北陸・信越その他'],
  '中国・四国': ['広島市内', '広島西部', '岡山', '山口・下関', '高松', '松山', '高知', '徳島', '中国・四国その他'],
  '九州': ['福岡市内', '北九州', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '九州その他'],
  '北海道': ['札幌', '旭川', '函館', '札幌東部・江別', '帯広', '釧路・根室', '北海道その他'],
  '沖縄': ['那覇', '沖縄中部', '沖縄北部', '沖縄その他'],
};

const STORAGE_KEY = 'gopan_selected_regions';
const DEFAULT_CENTER: [number, number] = [34.7, 135.5];

export default function Home() {
  const [bakeries, setBakeries] = useState<Bakery[]>([]);
  const [filtered, setFiltered] = useState<Bakery[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState("すべて");
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [showRegionSelect, setShowRegionSelect] = useState(false);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(true);
  const [view, setView] = useState<"map" | "list">("map");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) { setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCenter([pos.coords.latitude, pos.coords.longitude]); setLocating(false); },
      () => setLocating(false),
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSelectedRegions(JSON.parse(saved));
    } else {
      setShowRegionSelect(true);
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized || selectedRegions.length === 0) return;
    fetchBakeries(selectedRegions);
  }, [selectedRegions, initialized]);

  useEffect(() => {
    const areas: string[] = [];
    selectedRegions.forEach(region => {
      (REGION_AREAS[region] || []).forEach(area => {
        if (!areas.includes(area)) areas.push(area);
      });
    });
    setAvailableAreas(areas);
    setSelectedArea("すべて");
  }, [selectedRegions]);

  useEffect(() => {
    if (selectedArea === "すべて") {
      setFiltered(bakeries);
    } else {
      setFiltered(bakeries.filter(b => b.area === selectedArea));
    }
  }, [selectedArea, bakeries]);

  async function fetchBakeries(regions: string[]) {
    setLoading(true);
    const { data, error } = await supabase
      .from("bakeries")
      .select("id, name, latitude, longitude, area, address, opening_hours, website, region")
      .in("region", regions);
    if (error) console.error("Supabase error:", error);
    setBakeries(data || []);
    setFiltered(data || []);
    setLoading(false);
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
                <button
                  key={region.name}
                  onClick={() => handleRegionToggle(region.name)}
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
        </div>
        <div className="sticky bottom-0 p-4 bg-amber-50 border-t border-amber-200">
          <button
            onClick={handleRegionConfirm}
            disabled={selectedRegions.length === 0}
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

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      <header className="bg-amber-800 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <button onClick={() => setShowRegionSelect(true)} className="text-left">
          <h1 className="text-xl font-bold">🥐 ゴパン</h1>
          <p className="text-xs text-amber-300">タップでエリア変更</p>
        </button>
        <p className="text-xs text-amber-200">
          {loading ? "読込中..." : `${filtered.length}件`}
        </p>
      </header>

      {availableAreas.length > 0 && (
        <div className="flex gap-2 px-3 py-2 overflow-x-auto bg-white border-b border-amber-100">
          <button
            onClick={() => setSelectedArea("すべて")}
            className={`whitespace-nowrap text-xs px-3 py-1 rounded-full border transition-colors ${
              selectedArea === "すべて" ? "bg-amber-700 text-white border-amber-700" : "bg-white text-amber-800 border-amber-300"
            }`}
          >
            すべて
          </button>
          {availableAreas.map(area => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`whitespace-nowrap text-xs px-3 py-1 rounded-full border transition-colors ${
                selectedArea === area ? "bg-amber-700 text-white border-amber-700" : "bg-white text-amber-800 border-amber-300"
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      )}

      <div className="flex bg-white border-b border-amber-100">
        <button onClick={() => setView("map")} className={`flex-1 py-2 text-sm font-medium transition-colors ${view === "map" ? "text-amber-800 border-b-2 border-amber-700" : "text-gray-400"}`}>
          🗺️ 地図
        </button>
        <button onClick={() => setView("list")} className={`flex-1 py-2 text-sm font-medium transition-colors ${view === "list" ? "text-amber-800 border-b-2 border-amber-700" : "text-gray-400"}`}>
          📋 リスト
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading || locating ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-amber-800">🥐 読み込み中...</p>
          </div>
        ) : view === "map" ? (
          <div className="h-full"><Map bakeries={filtered} center={center} /></div>
        ) : (
          <div className="h-full overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-gray-500 text-sm">パン屋が見つかりません</p>
              </div>
            ) : (
              <ul className="divide-y divide-amber-100">
                {filtered.map((bakery) => (
                  <li key={bakery.id} className="px-4 py-3 bg-white hover:bg-amber-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-amber-900 text-sm">🥐 {bakery.name || "名称不明"}</p>
                        {bakery.area && <p className="text-xs text-amber-600 mt-0.5">{bakery.area}</p>}
                        {bakery.address && <p className="text-xs text-gray-500 mt-0.5">{bakery.address}</p>}
                        {bakery.opening_hours && <p className="text-xs text-gray-400 mt-0.5">🕐 {bakery.opening_hours}</p>}
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${bakery.latitude},${bakery.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 bg-amber-600 text-white text-xs py-1 px-3 rounded-full whitespace-nowrap"
                      >
                        地図
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
