"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useFarmerStore } from "@/store/farmer";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLanguageStore } from "@/store/language";
import FarmLocationPicker, { FarmLocation } from "@/components/maps/FarmLocationPicker";

const KARNATAKA_DISTRICTS = [
  "Bagalkot","Ballari","Belagavi","Bengaluru Rural","Bengaluru Urban",
  "Bidar","Chamarajanagar","Chikkaballapur","Chikkamagaluru","Chitradurga",
  "Dakshina Kannada","Davanagere","Dharwad","Gadag","Hassan",
  "Haveri","Kalaburagi","Kodagu","Kolar","Koppal",
  "Mandya","Mysuru","Raichur","Ramanagara","Shivamogga",
  "Tumakuru","Udupi","Uttara Kannada","Vijayapura","Yadgir","Dharwad"
];

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function FarmerRegistrationForm() {
  const router = useRouter();
  const { setUser } = useFarmerStore();
  const { toggleLanguage } = useLanguageStore();
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 fields
  const [fullName, setFullName] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [langPref, setLangPref] = useState<"kn"|"en"|"hi"|"te">("kn");

  // Step 2 fields
  const [farmLocation, setFarmLocation] = useState<FarmLocation | null>(null);

  function validateStep1() {
    if (!fullName.trim()) return "Full name is required";
    if (aadhaar.replace(/\D/g,"").length !== 12) return "Aadhaar must be 12 digits";
    if (!village.trim()) return "Village is required";
    if (!district) return "District is required";
    return "";
  }

  function handleStep1Next() {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  }

  function handleStep2Next() {
    if (!farmLocation) { setError("Please drop a pin on your farm location"); return; }
    setError("");
    setStep(3);
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const aadhaarHash = await sha256(aadhaar.replace(/\D/g,""));
      const phone = session.user.phone ?? "";

      const res = await fetch(`${API_BASE}/api/farmers/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          aadhaar_hash: aadhaarHash,
          village,
          district,
          language_pref: langPref,
          lat: farmLocation!.lat,
          lng: farmLocation!.lng,
          phone_number: phone,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail ?? t("error"));
      }

      const data = await res.json();
      setUser({ id: data.farmer_id || data.id, role: 'farmer', name: fullName, location: `${village}, ${district}` });
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message ?? t("error"));
    } finally {
      setLoading(false);
    }
  }

  const progressPct = ((step - 1) / 2) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 flex items-center justify-center p-4">
      <button onClick={toggleLanguage} className="fixed top-4 right-4 px-3 py-1.5 text-sm rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-all">
        {t("language_toggle")}
      </button>

      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">{t("reg_title")}</h1>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1,2,3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s ? "bg-emerald-400 text-emerald-900" : "bg-white/20 text-white/60"}`}>{s}</div>
                {s < 3 && <div className={`h-0.5 w-12 transition-all ${step > s ? "bg-emerald-400" : "bg-white/20"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-8 mt-2 text-xs text-emerald-200">
            <span>{t("reg_step1")}</span>
            <span>{t("reg_step2")}</span>
            <span>{t("reg_step3")}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          {/* ── STEP 1: Identity ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">👤 {t("reg_step1")}</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("reg_full_name")} *</label>
                <input id="reg-full-name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder={t("reg_full_name_placeholder")} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("reg_aadhaar")} *</label>
                <input id="reg-aadhaar" value={aadhaar} onChange={e => setAadhaar(e.target.value.replace(/\D/g,"").slice(0,12))} placeholder={t("reg_aadhaar_placeholder")} type="password" inputMode="numeric" maxLength={12} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition font-mono tracking-widest" />
                <p className="text-xs text-gray-400 mt-1">🔒 Hashed locally — never stored as plain text</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("reg_village")} *</label>
                  <input id="reg-village" value={village} onChange={e => setVillage(e.target.value)} placeholder={t("reg_village_placeholder")} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("reg_district")} *</label>
                  <select id="reg-district" value={district} onChange={e => setDistrict(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition bg-white">
                    <option value="">{t("reg_district_placeholder")}</option>
                    {KARNATAKA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("reg_language")}</label>
                <div className="flex gap-2 flex-wrap">
                  {(["kn","en","hi","te"] as const).map(l => (
                    <button key={l} type="button" onClick={() => setLangPref(l)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${langPref === l ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      {l === "kn" ? "ಕನ್ನಡ" : l === "en" ? "English" : l === "hi" ? "हिंदी" : "తెలుగు"}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleStep1Next} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all">{t("reg_next")} →</button>
            </div>
          )}

          {/* ── STEP 2: Farm Location ── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">🗺️ {t("reg_location_title")}</h2>
              <FarmLocationPicker onChange={setFarmLocation} />
              {farmLocation && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("reg_address")}</label>
                  <textarea value={farmLocation.address} readOnly rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-sm bg-gray-50 resize-none" />
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:border-gray-300 transition-all">{t("reg_back")}</button>
                <button onClick={handleStep2Next} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all">{t("reg_next")} →</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Review ── */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">✅ {t("reg_review_title")}</h2>
              <div className="bg-gray-50 rounded-2xl p-5 space-y-3 text-sm">
                {[
                  ["👤 Name", fullName],
                  ["🔒 Aadhaar", "●●●● ●●●● " + aadhaar.slice(-4)],
                  ["🏘️ Village", village],
                  ["📍 District", district],
                  ["🌐 Language", langPref.toUpperCase()],
                  ["🗺️ Location", farmLocation ? `${farmLocation.lat.toFixed(4)}, ${farmLocation.lng.toFixed(4)}` : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-800 text-right max-w-[55%]">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:border-gray-300 transition-all">{t("reg_back")}</button>
                <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold rounded-xl transition-all">
                  {loading ? t("reg_submitting") : t("reg_submit")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
