"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLanguageStore } from "@/store/language";
import ListingCard, { Listing } from "@/components/listings/ListingCard";
import BidModal from "@/components/marketplace/BidModal";
import BuyModal from "@/components/marketplace/BuyModal";

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

  const [filters, setFilters] = useState({ commodity: "", district: "", grade: "", delivery_terms: "", min_price: "", max_price: "", phone: "", date: "" });
  const [draftFilters, setDraftFilters] = useState({ ...filters });
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedBuyListing, setSelectedBuyListing] = useState<Listing | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    const empty = { commodity: "", district: "", grade: "", delivery_terms: "", min_price: "", max_price: "", phone: "", date: "" };
    setDraftFilters(empty);
    setFilters(empty);
  }

  const activeFilterCount = Object.values(filters).filter(v => v !== "" && v !== undefined).length;

  const filteredListings = dbListings.filter(l => {
    if (filters.commodity && !l.commodity_name.toLowerCase().includes(filters.commodity.toLowerCase()) && !l.commodity_name_kn?.includes(filters.commodity)) return false;
    if (filters.district && l.farmer_district !== filters.district) return false;
    if (filters.grade && l.grade !== filters.grade) return false;
    if (filters.delivery_terms && l.delivery_terms !== filters.delivery_terms) return false;
    if (filters.min_price && Number(l.minimum_price_per_kg) < parseFloat(filters.min_price)) return false;
    if (filters.max_price && Number(l.minimum_price_per_kg) > parseFloat(filters.max_price)) return false;
    // Date filter: if listing has an expiry or if we add availability metadata (currently simplified to true)
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Dynamic Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 px-6 py-4 ${isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-200">E</div>
            <h1 className={`text-xl font-black tracking-tight ${isScrolled ? "text-gray-900" : "text-gray-900"}`}>{t("market_title")}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleLanguage} className="text-sm font-bold uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-full transition-all">
              {t("language_toggle")}
            </button>
            <div className="w-10 h-10 bg-gray-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-gray-400 font-bold">B</div>
          </div>
        </div>
      </nav>

      {/* Hero Search Section */}
      <div className="pt-24 pb-12 px-6 bg-gradient-to-b from-emerald-50/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 text-center sm:text-left">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-4 tracking-tighter">
              {language === 'en' ? 'Fresh from ' : 'ನೇರವಾಗಿ '}<span className="text-emerald-600 italic">Farm</span>{language === 'en' ? ' to your doorstep' : ' ನಿಮ್ಮ ಮನೆಗೆ'}
            </h2>
            <p className="text-gray-500 font-medium max-w-xl text-lg">
              Search through thousands of fresh harvests verified by E-Krishi experts.
            </p>
          </div>

          {/* Peak Search Bar */}
          <div className="bg-white p-2 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col lg:flex-row gap-2 lg:items-center">
            {/* Phone */}
            <div className="flex-1 flex flex-col px-4 py-2 group hover:bg-gray-50 rounded-2xl transition-all border-b lg:border-b-0 lg:border-r border-gray-100">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 group-focus-within:text-emerald-500">Contact</label>
              <input 
                type="tel" 
                placeholder="+91 00000 00000" 
                value={draftFilters.phone}
                onChange={e => setDraftFilters(p => ({ ...p, phone: e.target.value }))}
                className="bg-transparent text-gray-900 font-bold placeholder:text-gray-300 focus:outline-none text-base" 
              />
            </div>
            {/* Commodity */}
            <div className="flex-1 flex flex-col px-4 py-2 group hover:bg-gray-50 rounded-2xl transition-all border-b lg:border-b-0 lg:border-r border-gray-100">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Product</label>
              <input 
                type="text" 
                placeholder="What fruit?" 
                value={draftFilters.commodity}
                onChange={e => setDraftFilters(p => ({ ...p, commodity: e.target.value }))}
                className="bg-transparent text-gray-900 font-bold placeholder:text-gray-300 focus:outline-none text-base" 
              />
            </div>
            {/* District */}
            <div className="flex-1 flex flex-col px-4 py-2 group hover:bg-gray-50 rounded-2xl transition-all border-b lg:border-b-0 lg:border-r border-gray-100">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Place</label>
              <select 
                value={draftFilters.district}
                onChange={e => setDraftFilters(p => ({ ...p, district: e.target.value }))}
                className="bg-transparent text-gray-900 font-bold focus:outline-none text-base appearance-none cursor-pointer"
              >
                {KARNATAKA_DISTRICTS.map(d => <option key={d} value={d}>{d || (language === 'en' ? "Any District" : "ಯಾವುದೇ ಜಿಲ್ಲೆ")}</option>)}
              </select>
            </div>
            {/* Fulfillment Toggle */}
            <div className="flex-1 flex flex-col px-4 py-2 group hover:bg-gray-50 rounded-2xl transition-all border-b lg:border-b-0 lg:border-r border-gray-100">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Method</label>
              <div className="flex items-center gap-4 mt-1">
                <button 
                  onClick={() => setDraftFilters(p => ({ ...p, delivery_terms: p.delivery_terms === 'nearest_mandi' ? '' : 'nearest_mandi' }))}
                  className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${draftFilters.delivery_terms === 'nearest_mandi' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-200 text-gray-400 hover:border-emerald-300'}`}
                >
                  Mandi
                </button>
                <button 
                  onClick={() => setDraftFilters(p => ({ ...p, delivery_terms: p.delivery_terms === 'farm_pickup' ? '' : 'farm_pickup' }))}
                  className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${draftFilters.delivery_terms === 'farm_pickup' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-200 text-gray-400 hover:border-emerald-300'}`}
                >
                  Pickup
                </button>
              </div>
            </div>
            {/* Date */}
            <div className="flex-1 flex flex-col px-4 py-2 group hover:bg-gray-50 rounded-2xl transition-all lg:border-r border-gray-100 lg:border-r-0">
               <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Date</label>
               <input 
                 type="date" 
                 value={draftFilters.date}
                 onChange={e => setDraftFilters(p => ({ ...p, date: e.target.value }))}
                 className="bg-transparent text-gray-900 font-bold focus:outline-none text-sm appearance-none cursor-pointer" 
               />
            </div>
            {/* Search Button */}
            <div className="p-2">
              <button 
                onClick={applyFilters}
                className="w-full lg:w-[120px] py-4 bg-gray-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="uppercase tracking-widest text-xs">Search</span>
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
             <button onClick={() => setShowFilters(true)} className="px-4 py-2 border border-gray-100 bg-white rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
                Advanced Filters {activeFilterCount > 0 && <span className="w-4 h-4 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">{activeFilterCount}</span>}
             </button>
             {activeFilterCount > 0 && (
               <button onClick={clearFilters} className="px-4 py-2 bg-red-50 text-red-500 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-all shadow-sm shadow-red-100">Clear All</button>
             )}
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
                onBuy={setSelectedBuyListing}
              />
            ))}
          </div>
        )}
      </div>

      <BidModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
      <BuyModal 
        listing={selectedBuyListing} 
        onClose={() => setSelectedBuyListing(null)} 
        onSuccess={() => {
          alert("Payment Successful! Your order is now in escrow.");
          window.location.reload();
        }}
      />
    </div>
  );
}
