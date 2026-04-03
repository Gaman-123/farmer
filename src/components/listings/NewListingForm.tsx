"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLanguageStore } from "@/store/language";

const FRUITS = [
  { id: "mango", en: "Mango (Alphonso)", kn: "ಮಾವಿನಹಣ್ಣು (ಅಲ್ಫೋನ್ಸೊ)", msp: 85 },
  { id: "banana", en: "Banana (Robusta)", kn: "ಬಾಳೆಹಣ್ಣು (ರೋಬಸ್ಟಾ)", msp: 25 },
  { id: "papaya", en: "Papaya", kn: "ಪರಂಗಿಹಣ್ಣು", msp: 30 },
  { id: "watermelon", en: "Watermelon", kn: "ಕಲ್ಲಂಗಡಿ", msp: 15 },
  { id: "pomegranate", en: "Pomegranate (Bhagwa)", kn: "ದಾಳಿಂಬೆ (ಭಗವಾ)", msp: 120 },
];

const GRADES = ["A", "B", "C", "ungraded"] as const;
const DELIVERY_TERMS = ["farm_pickup", "nearest_mandi", "buyer_logistics"] as const;

export default function NewListingForm() {
  const router = useRouter();
  const { toggleLanguage, language } = useLanguageStore();
  const { t } = useTranslation();
  const isKan = language === "kn";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form fields
  const [selectedFruitId, setSelectedFruitId] = useState("");
  const [quantityKg, setQuantityKg] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [grade, setGrade] = useState<typeof GRADES[number]>("ungraded");
  const [deliveryTerms, setDeliveryTerms] = useState<typeof DELIVERY_TERMS[number]>("farm_pickup");
  const [upiId, setUpiId] = useState("");

  const selectedFruit = FRUITS.find(f => f.id === selectedFruitId);

  function isFairPrice(): boolean {
    if (!selectedFruit || !askingPrice) return false;
    const ratio = parseFloat(askingPrice) / selectedFruit.msp;
    return ratio >= 0.9 && ratio <= 1.1;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFruit) { setError("Please select a fruit"); return; }
    if (!quantityKg || parseFloat(quantityKg) <= 0) { setError("Quantity must be > 0"); return; }
    if (!askingPrice || parseFloat(askingPrice) <= 0) { setError("Price must be > 0"); return; }

    setLoading(true);
    setError("");

    try {
      const resp = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commodity_name: selectedFruit.en,
          commodity_name_kn: selectedFruit.kn,
          quantity_kg: parseFloat(quantityKg),
          minimum_price_per_kg: parseFloat(askingPrice),
          grade,
          delivery_terms: deliveryTerms,
          upi_id: upiId || undefined
        }),
      });
      const res = await resp.json();
      
      if (res.ok !== false) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        setError(res.message || res.error || "Database creation failed");
        setLoading(false);
      }
    } catch {
      setError("Network fault");
      setLoading(false);
    }
  }

  const priceNum = parseFloat(askingPrice);
  const msrBadge = selectedFruit && priceNum > 0
    ? priceNum >= selectedFruit.msp ? "above" : "below"
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-4 flex items-center justify-between shadow-md border-b border-gray-700">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded hover:bg-white/10 transition-colors uppercase text-xs font-bold tracking-wider border border-transparent hover:border-white/20">BACK</button>
          <h1 className="text-xl font-bold uppercase tracking-tight">{t("listing_title")}</h1>
        </div>
        <button onClick={toggleLanguage} className="px-3 py-1.5 text-sm rounded-full bg-white/20 hover:bg-white/30 transition-all font-medium">
          {t("language_toggle")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-6">
        {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 text-sm font-medium">{error}</div>}
        {success && <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 px-4 py-3 text-sm font-bold uppercase tracking-wide">
          {isKan ? "ಡೇಟಾಬೇಸ್ಗೆ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ! ಮರುನಿರ್ದೇಶಿಸಲಾಗುತ್ತಿದೆ…" : "SUCCESS: Listing saved to Database! Redirecting…"}
        </div>}

        {/* Commodity */}
        <div className="bg-white rounded p-6 shadow-sm border border-gray-200 space-y-5">
          <h2 className="font-bold text-gray-800 text-lg uppercase tracking-tight">{isKan ? "ಹಣ್ಣಿನ ವಿವರಗಳು" : "Fruit Details"}</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("listing_commodity")} *</label>
            <select
              value={selectedFruitId}
              onChange={e => setSelectedFruitId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800 bg-white"
            >
              <option value="" disabled>-- {isKan ? "ಹಣ್ಣು ಆಯ್ಕೆಮಾಡಿ" : "Select Fruit"} --</option>
              {FRUITS.map(f => (
                <option key={f.id} value={f.id}>{isKan ? f.kn : f.en}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("listing_quantity")} *</label>
              <input type="number" min="1" step="0.1" value={quantityKg} onChange={e => setQuantityKg(e.target.value)} placeholder="0 kg" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("listing_price")} *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input type="number" min="0.1" step="0.1" value={askingPrice} onChange={e => setAskingPrice(e.target.value)} placeholder="0.00" className="w-full border border-gray-200 rounded-xl pl-8 pr-20 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800" />
                {msrBadge && (
                  <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${msrBadge === "above" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {msrBadge === "above" ? t("listing_msp_badge") : t("listing_below_msp")}
                  </span>
                )}
              </div>
              {selectedFruit && <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{t("listing_fair_price")}: ₹{selectedFruit.msp.toFixed(2)}/kg</p>}
              {isFairPrice() && <p className="text-xs text-emerald-600 mt-1 font-bold uppercase tracking-wider">{isKan ? "ನ್ಯಾಯಯುತ ಬೆಲೆ" : "Within Fair Price Range"}</p>}
            </div>
          </div>
        </div>

        {/* Grade */}
        <div className="bg-white rounded p-6 shadow-sm border border-gray-200">
          <h2 className="font-bold text-gray-800 text-lg mb-4 uppercase tracking-tight">{t("listing_grade")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {GRADES.map(g => (
              <button key={g} type="button" onClick={() => setGrade(g)} className={`py-3 px-4 rounded text-sm font-bold border-2 transition-all uppercase tracking-wider ${grade === g ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-gray-100 hover:border-gray-200 text-gray-500 hover:text-gray-700"}`}>
                {t(`listing_grade_${g}` as any)}
              </button>
            ))}
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-white rounded p-6 shadow-sm border border-gray-200">
          <h2 className="font-bold text-gray-800 text-lg mb-4 uppercase tracking-tight">{t("listing_delivery")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DELIVERY_TERMS.map(dt => (
              <button key={dt} type="button" onClick={() => setDeliveryTerms(dt)} className={`py-3 px-3 rounded text-xs font-bold border-2 transition-all flex items-center justify-center uppercase tracking-wider ${deliveryTerms === dt ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-gray-100 hover:border-gray-200 text-gray-500 hover:text-gray-700"}`}>
                {t(`listing_${dt}` as any)}
              </button>
            ))}
          </div>
        </div>

        {/* UPI Payments */}
        <div className="bg-white rounded p-6 shadow-sm border border-gray-200">
          <h2 className="font-bold text-gray-800 text-lg mb-4 uppercase tracking-tight">{isKan ? "ಯುಪಿಐ ಐಡಿ" : "UPI ID for Direct Transfers (Optional)"}</h2>
          <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="farmer@bank" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800" />
          <p className="text-xs text-emerald-600 font-medium mt-2">{isKan ? "ಇದು ಖರೀದಿದಾರರಿಗೆ ನೇರವಾಗಿ ಪಾವತಿಸಲು ಅನುವು ಮಾಡಿಕೊಡುತ್ತದೆ." : "Buyers will be able to pay directly to this UPI ID if provided. If blank, buyers cannot use Buy Now."}</p>
        </div>

        <button type="submit" disabled={loading || success} className="w-full py-4 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white font-bold uppercase tracking-widest text-sm rounded shadow mt-8">
          {loading ? t("listing_submitting") : t("listing_submit")}
        </button>
      </form>
    </div>
  );
}
