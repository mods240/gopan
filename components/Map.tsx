"use client";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-cluster";

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

const interestedIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;background:#ef4444;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">🥐</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

const bookmarkIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;background:#fbbf24;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">🥐</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

const defaultIcon = L.divIcon({
  className: "",
  html: `<div style="width:24px;height:24px;background:#92400e;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;font-size:12px;">🥐</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

function createCurrentIcon(heading: number | null): L.DivIcon {
  const size = 80;
  const cx = size / 2;
  const cy = size / 2;
  let beamSvg = "";
  if (heading !== null) {
    beamSvg = `
      <polygon
        points="${cx},${cy} ${cx - 12},${cy - 44} ${cx + 12},${cy - 44}"
        fill="rgba(146,64,14,0.35)"
        transform="rotate(${heading}, ${cx}, ${cy})"
      />
    `;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    ${beamSvg}
    <circle cx="${cx}" cy="${cy}" r="10" fill="#92400e" stroke="white" stroke-width="3"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [size, size],
    iconAnchor: [cx, cy],
    className: "",
  });
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

export default function GopanMap({ bakeries, center, bookmarks, interested, onToggleBookmark, onToggleInterested, onShareBakery, pairId }: MapProps) {
  const [heading, setHeading] = useState<number | null>(null);
  const [compassEnabled, setCompassEnabled] = useState(false);
  const handleOrientationRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
  const headingRef = useRef<number | null>(null);

  function handleOrientation(e: DeviceOrientationEvent) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ios = (e as any).webkitCompassHeading;
    const newHeading = ios != null ? ios : e.alpha != null ? 360 - e.alpha : null;
    if (newHeading === null) return;
    // 5度以上変化した時だけ更新（パカパカ防止）
    const prev = headingRef.current;
    if (prev === null || Math.abs(newHeading - prev) >= 5) {
      headingRef.current = newHeading;
      setHeading(newHeading);
    }
  }

  function attachCompass() {
    handleOrientationRef.current = handleOrientation;
    window.addEventListener("deviceorientation", handleOrientation, true);
    setCompassEnabled(true);
    localStorage.setItem('gopan_compass_enabled', 'true');
  }

  async function enableCompass() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DevOrient = DeviceOrientationEvent as any;
    if (typeof DevOrient.requestPermission === "function") {
      // iOS: ユーザータップから権限要求（必須）
      try {
        const result = await DevOrient.requestPermission();
        if (result === "granted") {
          attachCompass();
        }
      } catch (err) {
        console.error('Compass permission error:', err);
      }
    } else {
      // Android その他: 権限不要
      attachCompass();
    }
  }

  // Android用：マウント時に自動でコンパス有効化（権限不要）
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DevOrient = DeviceOrientationEvent as any;
    if (typeof DevOrient.requestPermission !== "function") {
      // iOSではない → 権限不要なので自動で有効化
      attachCompass();
    } else {
      // iOS: 以前に許可済みなら再度試みる（再起動時など）
      const saved = localStorage.getItem('gopan_compass_enabled');
      if (saved === 'true') {
        // すでに許可済みのケースは、サイレントで試行
        // 失敗してもエラーは出さない
        DevOrient.requestPermission()
          .then((result: string) => {
            if (result === "granted") {
              attachCompass();
            }
          })
          .catch(() => {});
      }
    }
    return () => {
      if (handleOrientationRef.current) {
        window.removeEventListener("deviceorientation", handleOrientationRef.current, true);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goToCurrentLocation() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (window as any)._gopanMap;
    if (map && center) {
      map.setView(center, 16);
    }
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInit center={center} />
        <Marker position={center} icon={createCurrentIcon(heading)}>
          <Popup>📍 現在地</Popup>
        </Marker>

        <MarkerClusterGroup
          iconCreateFunction={(cluster: { getChildCount: () => number; getAllChildMarkers: () => L.Marker[] }) => {
            const count = cluster.getChildCount();
            const markers = cluster.getAllChildMarkers();
            const hasInterested = markers.some(m => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const id = (m.options as any).bakeryId;
              return interested.has(id);
            });
            const hasBookmark = markers.some(m => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const id = (m.options as any).bakeryId;
              return bookmarks.has(id);
            });
            const bg = hasInterested ? '#ef4444' : hasBookmark ? '#fbbf24' : '#92400e';
            return L.divIcon({
              className: "",
              html: `<div style="width:40px;height:40px;background:${bg};border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;flex-direction:column;">
                <span style="font-size:14px;">🥐</span>
                <span style="font-size:10px;color:white;font-weight:bold;line-height:1;">${count}</span>
              </div>`,
              iconSize: [40, 40], iconAnchor: [20, 20],
            });
          }}
        >
          {bakeries.map(bakery => {
            const isInterested = interested.has(bakery.id);
            const isBookmarked = bookmarks.has(bakery.id);
            const icon = isInterested ? interestedIcon : isBookmarked ? bookmarkIcon : defaultIcon;

            return (
              <Marker
                key={bakery.id}
                position={[bakery.latitude, bakery.longitude]}
                icon={icon}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {...{ bakeryId: bakery.id } as any}
              >
                <Popup>
                  <div style={{ minWidth: "180px" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "4px", fontSize: "14px" }}>
                      🥐 {bakery.name || "名称不明"}
                    </p>
                    {bakery.address && (
                      <p style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>{bakery.address}</p>
                    )}
                    {bakery.opening_hours && (
                      <p style={{ fontSize: "11px", color: "#888", marginBottom: "6px" }}>🕐 {bakery.opening_hours}</p>
                    )}
                    <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                      <button
                        onClick={() => onToggleInterested(bakery.id)}
                        style={{ flex: 1, padding: "4px", background: isInterested ? "#ef4444" : "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer", fontSize: "12px", color: isInterested ? "white" : "#333" }}
                      >{isInterested ? "♥ 気になる中" : "♥ 気になる"}</button>
                      <button
                        onClick={() => onToggleBookmark(bakery.id)}
                        style={{ flex: 1, padding: "4px", background: isBookmarked ? "#fbbf24" : "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                      >{isBookmarked ? "⭐ 登録中" : "☆ お気に入り"}</button>
                    </div>
                    {pairId && onShareBakery && (
                      <button
                        onClick={() => onShareBakery(bakery)}
                        style={{ width: "100%", padding: "4px", background: "#f59e0b", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", marginBottom: "6px", fontWeight: "bold" }}
                      >📤 ペアに送る</button>
                    )}
                    <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                      <a
                        href={"https://line.me/R/share?text=" + encodeURIComponent("🥐 " + (bakery.name || "") + "\n" + (bakery.address || "") + "\nhttps://gopan.vercel.app")}
                        target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, padding: "4px", background: "#06C755", borderRadius: "4px", fontSize: "12px", color: "white", textAlign: "center", textDecoration: "none", fontWeight: "bold" }}
                      >LINE</a>
                      <a
                        href={"https://twitter.com/intent/tweet?text=" + encodeURIComponent("🥐 " + (bakery.name || "") + " のパン！\n" + (bakery.address || "") + "\n#ゴパン #パン活\nhttps://gopan.vercel.app")}
                        target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, padding: "4px", background: "#000", borderRadius: "4px", fontSize: "12px", color: "white", textAlign: "center", textDecoration: "none", fontWeight: "bold" }}
                      >X 投稿</a>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${bakery.latitude},${bakery.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: "block", textAlign: "center", background: "#92400e", color: "white", padding: "6px", borderRadius: "4px", fontSize: "12px", textDecoration: "none" }}
                    >🗺️ Google Maps で開く</a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* コンパスボタン */}
      {!compassEnabled && (
        <button
          onClick={enableCompass}
          style={{
            position: 'absolute',
            bottom: 80,
            right: 12,
            zIndex: 1000,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'white',
            border: '2px solid #92400e',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            fontSize: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="コンパスを有効化"
        >
          🧭
        </button>
      )}

      {/* 現在地ボタン */}
      <button
        onClick={goToCurrentLocation}
        style={{
          position: 'absolute',
          bottom: 32,
          right: 12,
          zIndex: 1000,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'white',
          border: '2px solid #92400e',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          fontSize: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="現在地に戻る"
      >
        📍
      </button>
    </div>
  );
}
