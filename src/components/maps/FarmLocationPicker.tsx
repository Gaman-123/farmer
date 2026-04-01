"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

// Load map component client-side only
const FarmLocationPickerMap = dynamic(
  () => import("./FarmLocationPickerMap"),
  { ssr: false, loading: () => <div className="h-full w-full bg-emerald-50 animate-pulse flex items-center justify-center text-emerald-300">Loading Map...</div> }
);

export interface FarmLocation {
  lat: number;
  lng: number;
  address: string;
}

interface FarmLocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onChange: (location: FarmLocation) => void;
}

const KA_CENTER: [number, number] = [13.0827, 77.5877];

export default function FarmLocationPicker({
  initialLat,
  initialLng,
  onChange,
}: FarmLocationPickerProps) {
  const { t, language } = useTranslation();
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );
  const [address, setAddress] = useState<string>("");
  const [geocoding, setGeocoding] = useState(false);

  async function reverseGeocode(lat: number, lng: number) {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      const addr = data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(addr);
      onChange({ lat, lng, address: addr });
    } catch {
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(fallback);
      onChange({ lat, lng, address: fallback });
    } finally {
      setGeocoding(false);
    }
  }

  function handleLocationSelect(lat: number, lng: number) {
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
  }

  function handleUseMyLocation() {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => handleLocationSelect(coords.latitude, coords.longitude),
      () => {}
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">{t("reg_location_hint")}</p>
        <button
          type="button"
          onClick={handleUseMyLocation}
          className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1"
        >
          📍 {language === "kn" ? "ನನ್ನ ಸ್ಥಳ" : "My Location"}
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden border-2 border-emerald-200 h-72 relative bg-white">
        <FarmLocationPickerMap 
          position={position} 
          kaCenter={KA_CENTER} 
          onLocationSelect={handleLocationSelect} 
        />
      </div>

      {position && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm">
          <div className="flex items-center gap-2 text-emerald-700">
            <span>📍</span>
            <span className="font-mono text-xs text-gray-500">
              {position[0].toFixed(5)}, {position[1].toFixed(5)}
            </span>
          </div>
          {geocoding ? (
            <p className="text-gray-400 text-xs mt-1 animate-pulse">Fetching address…</p>
          ) : (
            <p className="text-gray-700 text-xs mt-1 leading-relaxed">{address}</p>
          )}
        </div>
      )}
    </div>
  );
}
