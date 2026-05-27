"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
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
  distance?: number;
}

interface MapProps {
  bakeries: Bakery[];
  center: [number, number];
  currentPos: [number, number] | null;
  radius: number;
}

// 地図の中心を動的に変更するコンポーネント
function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  const prevCenter = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (
      !prevCenter.current ||
      prevCenter.current[0] !== center[0] ||
      prevCenter.current[1] !== center[1]
    ) {
      map.setView(center, 14);
      prevCenter.current = center;
    }
  }, [center, map]);

  return null;
}

export default function Map({ bakeries, center, currentPos, radius }: MapProps) {
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

      {/* 現在地マーカーと半径円 */}
      {currentPos && (
        <>
          <Marker position={currentPos} icon={currentIcon}>
            <Popup>📍 現在地</Popup>
          </Marker>
          <Circle
            center={currentPos}
            radius={radius * 1000}
            pathOptions={{ color: "#d97706", fillColor: "#fef3c7", fillOpacity: 0.2, weight: 2 }}
          />
        </>
      )}

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
              {bakery.distance !== undefined && (
                <p className="text-amber-600 text-xs mt-0.5">
                  📍 {bakery.distance < 1
                    ? `${Math.round(bakery.distance * 1000)}m`
                    : `${bakery.distance.toFixed(1)}km`}
                </p>
              )}
              {bakery.address && (
                <p className="text-gray-600 text-xs mt-0.5">{bakery.address}</p>
              )}
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
  );
}
