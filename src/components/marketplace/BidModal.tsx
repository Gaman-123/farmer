"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Listing } from "@/components/listings/ListingCard";
import { useLanguageStore } from "@/store/language";

interface BidModalProps {
  listing: Listing | null;
  onClose: () => void;
}

export default function BidModal({ listing, onClose }: BidModalProps) {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const isKan = language === "kn";

  const [offerPrice, setOfferPrice] = useState("");
  const [quantityKg, setQuantityKg] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (listing) {
      setOfferPrice(listing.minimum_price_per_kg.toString());
      setQuantityKg(listing.quantity_remaining_kg.toString());
      setError("");
      setSuccess(false);
    }
  }, [listing]);

  if (!listing) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!offerPrice || parseFloat(offerPrice) <= 0) { setError("Price must be > 0"); return; }
    setLoading(true);
    setError("");

    // Fetch strictly replacing Server Action to match the API route
    try {
      const resp = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing!.listing_id,
          offered_price_per_kg: parseFloat(offerPrice),
          quantity_kg: quantityKg ? parseFloat(quantityKg) : null,
          note: note || null,
        }),
      });

      const res = await resp.json();
      
      if (res.ok !== false) {
        setSuccess(true);
        setLoading(false);
        setTimeout(onClose, 1800);
      } else {
        setLoading(false);
        setError(res.message || res.error || "Database query failed!");
      }
    } catch {
      setLoading(false);
      setError("Network fault connecting to Neon.");
    }
  }

  const totalValue = offerPrice && quantityKg
    ? (parseFloat(offerPrice) * parseFloat(quantityKg)).toLocaleString("en-IN", { style: "currency", currency: "INR" })
    : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold">{t("bid_title")}</h2>
              <p className="text-emerald-100 font-medium">{isKan ? listing.commodity_name_kn : listing.commodity_name}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors text-xl font-bold">✕</button>
          </div>
          <div className="mt-4 flex gap-3">
            <div className="bg-white/20 rounded-xl px-3 py-2 text-sm flex-1">
              <p className="text-emerald-100 text-xs">{isKan ? "ಬೆಲೆ" : "Listed at"}</p>
              <p className="font-bold text-lg">₹{Number(listing.minimum_price_per_kg).toFixed(1)}/kg</p>
            </div>
            <div className="bg-white/20 rounded-xl px-3 py-2 text-sm flex-1">
              <p className="text-emerald-100 text-xs">{isKan ? "ಲಭ್ಯ" : "Available"}</p>
              <p className="font-bold text-lg">{Number(listing.quantity_remaining_kg).toLocaleString()} kg</p>
            </div>
            <div className="bg-white/20 rounded-xl px-3 py-2 text-sm flex-1">
              <p className="text-emerald-100 text-xs">{isKan ? "ಶ್ರೇಣಿ" : "Grade"}</p>
              <p className="font-bold text-lg">{listing.grade}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-gray-50">
          {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 text-sm font-medium">{error}</div>}
          {success && <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 px-4 py-3 text-sm font-bold">
            {isKan ? "ಡೇಟಾಬೇಸಿಗೆ ಬಿಡ್ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ." : "Bid successfully committed to system."}
          </div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("bid_offer_price")} *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={offerPrice}
                onChange={e => setOfferPrice(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800 font-bold text-lg bg-gray-50 focus:bg-white transition-colors"
                disabled={loading || success}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("bid_quantity")} (optional)</label>
            <input
              type="number"
              step="1"
              min="1"
              max={listing.quantity_remaining_kg}
              value={quantityKg}
              onChange={e => setQuantityKg(e.target.value)}
              placeholder={`Max ${listing.quantity_remaining_kg} kg`}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800"
              disabled={loading || success}
            />
          </div>

          {totalValue && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between shadow-inner">
              <span className="text-emerald-800 font-medium">{isKan ? "ಅಂದಾಜು ಬೆಲೆ" : "Estimated total"}</span>
              <span className="font-extrabold text-emerald-700 text-xl">{totalValue}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("bid_note")}</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder={isKan ? "ಸಂದೇಶ ಬರೆಯಿರಿ…" : "Optional message…"}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800 text-sm resize-none"
              disabled={loading || success}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all">
              {t("cancel")}
            </button>
            <button type="submit" disabled={loading || success} className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white font-extrabold rounded-xl transition-all shadow-md hover:shadow-lg">
              {loading ? t("bid_submitting") : t("bid_submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
