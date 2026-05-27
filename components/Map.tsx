"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leafletのデフォルトアイコン修正
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
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

export default function Map({ bakeries, center }: MapProps) {
  useEffect(() => {
    // Leafletのアイコン問題を修正
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
      zoom={12}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {bakeries.map((bakery) => (
        <Marker
          key={bakery.id}
          position={[bakery.latitude, bakery.longitude]}
          icon={icon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-bold text-amber-900">
                🥐 {bakery.name || "名称不明"}
              </p>
              {bakery.area && (
                <p className="text-gray-600 text-xs">{bakery.area}</p>
              )}
              {bakery.address && (
                <p className="text-gray-600 text-xs">{bakery.address}</p>
              )}
              {bakery.opening_hours && (
                <p className="text-gray-500 text-xs mt-1">
                  🕐 {bakery.opening_hours}
                </p>
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
