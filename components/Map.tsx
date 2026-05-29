"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
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

const selectedIcon = L.divIcon({
  html: `<div style="position:relative;width:30px;height:56px">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 50" width="30" height="50" style="position:absolute;top:6px;left:0">
      <path d="M15 0 C6.7 0 0 6.7 0 15 C0 26 15 50 15 50 C15 50 30 26 30 15 C30 6.7 23.3 0 15 0Z" fill="#ef4444" stroke="white" stroke-width="2"/>
      <circle cx="15" cy="15" r="6" fill="white" opacity="0.9"/>
    </svg>
    <div style="position:absolute;top:-2px;left:50%;transform:translateX(-50%);background:#ef4444;color:white;border-radius:8px;padding:1px 5px;font-size:9px;font-weight:bold;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.3)">気になる!</div>
  </div>`,
  iconSize: [30, 56],
  iconAnchor: [15, 56],
  popupAnchor: [0, -56],
  className: "",
});

// 方向ビーム付き現在地アイコンを動的生成
function createCurrentIcon(heading: number | null): L.DivIcon {
  const beam = heading !== null ? `
    <div style="
      position:absolute;
      width:0;height:0;
      left:50%;top:50%;
      transform-origin:0 0;
      transform:rotate(${heading}deg) translateX(-50%);
      border-left:18px solid transparent;
      border-right:18px solid transparent;
      border-bottom:52px solid rgba(37,99,235,0.2);
      margin-left:-18px;margin-top:-52px;
      filter:blur(2px);
    "></div>
    <div style="
      position:absolute;
      width:0;height:0;
      left:50%;top:50%;
      transform-origin:0 0;
      transform:rotate(${heading}deg) translateX(-50%);
      border-left:10px solid transparent;
      border-right:10px solid transparent;
      border-bottom:36px solid rgba(37,99,235,0.5);
      margin-left:-10px;margin-top:-36px;
    "></div>
  ` : "";
  return L.divIcon({
    html: `<div style="position:relative;width:60px;height:60px;display:flex;align-items:center;justify-content:center;">
      ${beam}
      <div style="position:relative;z-index:2;width:20px;height:20px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(37,99,235,0.6)"></div>
    </div>`,
    iconSize: [60, 60],
    iconAnchor: [30, 30],
    className: "",
  });
}

function getClusterColor(cluster: { getChildCount: () => number; getAllChildMarkers: () => L.Marker[] }, interested: Set<number>, bookmarks: Set<number>): string {
  const markers = cluster.getAllChildMarkers();
  let hasInterested = false;
  let hasBookmark = false;
  for (const marker of markers) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = (marker.options as any).bakeryId as number;
    if (id && interested.has(id)) { hasInterested = true; break; }
    if (id && bookmarks.has(id)) hasBookmark = true;
  }
  if (hasInterested) return "#ef4444";
  if (hasBookmark) return "#f59e0b";
  return "#92400e";
}

