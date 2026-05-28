"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const starIcon = L.divIcon({
  html: `<div style="position:relative">
    <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" style="width:25px;height:41px;filter:sepia(1) saturate(5) hue-rotate(0deg) brightness(1.2)"/>
    <span style="position:absolute;top:-6px;right:-6px;font-size:14px">⭐</span>
  </div>`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: "",
});

// 現在地+方向マーカーを動的に生成
function createCurrentIcon(heading: number | null) {
  const arrow = heading !== null
    ? `<div style="
        position:absolute;top:-18px;left:50%;transform:translateX(-50%) rotate(${heading}deg);
        width:0;height:0;
        border-left:6px solid transparent;
        border-right:6px solid transparent;
        border-bottom:16px solid #2563eb;
        filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4));
      "></div>`
    : '';
  return L.divIcon({
    html: `<div style="position:relative;width:20px;height:20px">
      ${arrow}
      <div style="
        width:20px;height:20px;
        background:#2563eb;border:3px solid white;
        border-radius:50%;
        box-shadow:0 2px 6px rgba(0,0,0,0.4);
        position:absolute;top:0;left:0;
      "></div>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    className: "",
  });
}

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

interface MapProps {
  bakeries: Bakery[];
  center: [number, number];
  bookmarks: Set<number>;
  onToggleBookmark: (id: number) => void;
}

function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      map.setView(center, 14);
      initialized.current = true;
    }
  }, [center, map]);
  return null;
}

// コンパス + 現在地ボタン + ヘディングアップ制御
function MapControls({
  center,
  heading,
  headingUp,
  onToggleHeadingUp,
}: {
  center: [number, number];
  heading: number | null;
  headingUp: boolean;
  onToggleHeadingUp: () => void;
}) {
  const map = useMap();

  // ヘディングアップ時に地図を回転
  useEffect(() => {
    if (headingUp && heading !== null) {
      map.setBearing(-heading);
    } else if (!headingUp) {
      map.setBearing(0);
    }
  }, [heading, headingUp, map]);

  return (
    <div style={{ position: "absolute", bottom: "24px", right: "12px", zIndex: 1000, display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* コンパス */}
      <div style={{
        width: "44px", height: "44px", borderRadius: "50%",
        background: "white", border: "2px solid #d97706",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "22px",
        transform: heading !== null ? `rotate(${-heading}deg)` : "none",
        transition: "transform 0.3s ease",
      }}>
        🧭
      </div>

      {/* ヘディングアップ切り替え */}
      <button
        onClick={onToggleHeadingUp}
        style={{
          width: "44px", height: "44px", borderRadius: "50%",
          background: headingUp ? "#d97706" : "white",
          border: "2px solid #d97706",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          fontSize: "18px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: headingUp ? "white" : "#d97706",
        }}
        title={headingUp ? "ノースアップに切り替え" : "ヘディングアップに切り替え"}
      >
        {headingUp ? "🔒" : "📐"}
      </button>

      {/* 現在地に戻る */}
      <button
        onClick={() => {
          map.setView(center, 14);
          if (!headingUp) map.setBearing(0);
        }}
        style={{
          width: "44px", height: "44px", borderRadius: "50%",
          background: "white", border: "2px solid #d97706",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          fontSize: "20px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        title="現在地に戻る"
      >
        📍
      </button>
    </div>
  );
}

export default function Map({ bakeries, center, bookmarks, onToggleBookmark }: MapProps) {
  const [heading, setHeading] = useState<number | null>(null);
  const [headingUp, setHeadingUp] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  // デバイスの向きを取得
  useEffect(() => {
    // iOS13以降はパーミッション要求が必要
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DeviceOrientationEventTyped = DeviceOrientationEvent as any;
    if (typeof DeviceOrientationEventTyped.requestPermission === 'function') {
      // iOSの場合はタップ時に許可を求める(別途ボタンで対応)
    }

    function handleOrientation(e: DeviceOrientationEvent) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const compassHeading = (e as any).webkitCompassHeading ?? e.alpha;
      if (compassHeading !== null) {
        setHeading(Math.round(compassHeading));
      }
    }

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  const currentIcon = createCurrentIcon(heading);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {/* iOS向けコンパス許可ボタン */}
      {heading === null && (
        <button
          onClick={async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const DeviceOrientationEventTyped = DeviceOrientationEvent as any;
            if (typeof DeviceOrientationEventTyped.requestPermission === 'function') {
              await DeviceOrientationEventTyped.requestPermission();
            }
          }}
          style={{
            position: "absolute", top: "10px", left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000, background: "white",
            border: "1px solid #d97706", borderRadius: "20px",
            padding: "4px 12px", fontSize: "12px", cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          🧭 コンパスを有効にする
        </button>
      )}

      <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenter center={center} />
        <MapControls
          center={center}
          heading={heading}
          headingUp={headingUp}
          onToggleHeadingUp={() => setHeadingUp(v => !v)}
        />

        {/* 現在地マーカー(方向付き) */}
        <Marker position={center} icon={currentIcon}>
          <Popup>📍 現在地{heading !== null ? `　方位: ${heading}°` : ""}</Popup>
        </Marker>

        {/* パン屋マーカー */}
        {bakeries.map((bakery) => {
          const isBookmarked = bookmarks.has(bakery.id);
          return (
            <Marker
              key={bakery.id}
              position={[bakery.latitude, bakery.longitude]}
              icon={isBookmarked ? starIcon : defaultIcon}
            >
              <Popup>
                <div className="text-sm" style={{ minWidth: "160px" }}>
                  <p className="font-bold text-amber-900">🥐 {bakery.name || "名称不明"}</p>
                  {bakery.address && <p className="text-gray-600 text-xs mt-0.5">{bakery.address}</p>}
                  {bakery.opening_hours && (
                    <p className="text-gray-500 text-xs mt-1">🕐 {bakery.opening_hours}</p>
                  )}
                  <button
                    onClick={() => onToggleBookmark(bakery.id)}
                    style={{
                      width: "100%", marginTop: "8px", padding: "4px",
                      background: isBookmarked ? "#fef3c7" : "#f5f5f5",
                      border: `1px solid ${isBookmarked ? "#f59e0b" : "#ddd"}`,
                      borderRadius: "4px", cursor: "pointer", fontSize: "12px",
                    }}
                  >
                    {isBookmarked ? "⭐ お気に入り済み" : "☆ お気に入りに追加"}
                  </button>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${bakery.latitude},${bakery.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-2 text-center bg-amber-600 text-white text-xs py-1 px-2 rounded"
                  >
                    🗺️ Google Maps で開く
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
