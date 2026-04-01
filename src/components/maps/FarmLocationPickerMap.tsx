"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon in Next.js
export function useLeafletIconFix() {
  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    })();
  }, []);
}

function ClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e: any) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapProps {
  position: [number, number] | null;
  kaCenter: [number, number];
  onLocationSelect: (lat: number, lng: number) => void;
}

export default function FarmLocationPickerMap({
  position,
  kaCenter,
  onLocationSelect,
}: MapProps) {
  useLeafletIconFix();

  return (
    <div className="h-full w-full">
      <MapContainer
        center={position ?? kaCenter}
        zoom={position ? 14 : 8}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
        />
        <ClickHandler onLocationSelect={onLocationSelect} />
        {position && <Marker position={position} />}
      </MapContainer>
    </div>
  );
}
