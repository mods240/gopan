"use client";

import { useEffect, useRef } from "react";
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

const currentIcon = L.divIcon({
  html: `<div style="
    width:20px;height:20px;
    background:#2563eb;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 2px 8px rgba(37,99,235,0.6);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  className: "",
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)._gopanMap = map;
    }
  }, [center, map]);
  return null;
}

function LocateButton({ center }: { center: [number, number] }) {
  const map = useMap();
  return (
    <div style={{ position: "absolute", bottom: "24px", right: "12px", zIndex: 1000 }}>
      <button
        onClick={() => map.setView(center, 14)}
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
  );
}

export default function Map({ bakeries, center, bookmarks, onToggleBookmark }: MapProps) {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
    // 地図回転を解除
    const el = document.querySelector('.leaflet-container') as HTMLElement;
    if (el) { el.style.transform = ''; el.style.transition = ''; }
  }, []);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInit center={center} />
        <LocateButton center={center} />

        {/* 現在地マーカー */}
        <Marker position={center} icon={currentIcon}>
          <Popup>📍 現在地</Popup>
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
