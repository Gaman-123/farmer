"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLanguageStore } from "@/store/language";
import Navbar from "@/components/ui/Navbar";

const FRUITS = [
  { id: "mango", en: "Mango", kn: "ಮಾವಿನಹಣ್ಣು", msp: 85, icon: "🥭" },
  { id: "banana", en: "Banana", kn: "ಬಾಳೆಹಣ್ಣು", msp: 25, icon: "🍌" },
  { id: "papaya", en: "Papaya", kn: "ಪರಂಗಿಹಣ್ಣು", msp: 30, icon: "🍈" },
  { id: "watermelon", en: "Watermelon", kn: "ಕಲ್ಲಂಗಡಿ", msp: 15, icon: "🍉" },
  { id: "pomegranate", en: "Pomegranate", kn: "ದಾಳಿಂಬೆ", msp: 120, icon: "🍎" },
  { id: "carrot", en: "Carrot", kn: "ಕ್ಯಾರೆಟ್", msp: 40, icon: "🥕" },
];

const GRADES = ["A", "B", "C", "ungraded"] as const;
const DELIVERY_TERMS = ["farm_pickup", "nearest_mandi", "buyer_logistics"] as const;

export default function NewListingForm() {
  const router = useRouter();
  const { language } = useLanguageStore();
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

  // Calculate progress
  const fields = [selectedFruitId, quantityKg, askingPrice, grade, deliveryTerms];
  const filledFields = fields.filter(f => f !== "" && f !== undefined).length;
  const progressPercent = (filledFields / fields.length) * 100;

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
        setTimeout(() => router.push("/dashboard"), 2000);
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
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar backHref="/dashboard" backLabel={isKan ? "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ" : "Back to Dashboard"} />

      {/* Header & Progress */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30 shadow-sm animate-slideDown">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {isKan ? "ಹೊಸ ಪಟ್ಟಿಯನ್ನು ರಚಿಸಿ" : "Create New Listing"}
            </h1>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
              {Math.round(progressPercent)}% {isKan ? "ಪೂರ್ಣಗೊಂಡಿದೆ" : "Complete"}
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ "--progress-target": `${progressPercent}%` } as React.CSSProperties}
            />
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 pb-24">
        {success ? (
          <div className="bg-white rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center animate-scaleIn border border-emerald-100">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 animate-successBounce">
              ✓
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2 font-['Outfit']">
              {isKan ? "ಯಶಸ್ವಿ!" : "Success!"}
            </h2>
            <p className="text-gray-500 text-lg mb-8">
              {isKan ? "ನಿಮ್ಮ ಪಟ್ಟಿಯನ್ನು ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಪ್ರಕಟಿಸಲಾಗಿದೆ." : "Your listing has been published to the marketplace."}
            </p>
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-widest text-sm bg-emerald-50 px-4 py-2 rounded-xl">
                <span className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></span>
                {isKan ? "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಮರಳುತ್ತಿದೆ..." : "Redirecting to Dashboard..."}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 animate-fadeUp">
            
            {error && (
              <div className="bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] px-5 py-4 rounded-2xl text-sm font-semibold flex items-center gap-3 animate-shake">
                <span className="text-xl">⚠️</span>
                {error}
              </div>
            )}

            {/* STEP 1: FRUIT */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] section-fade">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2 font-['Outfit']">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 text-sm">1</span>
                {t("listing_commodity")}
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FRUITS.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFruitId(f.id)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all hover-lift ${selectedFruitId === f.id ? 'border-emerald-500 bg-emerald-50 shadow-[0_0_0_2px_rgba(16,185,129,0.1)]' : 'border-gray-100 bg-white hover:border-emerald-200'}`}
                  >
                    <span className="text-4xl filter drop-shadow-sm">{f.icon}</span>
                    <span className={`text-sm font-bold text-center ${selectedFruitId === f.id ? 'text-emerald-800' : 'text-gray-700'}`}>
                      {isKan ? f.kn : f.en}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2: PRICING & QTY */}
            <div className={`bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-500 ${selectedFruitId ? 'opacity-100 translate-y-0' : 'opacity-50 pointer-events-none'}`}>
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2 font-['Outfit']">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 text-sm">2</span>
                {isKan ? "ಪ್ರಮಾಣ ಮತ್ತು ಬೆಲೆ" : "Quantity & Pricing"}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{t("listing_quantity")} *</label>
                  <div className="relative">
                    <input 
                      type="number" min="1" step="0.1" 
                      value={quantityKg} onChange={e => setQuantityKg(e.target.value)} 
                      placeholder="0" 
                      className="input-premium pl-4 pr-12" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">KG</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex justify-between">
                    <span>{t("listing_price")} *</span>
                    {selectedFruit && <span className="text-emerald-600">MSP: ₹{selectedFruit.msp}/kg</span>}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                    <input 
                      type="number" min="0.1" step="0.1" 
                      value={askingPrice} onChange={e => setAskingPrice(e.target.value)} 
                      placeholder="0.00" 
                      className={`input-premium pl-8 pr-4 ${msrBadge === 'above' ? 'border-emerald-300 bg-emerald-50/50' : msrBadge === 'below' ? 'border-amber-300 bg-amber-50/50' : ''}`} 
                    />
                  </div>
                  
                  {/* Dynamic Price Indicator */}
                  {askingPrice && selectedFruit && (
                    <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3 animate-fadeIn">
                      <div className="text-xl mt-0.5">
                        {msrBadge === 'above' ? '✅' : '⚠️'}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${msrBadge === 'above' ? 'text-emerald-700' : 'text-amber-600'}`}>
                          {msrBadge === 'above' 
                            ? (isKan ? "ಉತ್ತಮ ಬೆಲೆ!" : "Great Price!") 
                            : (isKan ? "ಬೆಲೆ ಎಚ್ಚರಿಕೆ" : "Below MSP Warning")}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                          {msrBadge === 'above' 
                            ? (isKan ? "ನಿಮ್ಮ ಬೆಲೆ ಕನಿಷ್ಠ ಬೆಂಬಲ ಬೆಲೆಗಿಂತ ಹೆಚ್ಚಾಗಿದೆ." : "Your asking price is at or above the Minimum Support Price.") 
                            : (isKan ? "ನಿಮ್ಮ ಬೆಲೆ ಕನಿಷ್ಠ ಬೆಂಬಲ ಬೆಲೆಗಿಂತ ಕಡಿಮೆಯಾಗಿದೆ." : "Your asking price is below the Minimum Support Price. Consider revising.")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* STEP 3: DETAILS */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 delay-100 ${quantityKg && askingPrice ? 'opacity-100 translate-y-0' : 'opacity-50 pointer-events-none'}`}>
              
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 font-['Outfit']">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs">3</span>
                  {t("listing_grade")}
                </h2>
                <div className="flex flex-col gap-2">
                  {GRADES.map(g => (
                    <button 
                      key={g} type="button" onClick={() => setGrade(g)} 
                      className={`py-3 px-4 rounded-xl text-xs font-bold transition-all text-left flex justify-between items-center ${grade === g ? "bg-emerald-50 text-emerald-700 border-emerald-200 border" : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent"}`}
                    >
                      <span className="uppercase tracking-widest">{t(`listing_grade_${g}` as any)}</span>
                      {grade === g && <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 font-['Outfit']">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs">4</span>
                  {t("listing_delivery")}
                </h2>
                <div className="flex flex-col gap-2">
                  {DELIVERY_TERMS.map(dt => (
                    <button 
                      key={dt} type="button" onClick={() => setDeliveryTerms(dt)} 
                      className={`py-3 px-4 rounded-xl text-xs font-bold transition-all text-left flex justify-between items-center ${deliveryTerms === dt ? "bg-emerald-50 text-emerald-700 border-emerald-200 border" : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent"}`}
                    >
                      <span className="uppercase tracking-widest">{t(`listing_${dt}` as any)}</span>
                      {deliveryTerms === dt && <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* STEP 4: PAYMENT */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2 font-['Outfit']">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 text-sm">5</span>
                {isKan ? "ಪಾವತಿ ಮಾಹಿತಿ" : "Payment Details (Optional)"}
              </h2>
              <p className="text-gray-500 text-sm mb-5 pl-10">
                {isKan ? "ನೇರ ಪಾವತಿಗಳನ್ನು ಸ್ವೀಕರಿಸಲು ನಿಮ್ಮ ಯುಪಿಐ ಐಡಿಯನ್ನು ನಮೂದಿಸಿ." : "Enter your UPI ID to allow buyers to instantly pay you via 'Buy Now'."}
              </p>
              
              <div className="pl-10">
                <div className="relative max-w-md">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  </span>
                  <input 
                    type="text" value={upiId} onChange={e => setUpiId(e.target.value)} 
                    placeholder="e.g. farmer@bank" 
                    className="input-premium pl-12" 
                  />
                </div>
              </div>
            </div>

            {/* SUBMIT */}
            <div className="pt-6 pb-12 flex justify-end">
              <button 
                type="submit" 
                disabled={loading || success || !selectedFruit || !quantityKg || !askingPrice} 
                className="btn-primary w-full sm:w-auto px-12 py-4 text-base pulse-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading 
                  ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      {t("listing_submitting")}
                    </span>
                  ) 
                  : (
                    <span className="flex items-center gap-2">
                      <span>✓</span>
                      {t("listing_submit")}
                    </span>
                  )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
