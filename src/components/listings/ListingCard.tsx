"use client";

import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "@/lib/i18n/useTranslation";

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
  A: "bg-emerald-100 text-emerald-700 border-emerald-200",
  B: "bg-blue-100 text-blue-700 border-blue-200",
  C: "bg-amber-100 text-amber-700 border-amber-200",
  ungraded: "bg-gray-100 text-gray-600 border-gray-200",
};

const DELIVERY_LABELS: Record<string, string> = {
  farm_pickup: "Farm Pickup",
  nearest_mandi: "Nearest Mandi",
  buyer_logistics: "Buyer Logistics",
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group flex flex-col h-full">
      {/* Image Block */}
      <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
        {(() => {
          const lowerName = listing.commodity_name.toLowerCase();
          const hasImage = listing.listing_images && listing.listing_images.length > 0;
          let imgSrc = hasImage ? listing.listing_images![0] : null;

          if (!imgSrc) {
            if (lowerName.includes("banana")) imgSrc = "/images/banana.png";
            else if (lowerName.includes("mango")) imgSrc = "/images/mango.png";
            else if (lowerName.includes("carrot")) imgSrc = "/images/carrot.png";
          }

          return imgSrc ? (
            <img 
              src={imgSrc} 
              alt={name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 font-bold text-[10px] tracking-widest uppercase shadow-inner">
              NO IMAGE AVAILABLE
            </div>
          );
        })()}
        {/* Strip based on grade */}
        <div className={`absolute bottom-0 left-0 h-1.5 w-full ${listing.grade === "A" ? "bg-emerald-400" : listing.grade === "B" ? "bg-blue-400" : listing.grade === "C" ? "bg-amber-400" : "bg-gray-300"}`} />
      </div>

      <div className="p-4 flex flex-col flex-1 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-gray-800 text-base leading-tight">{name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {[listing.farmer_village, listing.farmer_district].filter(Boolean).join(", ") || "Karnataka"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${GRADE_COLORS[listing.grade]}`}>
              Grade {listing.grade === "ungraded" ? "—" : listing.grade}
            </span>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-xs text-gray-400">{t("market_qty")}</p>
            <p className="font-bold text-gray-800">{Number(listing.quantity_remaining_kg).toLocaleString()} <span className="font-normal text-gray-500 text-xs">{t("kg")}</span></p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2.5">
            <p className="text-xs text-gray-400">{t("market_price_kg")}</p>
            <p className="font-bold text-emerald-700 text-lg">₹{Number(listing.minimum_price_per_kg).toFixed(2)}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-600 uppercase tracking-wide">
            {t(`listing_${listing.delivery_terms}` as any)}
          </span>
          {isFairPrice && (
            <span className="text-xs font-semibold px-2 py-1 rounded bg-teal-50 text-teal-700 uppercase tracking-wide">{t("listing_fair_price")}</span>
          )}
          {aboveMsp && (
            <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-50 text-emerald-700 uppercase tracking-wide">{t("listing_msp_badge")}</span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100 gap-2">
          <p className="text-xs font-medium text-gray-400 uppercase shrink-0">{expiresIn}</p>
          <div className="flex gap-2 w-full justify-end">
            <button
              id={`bid-btn-${listing.listing_id}`}
              onClick={() => onBid(listing)}
              className="px-3 py-2 border border-emerald-500 text-emerald-600 text-xs font-bold rounded-xl hover:bg-emerald-50 transition-all shrink-0"
            >
              {t("market_place_bid")}
            </button>
            <button
              id={`buy-btn-${listing.listing_id}`}
              onClick={() => onBuy(listing)}
              className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm shadow-emerald-200 hover:scale-[1.02] active:scale-95"
            >
              {language === 'en' ? 'BUY NOW' : 'ಈಗಲೇ ಖರೀದಿಸಿ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
