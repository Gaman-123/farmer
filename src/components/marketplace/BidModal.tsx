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
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fadeIn"
      style={{
        background: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(12px) saturate(150%)",
        WebkitBackdropFilter: "blur(12px) saturate(150%)",
      }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-slideUp transform transition-all relative border border-white/50"
        onClick={e => e.stopPropagation()}
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.1) inset"
        }}
      >
        {/* Header Background */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 -z-10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        </div>

        {/* Header Content */}
        <div className="pt-6 px-8 pb-6 text-white relative">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-lg backdrop-blur-md border border-white/20 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulseGlow"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-50">Market Price: ₹{listing.minimum_price_per_kg}</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight font-['Outfit']">
                {t("bid_title")}
              </h2>
              <p className="text-emerald-100 font-medium text-sm mt-0.5 opacity-90">
                {isKan ? listing.commodity_name_kn : listing.commodity_name}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all backdrop-blur-md"
            >
              <span className="text-sm font-bold opacity-80 hover:opacity-100">✕</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-t-3xl -mt-6 p-8 relative shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          {success ? (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-scaleIn">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner">
                ✓
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 font-['Outfit']">Bid Placed!</h3>
              <p className="text-gray-500 text-sm">
                {isKan ? "ರೈತರಿಗೆ ನಿಮ್ಮ ಬಿಡ್ ಬಗ್ಗೆ ತಿಳಿಸಲಾಗಿದೆ." : "The farmer has been notified of your offer."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 animate-shake">
                  <span className="text-lg">⚠️</span>
                  {error}
                </div>
              )}

              {/* Offer Price */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-2">
                  {t("bid_offer_price")} *
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-lg">₹</span>
                  <input
                    type="number" step="0.5" min="0.1"
                    value={offerPrice}
                    onChange={e => setOfferPrice(e.target.value)}
                    className="input-premium pl-10 text-xl font-bold text-gray-900 h-14"
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-2 flex justify-between">
                  <span>{t("bid_quantity")} (optional)</span>
                  <span className="text-emerald-500">Max {listing.quantity_remaining_kg} kg</span>
                </label>
                <div className="relative">
                  <input
                    type="number" step="1" min="1" max={listing.quantity_remaining_kg}
                    value={quantityKg}
                    onChange={e => setQuantityKg(e.target.value)}
                    placeholder={`e.g. 50`}
                    className="input-premium pr-12 text-lg font-bold text-gray-900 h-14"
                    disabled={loading}
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">KG</span>
                </div>
              </div>

              {/* Estimate Pill */}
              {totalValue && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/50 rounded-2xl p-4 flex items-center justify-between shadow-inner animate-fadeIn">
                  <span className="text-emerald-700 font-bold text-xs uppercase tracking-widest">
                    {isKan ? "ಅಂದಾಜು ಬೆಲೆ" : "Est. Value"}
                  </span>
                  <span className="font-black text-emerald-600 text-xl tracking-tight">{totalValue}</span>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-2">
                  {t("bid_note")}
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={2}
                  placeholder={isKan ? "ಸಂದೇಶ ಬರೆಯಿರಿ (ಐಚ್ಛಿಕ)…" : "Add a note for the farmer (optional)…"}
                  className="input-premium py-4 text-sm resize-none"
                  disabled={loading}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" onClick={onClose} 
                  className="flex-1 py-4 border-2 border-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 hover:text-gray-900 transition-all text-sm uppercase tracking-widest"
                >
                  {t("cancel")}
                </button>
                <button 
                  type="submit" disabled={loading} 
                  className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-[0_8px_25px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.4)] text-sm uppercase tracking-widest hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 pulse-ring"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span>{t("bid_submit")}</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
