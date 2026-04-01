"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLanguageStore } from "@/store/language";
import { useFarmerStore } from "@/store/farmer";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { toggleLanguage, language } = useLanguageStore();
  const { setUser } = useFarmerStore();
  const router = useRouter();

  const isKan = language === "kn";
  
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"farmer"|"buyer">("farmer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\+91\d{10}$/.test(phone)) {
      setError(isKan ? "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ +91 ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ" : "Please enter a valid +91XXXXXXXXXX number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone, role }),
      });
      const data = await res.json();
      
      if (data.ok) {
        setUser({ id: data.linked_id, role: data.role, name: data.name, location: "Karnataka" });
        router.push(data.role === "farmer" ? "/dashboard" : "/marketplace");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Network Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-12 items-center justify-center -mt-12">
      {/* Topbar minimal */}
      <div className="absolute top-4 right-6 text-white z-10">
        <button 
          onClick={toggleLanguage} 
          className="px-4 py-2 text-sm font-bold rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all"
        >
          {isKan ? "Switch to English" : "ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ"}
        </button>
      </div>

      <div className="max-w-md w-full px-6 text-center space-y-8">
        {/* Hero */}
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
            {isKan ? "ಇ-ಕೃಷಿ ಲಾಗಿನ್" : "E-Krishi Login"}
          </h1>
          <p className="text-gray-500">
            {isKan 
              ? "ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ"
              : "Enter your phone number to continue securely."}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6 text-left">
          {error && <div className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-xl">{error}</div>}
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {isKan ? "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ" : "Mobile Number"}
            </label>
            <input 
              type="text" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="+919876543210"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {isKan ? "ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ" : "Select Role"}
            </label>
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button 
                type="button"
                onClick={() => setRole('farmer')} 
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === 'farmer' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {isKan ? "ರೈತ" : "Farmer"}
              </button>
              <button 
                type="button"
                onClick={() => setRole('buyer')} 
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === 'buyer' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {isKan ? "ಖರೀದಿದಾರ" : "Buyer"}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-sm"
          >
            {loading ? (isKan ? "ಲಾಗಿನ್ ಆಗುತ್ತಿದೆ..." : "Logging in...") : (isKan ? "ಮುಂದುವರಿಯಿರಿ" : "Login Securely")}
          </button>
        </form>
      </div>
    </div>
  );
}
