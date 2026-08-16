"use client";

import { useFarmerStore } from "@/store/farmer";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLanguageStore } from "@/store/language";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/ui/Navbar";

export default function Dashboard() {
  const { user } = useFarmerStore();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const isKan = language === "kn";
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!user) router.push("/");
  }, [user, router]);

  if (!user || !mounted) return null;

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-20">
        
        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-8 sm:p-12 text-white shadow-xl mb-8 animate-fadeUp">
          
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-10 w-40 h-40 bg-teal-400 opacity-10 rounded-full blur-2xl transform -translate-y-1/2"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-4 animate-slideDown" style={{ animationDelay: "150ms" }}>
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulseGlow"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-50">Live</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black mb-2 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {isKan ? "ನಮಸ್ಕಾರ, " : "Welcome back, "}<span className="text-emerald-200">{user.name}</span>!
              </h1>
              <p className="text-emerald-50/80 text-lg max-w-lg leading-relaxed">
                {isKan ? "ನಿಮ್ಮ ಇ-ಕೃಷಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಸುಸ್ವಾಗತ. ನಿಮ್ಮ ವ್ಯವಹಾರಗಳನ್ನು ಸುಲಭವಾಗಿ ನಿರ್ವಹಿಸಿ." : "Here's what's happening with your marketplace activity today."}
              </p>
            </div>
            
            <div className="hidden md:flex items-center justify-center w-32 h-32 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-inner hover:scale-105 transition-transform duration-500 animate-scaleIn">
              <span className="text-6xl animate-float">
                {user.role === "farmer" ? "🚜" : "🛒"}
              </span>
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10 section-fade">
          
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                📦
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">Active</span>
            </div>
            <p className="text-gray-500 font-medium text-sm mb-1">{isKan ? "ಸಕ್ರಿಯ ಪಟ್ಟಿಗಳು" : "Active Listings"}</p>
            <h3 className="text-3xl font-black text-gray-900 animate-countUp">12</h3>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                📈
              </div>
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full uppercase tracking-wider">This Month</span>
            </div>
            <p className="text-gray-500 font-medium text-sm mb-1">{isKan ? "ಹೊಸ ಬಿಡ್‌ಗಳು" : "New Bids"}</p>
            <h3 className="text-3xl font-black text-gray-900 animate-countUp" style={{ animationDelay: "100ms" }}>48</h3>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                💰
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-wider">Estimated</span>
            </div>
            <p className="text-gray-500 font-medium text-sm mb-1">{isKan ? "ಗಳಿಕೆ" : "Est. Earnings"}</p>
            <h3 className="text-3xl font-black text-gray-900 animate-countUp" style={{ animationDelay: "200ms" }}>₹4.2L</h3>
          </div>

        </div>

        {/* QUICK ACTIONS */}
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          ⚡ {isKan ? "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು" : "Quick Actions"}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 section-fade">
          
          {user.role === 'farmer' && (
            <Link href="/dashboard/listings/new" className="block h-full group">
              <div className="h-full bg-white rounded-3xl p-6 border border-emerald-100 shadow-[0_4px_20px_rgb(16,185,129,0.08)] hover:shadow-[0_12px_40px_rgb(16,185,129,0.15)] hover:border-emerald-300 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition-colors"></div>
                
                <div>
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-emerald-200 mb-5 group-hover:scale-110 transition-transform duration-300">
                    +
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t("new_listing")}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {isKan ? "ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ನಿಮ್ಮ ಹೊಸ ಬೆಳೆಯನ್ನು ಪಟ್ಟಿ ಮಾಡಿ." : "Add a new crop to the marketplace instantly."}
                  </p>
                </div>
                
                <div className="mt-6 flex items-center text-emerald-600 font-bold text-sm uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                  {isKan ? "ಪ್ರಾರಂಭಿಸಿ" : "Get Started"} <span className="ml-2">→</span>
                </div>
              </div>
            </Link>
          )}

          <Link href="/marketplace" className="block h-full group">
            <div className="h-full bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:border-gray-200 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors"></div>
              
              <div>
                <div className="w-14 h-14 bg-gray-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm mb-5 group-hover:scale-110 transition-transform duration-300">
                  🏪
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t("market_title")}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {isKan ? "ಲೈವ್ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳನ್ನು ಮತ್ತು ಪಟ್ಟಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ." : "Browse live listings and check current market rates."}
                </p>
              </div>
              
              <div className="mt-6 flex items-center text-gray-700 font-bold text-sm uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                {isKan ? "ವೀಕ್ಷಿಸಿ" : "Browse Market"} <span className="ml-2">→</span>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/transactions" className="block h-full group">
            <div className="h-full bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:border-gray-200 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-50 rounded-full blur-2xl group-hover:bg-amber-100 transition-colors"></div>
              
              <div>
                <div className="w-14 h-14 bg-gray-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm mb-5 group-hover:scale-110 transition-transform duration-300">
                  🧾
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{isKan ? "ವ್ಯವಹಾರಗಳು" : "Transactions"}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {isKan ? "ನಿಮ್ಮ ಹಿಂದಿನ ಆರ್ಡರ್‌ಗಳು ಮತ್ತು ಪಾವತಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ." : "View your past orders, payments, and digital receipts."}
                </p>
              </div>
              
              <div className="mt-6 flex items-center text-gray-700 font-bold text-sm uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                {isKan ? "ಇತಿಹಾಸ" : "View History"} <span className="ml-2">→</span>
              </div>
            </div>
          </Link>

        </div>

      </main>
    </div>
  );
}
