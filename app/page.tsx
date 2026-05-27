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
}

const AREAS = ["すべて", "大阪市内", "神戸・芦屋", "京都市内", "北摂", "阪神間", "奈良市内", "その他"];
const DEFAULT_CENTER: [number, number] = [34.7, 135.5];

export default function Home() {
  const [bakeries, setBakeries] = useState<Bakery[]>([]);
  const [filtered, setFiltered] = useState<Bakery[]>([]);
  const [selectedArea, setSelectedArea] = useState("すべて");
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(true);
  const [view, setView] = useState<"map" | "list">("map");

  // 現在地取得
  useEffect(() => {
    if (!navigator.geolocation) { setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // データ取得
  useEffect(() => {
    async function fetchBakeries() {
      const { data, error } = await supabase
        .from("bakeries")
        .select("id, name, latitude, longitude, area, address, opening_hours, website");
      if (error) console.error("Supabase error:", error);
      setBakeries(data || []);
      setFiltered(data || []);
      setLoading(false);
    }
    fetchBakeries();
  }, []);

  // エリアフィルタ
  useEffect(() => {
    if (selectedArea === "すべて") {
      setFiltered(bakeries);
    } else {
      setFiltered(bakeries.filter(b => b.area === selectedArea));
    }
  }, [selectedArea, bakeries]);

  const isReady = !loading && !locating;

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* ヘッダー */}
      <header className="bg-amber-800 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-xl font-bold">🥐 ゴパン</h1>
        <p className="text-xs text-amber-200">
          {isReady ? `${filtered.length}件` : "取得中..."}
        </p>
      </header>

      {/* エリアフィルタ */}
      <div className="flex gap-2 px-3 py-2 overflow-x-auto bg-white border-b border-amber-100">
        {AREAS.map((area) => (
          <button
            key={area}
            onClick={() => setSelectedArea(area)}
            className={`whitespace-nowrap text-xs px-3 py-1 rounded-full border transition-colors ${
              selectedArea === area
                ? "bg-amber-700 text-white border-amber-700"
                : "bg-white text-amber-800 border-amber-300"
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      {/* 地図/リスト切り替え */}
      <div className="flex bg-white border-b border-amber-100">
        <button
          onClick={() => setView("map")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            view === "map" ? "text-amber-800 border-b-2 border-amber-700" : "text-gray-400"
          }`}
        >
          🗺️ 地図
        </button>
        <button
          onClick={() => setView("list")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            view === "list" ? "text-amber-800 border-b-2 border-amber-700" : "text-gray-400"
          }`}
        >
          📋 リスト
        </button>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-hidden">
        {!isReady ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-amber-800">🥐 読み込み中...</p>
            {locating && <p className="text-xs text-amber-600">現在地を取得しています...</p>}
          </div>
        ) : view === "map" ? (
          <div className="h-full">
            <Map bakeries={filtered} center={center} />
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-gray-500 text-sm">該当するパン屋が見つかりません</p>
              </div>
            ) : (
              <ul className="divide-y divide-amber-100">
                {filtered.map((bakery) => (
                  <li key={bakery.id} className="px-4 py-3 bg-white hover:bg-amber-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-amber-900 text-sm">
                          🥐 {bakery.name || "名称不明"}
                        </p>
                        {bakery.area && (
                          <p className="text-xs text-amber-600 mt-0.5">{bakery.area}</p>
                        )}
                        {bakery.address && (
                          <p className="text-xs text-gray-500 mt-0.5">{bakery.address}</p>
                        )}
                        {bakery.opening_hours && (
                          <p className="text-xs text-gray-400 mt-0.5">🕐 {bakery.opening_hours}</p>
                        )}
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
