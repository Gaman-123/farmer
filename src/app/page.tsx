"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/language";
import { useFarmerStore } from "@/store/farmer";
import { useRouter } from "next/navigation";

// Floating particle component
function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute rounded-full opacity-30 pointer-events-none"
      style={style}
    />
  );
}

const STATS = [
  { en: "5,000+", kn: "5,000+", labelEn: "Farmers", labelKn: "ರೈತರು" },
  { en: "800+",   kn: "800+",   labelEn: "Buyers",  labelKn: "ಖರೀದಿದಾರರು" },
  { en: "₹2Cr+",  kn: "₹2Cr+", labelEn: "Traded",  labelKn: "ವಹಿವಾಟು" },
];

export default function LandingPage() {
  const { toggleLanguage, language } = useLanguageStore();
  const { setUser } = useFarmerStore();
  const router = useRouter();

  const isKan = language === "kn";

  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"farmer" | "buyer">("farmer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\+91\d{10}$/.test(phone)) {
      setError(isKan ? "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ +91 ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ" : "Please enter a valid +91XXXXXXXXXX number");
      setShakeKey(k => k + 1);
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
        setShakeKey(k => k + 1);
      }
    } catch {
      setError("Network Error");
      setShakeKey(k => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const particles = [
    { width: 8, height: 8, top: "10%", left: "15%", background: "linear-gradient(135deg, #6ee7b7, #34d399)", animationDelay: "0s", animationDuration: "6s" },
    { width: 12, height: 12, top: "25%", left: "80%", background: "linear-gradient(135deg, #a7f3d0, #6ee7b7)", animationDelay: "1.5s", animationDuration: "8s" },
    { width: 6, height: 6, top: "55%", left: "8%", background: "linear-gradient(135deg, #34d399, #10b981)", animationDelay: "0.8s", animationDuration: "7s" },
    { width: 10, height: 10, top: "75%", left: "85%", background: "linear-gradient(135deg, #6ee7b7, #2dd4bf)", animationDelay: "2s", animationDuration: "9s" },
    { width: 5, height: 5, top: "40%", left: "92%", background: "linear-gradient(135deg, #fbbf24, #f59e0b)", animationDelay: "3s", animationDuration: "7.5s" },
    { width: 7, height: 7, top: "88%", left: "25%", background: "linear-gradient(135deg, #a7f3d0, #34d399)", animationDelay: "1s", animationDuration: "8.5s" },
    { width: 4, height: 4, top: "18%", left: "55%", background: "linear-gradient(135deg, #fde68a, #fbbf24)", animationDelay: "4s", animationDuration: "6.5s" },
    { width: 9, height: 9, top: "65%", left: "45%", background: "linear-gradient(135deg, #6ee7b7, #059669)", animationDelay: "2.5s", animationDuration: "10s" },
  ];

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ══════════════════════ LEFT HERO PANEL ══════════════════════ */}
      <div
        className="hidden lg:flex flex-col justify-between relative overflow-hidden"
        style={{
          width: "55%",
          background: "linear-gradient(145deg, #064e3b 0%, #065f46 25%, #047857 55%, #0d9488 85%, #0f766e 100%)",
        }}
      >
        {/* Noise overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
            backgroundSize: "200px",
            mixBlendMode: "overlay",
          }}
        />

        {/* Radial glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(52, 211, 153, 0.18) 0%, transparent 70%)",
          }}
        />

        {/* Particles */}
        {mounted && particles.map((p, i) => (
          <Particle
            key={i}
            style={{
              width: p.width,
              height: p.height,
              top: p.top,
              left: p.left,
              background: p.background,
              animation: `floatSlow ${p.animationDuration} ease-in-out infinite`,
              animationDelay: p.animationDelay,
            }}
          />
        ))}

        {/* Top logo */}
        <div className="relative z-10 p-10 animate-slideDown">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              🌿
            </div>
            <div>
              <p className="text-white font-black text-xl tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>E-Krishi</p>
              <p className="text-emerald-200 text-xs font-medium tracking-widest uppercase opacity-80">ಇ-ಕೃಷಿ ಪೋರ್ಟಲ್</p>
            </div>
          </div>
        </div>

        {/* Center hero content */}
        <div className="relative z-10 px-10 pb-4 animate-fadeUp" style={{ animationDelay: "0.2s" }}>
          {/* Big farm emoji */}
          <div
            className="text-9xl mb-8 block"
            style={{ animation: "float 5s ease-in-out infinite", display: "inline-block" }}
          >
            🌾
          </div>

          <h1
            className="text-white mb-4 leading-tight"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(2.5rem, 3.5vw, 3.25rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
            }}
          >
            {isKan ? "ರೈತ ಮತ್ತು ಖರೀದಿದಾರರ" : "Farm Fresh,"}
            <br />
            <span style={{
              background: "linear-gradient(135deg, #6ee7b7, #fbbf24)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {isKan ? "ನೇರ ಸಂಪರ್ಕ" : "Direct to Doorstep"}
            </span>
          </h1>

          <p
            className="text-emerald-100 text-lg font-medium mb-10 max-w-sm leading-relaxed"
            style={{ opacity: 0.85 }}
          >
            {isKan
              ? "ಕರ್ನಾಟಕದ ರೈತರು ಮತ್ತು ಖರೀದಿದಾರರ ನೇರ ಮಾರುಕಟ್ಟೆ ವೇದಿಕೆ."
              : "Karnataka's premier platform connecting farmers directly with buyers. Better prices, faster sales, zero middlemen."}
          </p>

          {/* Stats */}
          <div className="flex gap-8">
            {STATS.map((s, i) => (
              <div
                key={i}
                className="animate-fadeUp"
                style={{ animationDelay: `${0.4 + i * 0.12}s` }}
              >
                <p
                  className="font-black text-2xl text-white"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {s.en}
                </p>
                <p className="text-emerald-200 text-xs font-semibold tracking-wider uppercase mt-0.5">
                  {isKan ? s.labelKn : s.labelEn}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom geometric decoration */}
        <div className="relative z-10 p-10 animate-fadeUp" style={{ animationDelay: "0.6s" }}>
          <div className="flex gap-2">
            {["🥭", "🍌", "🍊", "🍉", "🥕"].map((e, i) => (
              <span
                key={i}
                className="text-2xl"
                style={{
                  animation: `float ${4 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                  display: "inline-block",
                }}
              >
                {e}
              </span>
            ))}
          </div>
          <p className="text-emerald-300 text-xs mt-3 font-medium opacity-70">
            {isKan ? "ಮಾವು • ಬಾಳೆ • ಕಿತ್ತಳೆ • ಕಲ್ಲಂಗಡಿ • ಕ್ಯಾರೆಟ್" : "Mango • Banana • Orange • Watermelon • Carrot"}
          </p>
        </div>
      </div>

      {/* ══════════════════════ RIGHT LOGIN PANEL ══════════════════════ */}
      <div
        className="flex-1 flex flex-col relative overflow-hidden"
        style={{ background: "#fafafa" }}
      >
        {/* Mobile gradient bg */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-10 lg:opacity-0"
          style={{
            background: "radial-gradient(circle, #059669, transparent)",
            transform: "translate(30%, -30%)",
          }}
        />

        {/* Language toggle */}
        <div className="absolute top-5 right-5 z-20">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm"
            style={{
              background: "#fff",
              border: "1.5px solid #d1fae5",
              color: "#059669",
              boxShadow: "0 2px 12px rgb(5 150 105 / 0.1)",
            }}
          >
            <span>{isKan ? "🇮🇳" : "🇮🇳"}</span>
            <span>{isKan ? "English" : "ಕನ್ನಡ"}</span>
          </button>
        </div>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 p-6 pt-8 animate-slideDown">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "linear-gradient(135deg, #059669, #0d9488)" }}
          >
            🌿
          </div>
          <div>
            <p className="font-black text-lg text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>E-Krishi</p>
            <p className="text-emerald-600 text-xs font-medium">ಇ-ಕೃಷಿ ಪೋರ್ಟಲ್</p>
          </div>
        </div>

        {/* Centering wrapper */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-sm animate-fadeUp" style={{ animationDelay: "0.15s" }}>

            {/* Heading */}
            <div className="mb-8">
              <h2
                className="text-gray-900 mb-2"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "2rem",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                {isKan ? "ಸ್ವಾಗತ ✨" : "Welcome back ✨"}
              </h2>
              <p className="text-gray-500 text-base font-medium">
                {isKan
                  ? "ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ"
                  : "Sign in with your mobile number to continue"}
              </p>
            </div>

            {/* Login form card */}
            <div
              className="p-7 rounded-3xl"
              style={{
                background: "#ffffff",
                border: "1.5px solid #e5e7eb",
                boxShadow: "0 8px 40px -4px rgb(0 0 0 / 0.08), 0 0 0 1px rgb(255 255 255 / 0.8) inset",
              }}
            >
              <form onSubmit={handleLogin} className="flex flex-col gap-5">

                {/* Error message */}
                {error && (
                  <div
                    key={shakeKey}
                    className="flex items-start gap-3 px-4 py-3 rounded-2xl animate-shake"
                    style={{ background: "#fff1f2", border: "1px solid #fecdd3" }}
                  >
                    <span className="text-red-500 text-base shrink-0 mt-0.5">⚠️</span>
                    <p className="text-red-700 text-sm font-semibold leading-snug">{error}</p>
                  </div>
                )}

                {/* Role Toggle */}
                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: "#059669" }}
                  >
                    {isKan ? "ನಿಮ್ಮ ಪಾತ್ರ" : "I am a"}
                  </label>
                  <div
                    className="flex rounded-2xl p-1 gap-1"
                    style={{ background: "#f3f4f6" }}
                  >
                    {(["farmer", "buyer"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all"
                        style={{
                          background: role === r ? "#ffffff" : "transparent",
                          color: role === r ? "#059669" : "#6b7280",
                          boxShadow: role === r ? "0 1px 6px rgb(0 0 0 / 0.08)" : "none",
                          transform: role === r ? "scale(1.02)" : "scale(1)",
                        }}
                      >
                        <span>{r === "farmer" ? "🌾" : "🛒"}</span>
                        <span>
                          {r === "farmer"
                            ? (isKan ? "ರೈತ" : "Farmer")
                            : (isKan ? "ಖರೀದಿದಾರ" : "Buyer")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone input */}
                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: "#059669" }}
                  >
                    {isKan ? "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ" : "Mobile Number"}
                  </label>
                  <div className="relative">
                    <div
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-base"
                    >
                      📱
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+919876543210"
                      disabled={loading}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-gray-900 font-semibold placeholder-gray-300 transition-all outline-none"
                      style={{
                        background: "#f9fafb",
                        border: "1.5px solid #e5e7eb",
                        fontSize: "1rem",
                      }}
                      onFocus={e => {
                        e.currentTarget.style.border = "1.5px solid #059669";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgb(5 150 105 / 0.12)";
                        e.currentTarget.style.background = "#ffffff";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.border = "1.5px solid #e5e7eb";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.background = "#f9fafb";
                      }}
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="relative overflow-hidden w-full py-4 rounded-2xl text-white font-black text-base tracking-wide transition-all"
                  style={{
                    background: loading
                      ? "#9ca3af"
                      : "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                    boxShadow: loading ? "none" : "0 6px 24px -4px rgb(5 150 105 / 0.45)",
                  }}
                  onMouseEnter={e => {
                    if (!loading) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 10px 32px -4px rgb(5 150 105 / 0.55)";
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 6px 24px -4px rgb(5 150 105 / 0.45)";
                  }}
                >
                  {/* Shimmer overlay */}
                  {!loading && (
                    <span
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                        transform: "translateX(-100%)",
                        transition: "transform 0.4s ease",
                      }}
                    />
                  )}
                  <span className="relative z-10">
                    {loading
                      ? (
                        <span className="flex items-center justify-center gap-2">
                          <span
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            style={{ animation: "spin 0.8s linear infinite" }}
                          />
                          {isKan ? "ಲಾಗಿನ್ ಆಗುತ್ತಿದೆ..." : "Signing in..."}
                        </span>
                      )
                      : (isKan ? "ಮುಂದುವರಿಯಿರಿ →" : "Continue Securely →")}
                  </span>
                </button>
              </form>
            </div>

            {/* Footer note */}
            <p className="text-center text-gray-400 text-xs font-medium mt-6 px-4 leading-relaxed">
              {isKan
                ? "ಈ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಕೃಷಿ ಇಲಾಖೆಯ ಬೆಂಬಲದೊಂದಿಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ."
                : "Secured platform for Karnataka farmers & buyers. Your data is protected."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
