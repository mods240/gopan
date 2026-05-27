"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const currentIcon = L.divIcon({
  html: `<div style="width:16px;height:16px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
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
}

interface MapProps {
  bakeries: Bakery[];
  center: [number, number];
}

// 初回だけ現在地にセット
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

// 現在地に戻るボタン
function LocateButton({ center }: { center: [number, number] }) {
  const map = useMap();
  return (
    <div
      style={{
        position: "absolute",
        bottom: "24px",
        right: "12px",
        zIndex: 1000,
      }}
    >
      <button
        onClick={() => map.setView(center, 14)}
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "white",
          border: "2px solid #d97706",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          fontSize: "20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title="現在地に戻る"
      >
        📍
      </button>
    </div>
  );
}

export default function Map({ bakeries, center }: MapProps) {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenter center={center} />
        <LocateButton center={center} />

        {/* 現在地マーカー */}
        <Marker position={center} icon={currentIcon}>
          <Popup>📍 現在地</Popup>
        </Marker>

        {/* パン屋マーカー */}
        {bakeries.map((bakery) => (
          <Marker
            key={bakery.id}
            position={[bakery.latitude, bakery.longitude]}
            icon={icon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-amber-900">🥐 {bakery.name || "名称不明"}</p>
                {bakery.area && <p className="text-gray-600 text-xs mt-0.5">{bakery.area}</p>}
                {bakery.address && <p className="text-gray-600 text-xs mt-0.5">{bakery.address}</p>}
                {bakery.opening_hours && (
                  <p className="text-gray-500 text-xs mt-1">🕐 {bakery.opening_hours}</p>
                )}
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
        ))}
      </MapContainer>
    </div>
  );
}
