"use client";

import { useEffect, useState, useCallback } from "react";
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
  distance?: number;
}

// 2点間の距離を計算(km)
function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const RADIUS_OPTIONS = [1, 2, 5];
const DEFAULT_CENTER: [number, number] = [34.7, 135.5]; // 大阪デフォルト

export default function Home() {
  const [bakeries, setBakeries] = useState<Bakery[]>([]);
  const [filtered, setFiltered] = useState<Bakery[]>([]);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [radius, setRadius] = useState(1); // km
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(true);
  const [view, setView] = useState<"map" | "list">("map");

  // 現在地取得
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCurrentPos(coords);
        setCenter(coords);
        setLocating(false);
      },
      () => {
        setLocating(false); // 拒否された場合はデフォルト位置を使用
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Supabaseからデータ取得
  useEffect(() => {
    async function fetchBakeries() {
      const { data, error } = await supabase
        .from("bakeries")
        .select("id, name, latitude, longitude, area, address, opening_hours, website");

      if (error) {
        console.error("Supabase error:", error);
        setLoading(false);
        return;
      }
      setBakeries(data || []);
      setLoading(false);
    }
    fetchBakeries();
  }, []);

  // 現在地 + 半径でフィルタリング
  const filterByRadius = useCallback(() => {
    if (!currentPos) {
      setFiltered(bakeries);
      return;
    }
    const [lat, lng] = currentPos;
    const nearby = bakeries
      .map(b => ({
        ...b,
        distance: calcDistance(lat, lng, b.latitude, b.longitude)
      }))
      .filter(b => b.distance <= radius)
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    setFiltered(nearby);
  }, [bakeries, currentPos, radius]);

  useEffect(() => {
    filterByRadius();
  }, [filterByRadius]);

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

      {/* 半径切り替え */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-amber-100 overflow-x-auto">
        <span className="text-xs text-amber-700 whitespace-nowrap">📍 半径:</span>
        {RADIUS_OPTIONS.map(r => (
          <button
            key={r}
            onClick={() => setRadius(r)}
            className={`whitespace-nowrap text-xs px-3 py-1 rounded-full border transition-colors ${
              radius === r
                ? "bg-amber-700 text-white border-amber-700"
                : "bg-white text-amber-800 border-amber-300"
            }`}
          >
            {r}km
          </button>
        ))}
        {!currentPos && !locating && (
          <span className="text-xs text-gray-400 whitespace-nowrap">※現在地未取得</span>
        )}
        {locating && (
          <span className="text-xs text-amber-500 whitespace-nowrap">📡 現在地取得中...</span>
        )}
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
            <Map bakeries={filtered} center={center} currentPos={currentPos} radius={radius} />
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <p className="text-gray-500 text-sm">半径{radius}km以内にパン屋が見つかりません</p>
                <button
                  onClick={() => setRadius(r => r === 1 ? 2 : r === 2 ? 5 : 5)}
                  className="text-xs text-amber-700 underline"
                >
                  範囲を広げる
                </button>
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
                        {bakery.distance !== undefined && (
                          <p className="text-xs text-amber-600 mt-0.5">
                            📍 {bakery.distance < 1
                              ? `${Math.round(bakery.distance * 1000)}m`
                              : `${bakery.distance.toFixed(1)}km`}
                          </p>
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
