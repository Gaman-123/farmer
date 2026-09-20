"use client";

import { useFarmerStore } from "@/store/farmer";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLanguageStore } from "@/store/language";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/ui/Navbar";

interface BidItem {
  bid_id: string;
  listing_id: string;
  buyer_id: string;
  offered_price_per_kg: string | number;
  quantity_kg: string | number | null;
  pickup_date: string | null;
  delivery_terms: string | null;
  note: string | null;
  status: string;
  created_at: string;
  commodity_name: string;
  listing_price: string | number;
  buyer_name?: string;
  buyer_phone?: string;
}

export default function Dashboard() {
  const { user } = useFarmerStore();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const isKan = language === "kn";
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [bids, setBids] = useState<BidItem[]>([]);
  const [activeListingsCount, setActiveListingsCount] = useState<number>(0);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!user) {
      router.push("/");
      return;
    }

    fetchDashboardData();
  }, [user, router]);

  async function fetchDashboardData() {
    if (!user) return;
    setLoadingData(true);
    try {
      // 1. Fetch Bids
      const bidParam = user.role === "farmer" ? `farmer_id=${user.id}` : `buyer_id=${user.id}`;
      const bidsRes = await fetch(`/api/bids?${bidParam}`);
      const bidsJson = await bidsRes.json();
      setBids(bidsJson.data || []);

      // 2. Fetch Active Listings
      const listingsRes = await fetch("/api/listings");
      const listingsJson = await listingsRes.json();
      setActiveListingsCount(listingsJson.total || (listingsJson.data?.length ?? 0));
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoadingData(false);
    }
  }

  async function handleBidAction(bidId: string, action: "accept" | "reject") {
    setActionLoading(bidId);
    try {
      const res = await fetch(`/api/bids/${bidId}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.bid_id) {
        await fetchDashboardData();
      } else {
        alert(data.message || "Failed to update bid");
      }
    } catch {
      alert("Network error processing bid action");
    } finally {
      setActionLoading(null);
    }
  }

  if (!user || !mounted) return null;

  const totalBidValue = bids.reduce((acc, b) => {
    const qty = b.quantity_kg ? Number(b.quantity_kg) : 100;
    return acc + Number(b.offered_price_per_kg) * qty;
  }, 0);

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
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-50">
                  {user.role === "buyer" ? (isKan ? "ಖರೀದಿದಾರ ಮೋಡ್" : "Buyer Mode") : (isKan ? "ರೈತ ಮೋಡ್" : "Farmer Mode")}
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black mb-2 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {isKan ? "ನಮಸ್ಕಾರ, " : "Welcome back, "}<span className="text-emerald-200">{user.name}</span>!
              </h1>
              <p className="text-emerald-50/80 text-lg max-w-lg leading-relaxed">
                {user.role === "farmer"
                  ? (isKan ? "ನಿಮ್ಮ ಬೆಳೆ ಪಟ್ಟಿಗಳು ಮತ್ತು ಸ್ವೀಕರಿಸిన ಬಿಡ್‌ಗಳನ್ನು ಇಲ್ಲಿ ನಿರ್ವಹಿಸಿ." : "Manage your produce listings and review incoming bids from buyers in real-time.")
                  : (isKan ? "ನಿಮ್ಮ ಎಲ್ಲಾ ಬಿಡ್‌ಗಳು ಮತ್ತು ಸಕ್ರಿಯ ಮಾರುಕಟ್ಟೆ ಆದೇಶಗಳನ್ನು ವೀಕ್ಷಿಸಿ." : "Track your submitted bids, market offers, and pending deliveries in real-time.")}
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
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">Live</span>
            </div>
            <p className="text-gray-500 font-medium text-sm mb-1">{isKan ? "ಸಕ್ರಿಯ ಪಟ್ಟಿಗಳು" : "Active Listings"}</p>
            <h3 className="text-3xl font-black text-gray-900">
              {loadingData ? "..." : activeListingsCount}
            </h3>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                📈
              </div>
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full uppercase tracking-wider">Neon DB</span>
            </div>
            <p className="text-gray-500 font-medium text-sm mb-1">{user.role === "farmer" ? (isKan ? "ಸ್ವೀಕರಿಸಿದ ಬಿಡ್‌ಗಳು" : "Bids Received") : (isKan ? "ನನ್ನ ಬಿಡ್‌ಗಳು" : "My Bids Placed")}</p>
            <h3 className="text-3xl font-black text-gray-900">
              {loadingData ? "..." : bids.length}
            </h3>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                💰
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-wider">Estimate</span>
            </div>
            <p className="text-gray-500 font-medium text-sm mb-1">{isKan ? "ಒಟ್ಟು ಬಿಡ್ ಮೌಲ್ಯ" : "Total Bid Value"}</p>
            <h3 className="text-3xl font-black text-gray-900">
              {loadingData ? "..." : `₹${Math.round(totalBidValue).toLocaleString("en-IN")}`}
            </h3>
          </div>

        </div>

        {/* BIDS SECTION FROM NEON DATABASE */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Neon PostgreSQL Database</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {user.role === "farmer"
                  ? (isKan ? "ನಿಮ್ಮ ಬೆಳೆಗಳಿಗೆ ಸ್ವೀಕರಿಸಿದ ಬಿಡ್‌ಗಳು" : "Incoming Bids on Your Produce")
                  : (isKan ? "ನೀವು ಸಲ್ಲಿಸಿದ ಬಿಡ್‌ಗಳು" : "Your Placed Bids")}
              </h2>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl text-xs uppercase tracking-wider transition-all self-start sm:self-auto"
            >
              🔄 Refresh Bids
            </button>
          </div>

          {loadingData ? (
            <div className="py-12 text-center text-gray-400 font-medium animate-pulse">
              Loading live bids from Neon Database...
            </div>
          ) : bids.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-3">
                🏷️
              </div>
              <p className="text-gray-900 font-bold text-lg mb-1 font-['Outfit']">
                {user.role === "farmer" ? "No bids received yet" : "You haven't placed any bids yet"}
              </p>
              <p className="text-gray-500 text-sm max-w-sm mb-4">
                {user.role === "farmer"
                  ? "Bids submitted by buyers on your listings will appear here in real-time."
                  : "Explore the marketplace to discover fresh harvests and make offers to farmers."}
              </p>
              {user.role === "buyer" && (
                <Link
                  href="/marketplace"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-md"
                >
                  Browse Marketplace →
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <th className="py-3 px-4">Crop</th>
                    <th className="py-3 px-4">{user.role === "farmer" ? "Buyer" : "Offer Details"}</th>
                    <th className="py-3 px-4">Offered Price</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Status</th>
                    {user.role === "farmer" && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bids.map((bid) => {
                    const statusColors: Record<string, string> = {
                      pending: "bg-amber-50 text-amber-700 border-amber-200",
                      accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      rejected: "bg-red-50 text-red-700 border-red-200",
                      countered: "bg-blue-50 text-blue-700 border-blue-200",
                    };
                    const badgeClass = statusColors[bid.status] || "bg-gray-50 text-gray-700 border-gray-200";

                    return (
                      <tr key={bid.bid_id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-4 px-4 font-bold text-gray-900">
                          <div>{bid.commodity_name}</div>
                          <div className="text-xs text-gray-400 font-normal">
                            List Price: ₹{bid.listing_price}/kg
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {user.role === "farmer" ? (
                            <div>
                              <div className="font-bold text-gray-800">{bid.buyer_name || "Registered Buyer"}</div>
                              {bid.buyer_phone && (
                                <div className="text-xs text-gray-400">{bid.buyer_phone}</div>
                              )}
                              {bid.note && <div className="text-xs text-emerald-700 italic mt-0.5">&quot;{bid.note}&quot;</div>}
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium text-gray-700">{bid.delivery_terms || "Farm Pickup"}</div>
                              {bid.note && <div className="text-xs text-gray-400 italic">&quot;{bid.note}&quot;</div>}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 font-black text-emerald-700 text-base">
                          ₹{Number(bid.offered_price_per_kg).toFixed(2)}/kg
                        </td>
                        <td className="py-4 px-4 font-semibold text-gray-700">
                          {bid.quantity_kg ? `${bid.quantity_kg} kg` : "Full Batch"}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeClass}`}>
                            {bid.status}
                          </span>
                        </td>
                        {user.role === "farmer" && (
                          <td className="py-4 px-4 text-right">
                            {bid.status === "pending" ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  disabled={actionLoading === bid.bid_id}
                                  onClick={() => handleBidAction(bid.bid_id, "accept")}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                                >
                                  Accept ✓
                                </button>
                                <button
                                  disabled={actionLoading === bid.bid_id}
                                  onClick={() => handleBidAction(bid.bid_id, "reject")}
                                  className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-xs border border-red-200 transition-all disabled:opacity-50"
                                >
                                  Reject ✕
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium italic">Completed</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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

