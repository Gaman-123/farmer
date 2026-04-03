"use client";

import { useFarmerStore } from "@/store/farmer";
import { useLanguageStore } from "@/store/language";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, clearUser } = useFarmerStore();
  const { toggleLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) return null;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    clearUser();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-4 flex items-center justify-between shadow-md border-b border-gray-700">
        <h1 className="text-xl font-bold tracking-tight uppercase">{t("dashboard")}</h1>
        <div className="flex items-center gap-3">
          <button onClick={toggleLanguage} className="px-3 py-1.5 text-xs uppercase tracking-wider rounded border border-white/20 hover:bg-white/10 transition-all font-medium">
            {t("language_toggle")}
          </button>
          <button onClick={handleLogout} className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded bg-red-500/10 text-red-100 hover:bg-red-500/30 transition-all">
            LOGOUT
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-6">
        <div className="bg-white rounded p-6 shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 tracking-wider">PROFILE</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-gray-500">{user.location} • {user.role.toUpperCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {user.role === 'farmer' && (
            <Link href="/dashboard/listings/new" className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded text-white shadow hover:shadow-lg transition-all group">
              <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">{t("new_listing")}</h3>
              <p className="text-emerald-50 group-hover:text-white transition-colors text-sm">List your fresh fruits on the E-Krishi marketplace.</p>
            </Link>
          )}

          <Link href="/marketplace" className="bg-white p-6 rounded border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all group">
            <h3 className="text-xl font-bold text-gray-800 mb-2 uppercase tracking-wide">{t("market_title")}</h3>
            <p className="text-gray-500 group-hover:text-gray-700 transition-colors text-sm">Browse active listings and market prices.</p>
          </Link>

          <Link href="/dashboard/transactions" className="bg-white p-6 rounded border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all group">
            <h3 className="text-xl font-bold text-gray-800 mb-2 uppercase tracking-wide">Transactions</h3>
            <p className="text-gray-500 group-hover:text-gray-700 transition-colors text-sm">View your past orders, payments, and receipts.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
