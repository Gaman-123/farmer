"use client";

import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { PRODUCT_DEFAULTS } from "@/lib/productDefaults";

export interface Listing {
  listing_id: string;
  commodity_name: string;
  commodity_name_kn: string | null;
  quantity_remaining_kg: number;
  minimum_price_per_kg: number;
  grade: "A" | "B" | "C" | "ungraded";
  delivery_terms: "farm_pickup" | "nearest_mandi" | "buyer_logistics";
  status: string;
  expires_at: string;
  farmer_village: string | null;
  farmer_district: string | null;
  farmer_upi?: string | null;
  fair_price_estimate: number | null;
  msp_at_listing: number | null;
  listing_images?: string[];
}

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
  B: "bg-blue-100 text-blue-700 border-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]",
  C: "bg-amber-100 text-amber-700 border-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
  ungraded: "bg-gray-100 text-gray-600 border-gray-200",
};

interface ListingCardProps {
  listing: Listing;
  language: "kn" | "en";
  onBid: (listing: Listing) => void;
  onBuy: (listing: Listing) => void;
}

export default function ListingCard({ listing, language, onBid, onBuy }: ListingCardProps) {
  const { t } = useTranslation();
  const name = language === "kn" && listing.commodity_name_kn
    ? listing.commodity_name_kn
    : listing.commodity_name;

  const expiresIn = formatDistanceToNow(new Date(listing.expires_at), { addSuffix: true });
  const isFairPrice = listing.fair_price_estimate
    ? Math.abs(Number(listing.minimum_price_per_kg) / Number(listing.fair_price_estimate) - 1) <= 0.1
    : false;
  const aboveMsp = listing.msp_at_listing
    ? Number(listing.minimum_price_per_kg) >= Number(listing.msp_at_listing)
    : false;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_30px_rgb(5,150,105,0.1)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden group flex flex-col h-full animate-fadeUp">
      
      {/* Image Block */}
      <div className="relative w-full h-52 bg-gray-50 overflow-hidden">
        {(() => {
          const nameLower = name.toLowerCase();
          const commLower = listing.commodity_name.toLowerCase();
          const hasImage = listing.listing_images && listing.listing_images.length > 0;
          let imgSrc = hasImage ? listing.listing_images![0] : null;

          if (!imgSrc || imgSrc === "" || imgSrc === "null" || imgSrc === "undefined") {
            if (commLower.includes("banana") || nameLower.includes("banana")) imgSrc = PRODUCT_DEFAULTS.banana;
            else if (commLower.includes("mango") || nameLower.includes("mango")) imgSrc = PRODUCT_DEFAULTS.mango;
            else if (commLower.includes("carrot") || nameLower.includes("carrot")) imgSrc = PRODUCT_DEFAULTS.carrot;
            else if (commLower.includes("watermelon") || nameLower.includes("watermelon")) imgSrc = "/images/watermelon.png";
            else if (commLower.includes("pomegranate") || nameLower.includes("pomegranate")) imgSrc = "/images/pomegranate.png";
            else if (commLower.includes("orange") || nameLower.includes("orange")) imgSrc = "https://images.unsplash.com/photo-1547514701-42782101795e?q=80&w=1000&auto=format&fit=crop";
          }

          return imgSrc ? (
            <img 
              src={imgSrc} 
              alt={name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              onError={(e) => {
                (e.target as any).style.display = 'none';
                (e.target as any).parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-bold text-[10px] tracking-widest uppercase skeleton">NO IMAGE</div>';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-bold text-[10px] tracking-widest uppercase skeleton">
              NO IMAGE
            </div>
          );
        })()}

        {/* Floating Grade Badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className={`text-[10px] font-black px-3 py-1 rounded-full border backdrop-blur-md uppercase tracking-wider ${GRADE_COLORS[listing.grade]}`}>
            Grade {listing.grade === "ungraded" ? "—" : listing.grade}
          </span>
        </div>

        {/* Gradient overlay to make text pop if we add any */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content Block */}
      <div className="p-5 flex flex-col flex-1 space-y-4">
        
        {/* Header */}
        <div>
          <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 font-['Outfit']">{name}</h3>
          <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
            <span className="text-emerald-500">📍</span> 
            {[listing.farmer_village, listing.farmer_district].filter(Boolean).join(", ") || "Karnataka"}
          </p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 uppercase tracking-widest">
            {t(`listing_${listing.delivery_terms}` as any)}
          </span>
          {isFairPrice && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 uppercase tracking-widest shadow-sm">
              ✨ {t("listing_fair_price")}
            </span>
          )}
          {aboveMsp && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 uppercase tracking-widest shadow-sm">
              🛡️ {t("listing_msp_badge")}
            </span>
          )}
        </div>

        {/* Metrics Box */}
        <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100/50 mt-auto">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t("market_qty")}</p>
            <p className="font-black text-gray-800 text-lg leading-none">
              {Number(listing.quantity_remaining_kg).toLocaleString()} <span className="font-semibold text-gray-400 text-xs tracking-normal">{t("kg")}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">{t("market_price_kg")}</p>
            <p className="font-black text-emerald-600 text-xl leading-none">
              <span className="text-sm">₹</span>{Number(listing.minimum_price_per_kg).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={() => onBid(listing)}
            className="flex-1 py-3 bg-white border-2 border-emerald-100 text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
          >
            {t("market_place_bid")}
          </button>
          <button
            onClick={() => onBuy(listing)}
            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:scale-95 pulse-ring"
          >
            {language === 'en' ? 'Buy Now' : 'ಖರೀದಿಸಿ'}
          </button>
        </div>
        
        {/* Expiry */}
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mt-1">
          ⏳ Expires {expiresIn}
        </p>

      </div>
    </div>
  );
}