const createClusterIcon = (
  cluster: { getChildCount: () => number; getAllChildMarkers: () => L.Marker[] },
  interested: Set<number>,
  bookmarks: Set<number>
) => {
  const count = cluster.getChildCount();
  const color = getClusterColor(cluster, interested, bookmarks);
  return L.divIcon({
    html: `<div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center">
      <span style="font-size:34px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3))">🥐</span>
      <div style="
        position:absolute;top:0;right:0;
        min-width:18px;height:18px;
        background:${color};color:white;
        border:2px solid white;
        border-radius:9px;
        font-size:10px;font-weight:bold;
        display:flex;align-items:center;justify-content:center;
        padding:0 3px;
        box-shadow:0 1px 3px rgba(0,0,0,0.3);
      ">${count}</div>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    className: "",
  });
};

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

interface MapProps {
  bakeries: Bakery[];
  center: [number, number];
  bookmarks: Set<number>;
  interested: Set<number>;
  onToggleBookmark: (id: number) => void;
  onToggleInterested: (id: number) => void;
  onShareBakery?: (bakery: Bakery) => void;
  pairId?: string | null;
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
      >📍</button>
    </div>
  );
}

export default function Map({ bakeries, center, bookmarks, interested, onToggleBookmark, onToggleInterested, onShareBakery, pairId }: MapProps) {
  const markerRefs = useRef<Record<number, L.Marker>>({});
  const [heading, setHeading] = useState<number | null>(null);

  // デバイスの向きを取得してビームに反映
  useEffect(() => {
    function handleOrientation(e: DeviceOrientationEvent) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ios = (e as any).webkitCompassHeading;
      if (ios != null) {
        setHeading(ios);
      } else if (e.alpha != null) {
        setHeading(360 - e.alpha);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DevOrient = DeviceOrientationEvent as any;
    if (typeof DevOrient.requestPermission === "function") {
      DevOrient.requestPermission()
        .then((result: string) => {
          if (result === "granted") {
            window.addEventListener("deviceorientation", handleOrientation, true);
          }
        })
        .catch(() => {});
    } else {
      window.addEventListener("deviceorientation", handleOrientation, true);
    }
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
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

        <Marker position={center} icon={createCurrentIcon(heading)}>
          <Popup>📍 現在地</Popup>
        </Marker>

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={(cluster: { getChildCount: () => number; getAllChildMarkers: () => L.Marker[] }) => createClusterIcon(cluster, interested, bookmarks)}
          maxClusterRadius={60}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          spiderfyOnMaxZoom={true}
          disableClusteringAtZoom={16}
        >
          {bakeries.map((bakery) => {
            const isBookmarked = bookmarks.has(bakery.id);
            const isInterested = interested.has(bakery.id);
            const icon = isInterested ? selectedIcon : isBookmarked ? starIcon : defaultIcon;

            return (
              <Marker
                key={bakery.id}
                position={[bakery.latitude, bakery.longitude]}
                icon={icon}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {...{ bakeryId: bakery.id } as any}
                ref={(ref) => {
                  if (ref) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (ref.options as any).bakeryId = bakery.id;
                    markerRefs.current[bakery.id] = ref;
                  }
                }}
              >
                <Popup>
                  <div className="text-sm" style={{ minWidth: "160px" }}>
                    <p className="font-bold text-amber-900">🥐 {bakery.name || "名称不明"}</p>
                    {bakery.distance != null && (
                      <p className="text-amber-600 text-xs mt-0.5 font-medium">
                        📍 {bakery.distance < 1 ? `${Math.round(bakery.distance * 1000)}m` : `${bakery.distance.toFixed(1)}km`}
                      </p>
                    )}
                    {bakery.address && <p className="text-gray-600 text-xs mt-0.5">{bakery.address}</p>}
                    {bakery.opening_hours && (
                      <p className="text-gray-500 text-xs mt-1">🕐 {bakery.opening_hours}</p>
                    )}
                    <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                      <button
                        onClick={() => onToggleInterested(bakery.id)}
                        style={{
                          flex: 1, padding: "4px",
                          background: isInterested ? "#fee2e2" : "#f5f5f5",
                          border: `1px solid ${isInterested ? "#ef4444" : "#ddd"}`,
                          borderRadius: "4px", cursor: "pointer", fontSize: "12px",
                          color: isInterested ? "#ef4444" : "#666",
                        }}
                      >
                        {isInterested ? "♥ 気になる" : "♡ 気になる"}
                      </button>
                      <button
                        onClick={() => onToggleBookmark(bakery.id)}
                        style={{
                          flex: 1, padding: "4px",
                          background: isBookmarked ? "#fef3c7" : "#f5f5f5",
                          border: `1px solid ${isBookmarked ? "#f59e0b" : "#ddd"}`,
                          borderRadius: "4px", cursor: "pointer", fontSize: "12px",
                        }}
                      >
                        {isBookmarked ? "⭐ お気に入り" : "☆ お気に入り"}
                      </button>
                    </div>
                    {pairId && onShareBakery && (
                      <button
                        onClick={() => onShareBakery(bakery)}
                        style={{
                          width: "100%", padding: "4px",
                          background: "#fef3c7",
                          border: "1px solid #f59e0b",
                          borderRadius: "4px", cursor: "pointer", fontSize: "12px",
                          color: "#92400e", marginTop: "6px", fontWeight: "bold",
                        }}
                      >
                        📤 ペアに送る
                      </button>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${bakery.latitude},${bakery.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2 text-center bg-amber-600 text-white text-xs py-1 px-2 rounded"
                    >
                      🗺️ Google Maps で開く
                    </a>
                    <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
                      <a
                        href={"https://line.me/R/share?text=" + encodeURIComponent("🥐 " + (bakery.name || "") + "\n" + (bakery.address || "") + "\nhttps://gopan.vercel.app")}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1, padding: "4px", background: "#06C755",
                          borderRadius: "4px", fontSize: "12px", color: "white",
                          textAlign: "center", textDecoration: "none", fontWeight: "bold",
                        }}
                      >
                        LINE
                      </a>
                      <a
                        href={"https://twitter.com/intent/tweet?text=" + encodeURIComponent("🥐 " + (bakery.name || "") + " に行ってきた！\n" + (bakery.address || "") + "\n#ゴパン #パン活\nhttps://gopan.vercel.app")}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1, padding: "4px", background: "#000",
                          borderRadius: "4px", fontSize: "12px", color: "white",
                          textAlign: "center", textDecoration: "none", fontWeight: "bold",
                        }}
                      >
                        X 投稿
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
