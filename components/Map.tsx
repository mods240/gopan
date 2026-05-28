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

function createCurrentIcon(heading: number | null) {
  const arrow = heading !== null
    ? `<div style="position:absolute;top:-20px;left:50%;transform:translateX(-50%) rotate(${heading}deg);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:18px solid #2563eb;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4))"></div>`
    : '';
  return L.divIcon({
    html: `<div style="position:relative;width:20px;height:20px">${arrow}<div style="width:20px;height:20px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);position:absolute;top:0;left:0"></div></div>`,
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

function MapInit({ center }: { center: [number, number] }) {
  const map = useMap();
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      map.setView(center, 14);
      initialized.current = true;
      // グローバルにmapを保持(現在地ボタン用)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)._gopanMap = map;
    }
  }, [center, map]);
  return null;
}

export default function Map({ bakeries, center, bookmarks, onToggleBookmark }: MapProps) {
  const [heading, setHeading] = useState<number | null>(null);
  const [headingUp, setHeadingUp] = useState(false);
  const [iosPermission, setIosPermission] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DOE = DeviceOrientationEvent as any;
    if (typeof DOE.requestPermission === 'function') {
      setIosPermission(true); // iOS: ボタンで許可が必要
    } else {
      listenOrientation(); // Android: 直接開始
    }
  }, []);

  function listenOrientation() {
    window.addEventListener('deviceorientation', (e: DeviceOrientationEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ios = (e as any).webkitCompassHeading;
      if (ios != null) {
        setHeading(Math.round(ios));
      } else if (e.alpha != null) {
        setHeading(Math.round((360 - e.alpha) % 360));
      }
    }, true);
  }

  async function requestIosPermission() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DeviceOrientationEvent as any).requestPermission();
      if (result === 'granted') {
        setIosPermission(false);
        listenOrientation();
      }
    } catch (e) {
      console.error(e);
    }
  }

  function goToCurrentLocation() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (window as any)._gopanMap;
    if (map) map.setView(center, 14);
  }

  // ヘディングアップ: leaflet-containerをCSS回転
  useEffect(() => {
    const el = document.querySelector('.leaflet-container') as HTMLElement;
    if (!el) return;
    if (headingUp && heading !== null) {
      el.style.transform = `rotate(${-heading}deg)`;
      el.style.transition = 'transform 0.3s ease';
    } else {
      el.style.transform = 'rotate(0deg)';
      el.style.transition = 'transform 0.3s ease';
    }
  }, [heading, headingUp]);

  const currentIcon = createCurrentIcon(heading);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden" }}>

      {/* iOSコンパス許可ボタン */}
      {iosPermission && (
        <button
          onClick={requestIosPermission}
          style={{
            position: "absolute", top: "10px", left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000, background: "white",
            border: "1px solid #d97706", borderRadius: "20px",
            padding: "6px 14px", fontSize: "12px", cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)", whiteSpace: "nowrap",
          }}
        >
          🧭 コンパスを有効にする
        </button>
      )}

      {/* 右下のコントロール */}
      <div style={{
        position: "absolute", bottom: "24px", right: "12px",
        zIndex: 1000, display: "flex", flexDirection: "column", gap: "8px",
      }}>
        {/* コンパスローズ(向きに応じて回転) */}
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%",
          background: "white", border: "2px solid #d97706",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px",
          transform: heading !== null && !headingUp ? `rotate(${-heading}deg)` : "none",
          transition: "transform 0.3s ease",
        }}>
          🧭
        </div>

        {/* ヘディングアップ / ノースアップ切り替え */}
        <button
          onClick={() => setHeadingUp(v => !v)}
          style={{
            width: "44px", height: "44px", borderRadius: "50%",
            background: headingUp ? "#d97706" : "white",
            border: "2px solid #d97706",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            fontSize: "11px", fontWeight: "bold",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: headingUp ? "white" : "#92400e",
          }}
        >
          {headingUp ? "HDG" : "N↑"}
        </button>

        {/* 現在地に戻る */}
        <button
          onClick={goToCurrentLocation}
          style={{
            width: "44px", height: "44px", borderRadius: "50%",
            background: "white", border: "2px solid #d97706",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            fontSize: "20px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          📍
        </button>
      </div>

      <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInit center={center} />

        <Marker position={center} icon={currentIcon}>
          <Popup>📍 現在地{heading !== null ? `　方位: ${heading}°` : ""}</Popup>
        </Marker>

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
