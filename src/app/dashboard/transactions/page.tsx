"use client";

import { useEffect, useState } from "react";
import { useFarmerStore } from "@/store/farmer";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";

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
        const queryParam = user.role === "farmer" ? `farmer_id=${user.id}` : `buyer_id=${user.id}`;
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
      return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-sm">Success</span>;
    }
    if (["pending", "in_escrow"].includes(s)) {
      return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider shadow-sm">Pending</span>;
    }
    return <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider shadow-sm">Failed</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-4 flex items-center justify-between shadow-md border-b border-gray-700">
        <h1 className="text-xl font-bold tracking-tight uppercase">Transaction History</h1>
        <button onClick={() => router.push("/dashboard")} className="px-4 py-2 text-sm font-bold rounded bg-white/10 hover:bg-white/20 transition-all uppercase tracking-wider">
          Back to Dashboard
        </button>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800">Your Recent Transactions</h2>
            <p className="text-gray-500 text-sm mt-1">{isFarmer ? "Payments received for your produce" : "Payments made for your purchases"}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-xs border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">{isFarmer ? "Buyer" : "Farmer"}</th>
                  <th className="px-6 py-4">Crop</th>
                  <th className="px-6 py-4 font-bold">{isFarmer ? "Amount Received" : "Amount Paid"}</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse bg-gray-50/50">
                      <td className="px-6 py-5"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="px-6 py-5"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-6 py-5"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td className="px-6 py-5"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="px-6 py-5"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-6 py-5"><div className="h-6 bg-gray-200 rounded-full w-20 mx-auto"></div></td>
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <span className="text-2xl opacity-50">🧾</span>
                        </div>
                        <p className="font-medium text-gray-600 text-lg">No transactions yet</p>
                        <p className="text-gray-400 text-sm mt-1">When you make a transaction, it will appear here.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => (
                    <tr key={txn.transaction_id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5 font-mono text-xs text-gray-500 uppercase tracking-wider truncate max-w-[120px]" title={txn.transaction_id}>
                        {txn.transaction_id.split("-")[0]}
                      </td>
                      <td className="px-6 py-5" title={format(new Date(txn.created_at), "PPp")}>
                        {formatDistanceToNow(new Date(txn.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-5 font-medium text-gray-800">
                        {isFarmer ? (txn.buyer_name || "Unknown Buyer") : txn.farmer_name}
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">
                          {txn.commodity_name}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-bold text-gray-800">
                        ₹{Number(txn.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-5 text-center">
                        {getStatusBadge(txn.payment_status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
