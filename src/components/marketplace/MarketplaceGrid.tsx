"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLanguageStore } from "@/store/language";
import ListingCard, { Listing } from "@/components/listings/ListingCard";
import BidModal from "@/components/marketplace/BidModal";

const KARNATAKA_DISTRICTS = [
  "","Bagalkot","Ballari","Belagavi","Bengaluru Rural","Bengaluru Urban",
  "Bidar","Chamarajanagar","Chikkaballapur","Chikkamagaluru","Chitradurga",
  "Dakshina Kannada","Davanagere","Dharwad","Gadag","Hassan",
  "Haveri","Kalaburagi","Kodagu","Kolar","Koppal",
  "Mandya","Mysuru","Raichur","Ramanagara","Shivamogga",
  "Tumakuru","Udupi","Uttara Kannada","Vijayapura","Yadgir"
];

export default function MarketplaceGrid() {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguageStore();

  const [dbListings, setDbListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ commodity: "", district: "", grade: "", delivery_terms: "", min_price: "", max_price: "" });
  const [draftFilters, setDraftFilters] = useState({ ...filters });
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/listings");
        const json = await res.json();
        setDbListings(json.data || []);
      } catch {
        setDbListings([]);
      }
      setLoading(false);
    }
    load();
  }, []); // Re-run if we want real-time, but fetch on mount is enough for now

  function applyFilters() {
    setFilters({ ...draftFilters });
    setShowFilters(false);
  }

  function clearFilters() {
    const empty = { commodity: "", district: "", grade: "", delivery_terms: "", min_price: "", max_price: "" };
    setDraftFilters(empty);
    setFilters(empty);
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const filteredListings = dbListings.filter(l => {
    if (filters.commodity && !l.commodity_name.toLowerCase().includes(filters.commodity.toLowerCase()) && !l.commodity_name_kn?.includes(filters.commodity)) return false;
    if (filters.district && l.farmer_district !== filters.district) return false;
    if (filters.grade && l.grade !== filters.grade) return false;
    if (filters.delivery_terms && l.delivery_terms !== filters.delivery_terms) return false;
    if (filters.min_price && Number(l.minimum_price_per_kg) < parseFloat(filters.min_price)) return false;
    if (filters.max_price && Number(l.minimum_price_per_kg) > parseFloat(filters.max_price)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-4 sticky top-0 z-30 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t("market_title")}</h1>
            <p className="text-gray-300 text-xs font-medium uppercase tracking-wide mt-0.5">{t("market_subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFilters(true)} className="relative px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded font-medium transition-all flex items-center gap-2 uppercase text-xs tracking-wider">
              {language === 'en' ? 'Filters' : 'ಫಿಲ್ಟರ್‌ಗಳು'}
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
            <button onClick={toggleLanguage} className="px-3 py-1.5 text-sm rounded-full bg-white/20 hover:bg-white/30 transition-all font-medium">
              {t("language_toggle")}
            </button>
          </div>
        </div>
      </div>

      {/* Filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-4" onClick={() => setShowFilters(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">{language === 'en' ? 'Refine Results' : 'ಫಿಲ್ಟರ್‌ಗಳು'}</h2>
              <button onClick={() => setShowFilters(false)} className="p-1 rounded hover:bg-gray-100 text-lg font-bold text-gray-400">✕</button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("market_filter_commodity")}</label>
              <input value={draftFilters.commodity} onChange={e => setDraftFilters(p => ({ ...p, commodity: e.target.value }))} placeholder="e.g. Mango" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("market_filter_district")}</label>
              <select value={draftFilters.district} onChange={e => setDraftFilters(p => ({ ...p, district: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800 bg-white">
                {KARNATAKA_DISTRICTS.map(d => <option key={d} value={d}>{d || "All districts"}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("market_filter_grade")}</label>
                <select value={draftFilters.grade} onChange={e => setDraftFilters(p => ({ ...p, grade: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white text-gray-800">
                  <option value="">All</option>
                  {["A","B","C","ungraded"].map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("market_filter_delivery")}</label>
                <select value={draftFilters.delivery_terms} onChange={e => setDraftFilters(p => ({ ...p, delivery_terms: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white text-gray-800">
                  <option value="">All</option>
                  <option value="farm_pickup">Farm Pickup</option>
                  <option value="nearest_mandi">Nearest Mandi</option>
                  <option value="buyer_logistics">Buyer Logistics</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("market_filter_price")} (₹/kg)</label>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={draftFilters.min_price} onChange={e => setDraftFilters(p => ({ ...p, min_price: e.target.value }))} placeholder="Min" className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800" />
                <input type="number" value={draftFilters.max_price} onChange={e => setDraftFilters(p => ({ ...p, max_price: e.target.value }))} placeholder="Max" className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={clearFilters} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all">{t("market_filter_clear")}</button>
              <button onClick={applyFilters} className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl transition-all shadow-md">{t("market_filter_apply")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex-1">
        <div className="flex items-center justify-between mb-6">
          {loading ? (
             <p className="text-gray-400 animate-pulse font-medium">{language === 'en' ? 'Fetching listings from Neon Database...' : 'ನಿಯಾನ್ ಡೇಟಾಬೇಸ್ನಿಂದ ಪಟ್ಟಿಗಳನ್ನು ತರುತ್ತಿದೆ...'}</p>
          ) : (
            <p className="text-gray-600 font-medium">
              {filteredListings.length} {language === 'en' ? 'listings found in Database' : 'ಡೇಟಾಬೇಸಿನಲ್ಲಿ ಪಟ್ಟಿಗಳು ಸಿಕ್ಕಿವೆ'}
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="h-48 bg-gray-200/50 animate-pulse rounded-2xl border border-gray-100" />
            <div className="h-48 bg-gray-200/50 animate-pulse rounded-2xl border border-gray-100" />
            <div className="h-48 bg-gray-200/50 animate-pulse rounded-2xl border border-gray-100" />
            <div className="h-48 bg-gray-200/50 animate-pulse rounded-2xl border border-gray-100" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded flex flex-col items-center justify-center border border-gray-200 mt-8">
            <p className="text-gray-400 text-sm font-bold tracking-widest uppercase mb-2">INVENTORY EMPTY</p>
            <p className="text-gray-500 font-medium">{t("market_no_listings")}</p>
            <button onClick={clearFilters} className="mt-6 px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded font-bold transition-all text-sm uppercase tracking-wider">{t("market_filter_clear")}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.listing_id}
                listing={listing}
                language={language}
                onBid={setSelectedListing}
              />
            ))}
          </div>
        )}
      </div>

      <BidModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
    </div>
  );
}
