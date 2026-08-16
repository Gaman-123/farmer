"use client";

import { useEffect, useState } from "react";
import { useFarmerStore } from "@/store/farmer";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import Navbar from "@/components/ui/Navbar";
import { useLanguageStore } from "@/store/language";

interface Transaction {
  transaction_id: string;
  created_at: string;
  commodity_name: string;
  total_amount: string | number;
  payment_status: string;
  farmer_name: string;
  buyer_name: string | null;
}

export default function TransactionHistoryPage() {
  const { user } = useFarmerStore();
  const { language } = useLanguageStore();
  const isKan = language === "kn";
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const queryParam = user!.role === "farmer" ? `farmer_id=${user!.id}` : `buyer_id=${user!.id}`;
        const res = await fetch(`/api/transactions?${queryParam}`);
        const json = await res.json();
        setTransactions(json.data || []);
      } catch (err) {
        console.error("Failed to load transactions", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, router]);

  if (!user) return null;

  const isFarmer = user.role === "farmer";

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (["released", "paid", "success"].includes(s)) {
      return (
        <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulseGlow"></span>
          Success
        </span>
      );
    }
    if (["pending", "in_escrow"].includes(s)) {
      return (
        <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulseGlow"></span>
          Escrow
        </span>
      );
    }
    return (
      <span className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center justify-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
        Failed
      </span>
    );
  };

  const totalEarnings = transactions.reduce((sum, txn) => sum + Number(txn.total_amount), 0);
  const pendingTransactions = transactions.filter(t => ["pending", "in_escrow"].includes(t.payment_status.toLowerCase())).length;

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar backHref="/dashboard" backLabel={isKan ? "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ" : "Back to Dashboard"} />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white animate-fadeUp">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 font-['Outfit']">
                {isKan ? "ವ್ಯವಹಾರಗಳ ಇತಿಹಾಸ" : "Transaction History"}
              </h1>
              <p className="text-gray-400 text-sm max-w-md leading-relaxed">
                {isFarmer 
                  ? (isKan ? "ನಿಮ್ಮ ಇ-ಕೃಷಿ ವ್ಯಾಪಾರಗಳಿಂದ ಸ್ವೀಕರಿಸಲಾದ ಎಲ್ಲಾ ಪಾವತಿಗಳನ್ನು ಇಲ್ಲಿ ವೀಕ್ಷಿಸಿ." : "Track all payments received for your produce securely via Escrow.") 
                  : (isKan ? "ನಿಮ್ಮ ಎಲ್ಲಾ ಖರೀದಿಗಳನ್ನು ಇಲ್ಲಿ ಪರಿಶೀಲಿಸಿ." : "Monitor all your secure purchases and escrow releases.")}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 min-w-[140px] shadow-lg animate-scaleIn" style={{ animationDelay: "100ms" }}>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                  {isFarmer ? "Total Earnings" : "Total Spent"}
                </p>
                <p className="text-2xl font-black text-emerald-400">
                  ₹{totalEarnings.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 min-w-[140px] shadow-lg animate-scaleIn" style={{ animationDelay: "200ms" }}>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                  In Escrow
                </p>
                <p className="text-2xl font-black text-amber-400">
                  {pendingTransactions} <span className="text-sm">Txns</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-24 relative -mt-8 z-10">
        
        <div className="bg-white rounded-[2rem] shadow-[0_15px_50px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden animate-slideUp" style={{ animationDelay: "300ms" }}>
          
          {/* Table Header */}
          <div className="p-6 sm:px-8 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 font-['Outfit']">
              {isKan ? "ಇತ್ತೀಚಿನ ವಹಿವಾಟುಗಳು" : "Recent Transactions"}
            </h2>
            <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm uppercase tracking-widest">
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-white text-gray-400 font-black uppercase tracking-widest text-[10px] border-b border-gray-100">
                <tr>
                  <th className="px-8 py-5">Order ID</th>
                  <th className="px-6 py-5">Date</th>
                  <th className="px-6 py-5">{isFarmer ? "Buyer" : "Farmer"}</th>
                  <th className="px-6 py-5">Crop</th>
                  <th className="px-6 py-5 font-black text-gray-500">{isFarmer ? "Received" : "Paid"}</th>
                  <th className="px-8 py-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-8 py-6"><div className="h-4 skeleton rounded-lg w-20"></div></td>
                      <td className="px-6 py-6"><div className="h-4 skeleton rounded-lg w-24"></div></td>
                      <td className="px-6 py-6"><div className="h-4 skeleton rounded-lg w-32"></div></td>
                      <td className="px-6 py-6"><div className="h-4 skeleton rounded-lg w-24"></div></td>
                      <td className="px-6 py-6"><div className="h-4 skeleton rounded-lg w-24"></div></td>
                      <td className="px-8 py-6"><div className="h-8 skeleton rounded-xl w-24 mx-auto"></div></td>
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center justify-center animate-fadeIn">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                          <span className="text-3xl opacity-40">🧾</span>
                        </div>
                        <p className="font-black text-gray-900 text-xl font-['Outfit'] mb-1">No transactions yet</p>
                        <p className="text-gray-500 text-sm">When you complete an order, it will appear here securely.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn, index) => (
                    <tr 
                      key={txn.transaction_id} 
                      className="hover:bg-gray-50/80 transition-colors group animate-fadeUp"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-8 py-6">
                        <span className="font-mono text-xs font-bold text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded">
                          {txn.transaction_id.split("-")[0]}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-gray-500 text-xs font-semibold" title={format(new Date(txn.created_at), "PPp")}>
                        {formatDistanceToNow(new Date(txn.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-6">
                        <span className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                          {isFarmer ? (txn.buyer_name || "Unknown Buyer") : txn.farmer_name}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold shadow-sm">
                          {txn.commodity_name}
                        </span>
                      </td>
                      <td className="px-6 py-6 font-black text-gray-900 text-base">
                        ₹{Number(txn.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-6 text-center">
                        {getStatusBadge(txn.payment_status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
