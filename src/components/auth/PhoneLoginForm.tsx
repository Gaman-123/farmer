"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
import { supabase } from "@/lib/supabase";
import { useFarmerStore } from "@/store/farmer";
import { useLanguageStore } from "@/store/language";
import { useTranslation } from "@/lib/i18n/useTranslation";
import OTPInput from "./OTPInput";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type Step = "phone" | "otp";

export default function PhoneLoginForm() {
  const router = useRouter();
  const { setFarmer } = useFarmerStore();
  const { toggleLanguage } = useLanguageStore();
  const { t, language } = useTranslation();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  function formatE164(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    const num = digits.startsWith("91") ? digits : `91${digits}`;
    return `+${num}`;
  }

  async function handleSendOtp() {
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError(t("login_invalid_phone"));
      return;
    }
    const e164 = formatE164(digits);
    if (!isValidPhoneNumber(e164, "IN")) {
      setError(t("login_invalid_phone"));
      return;
    }
    setLoading(true);
    const { error: otpErr } = await supabase.auth.signInWithOtp({ phone: e164 });
    setLoading(false);
    if (otpErr) {
      setError(otpErr.message);
      return;
    }
    setStep("otp");
    setCountdown(60);
  }

  async function handleVerifyOtp(code?: string) {
    const otpCode = code ?? otp;
    if (otpCode.length !== 6) return;
    setError("");
    setLoading(true);
    const e164 = formatE164(phone.replace(/\D/g, ""));

    const { data, error: verifyErr } = await supabase.auth.verifyOtp({
      phone: e164,
      token: otpCode,
      type: "sms",
    });

    if (verifyErr || !data.session) {
      setLoading(false);
      setError(verifyErr?.message ?? t("otp_invalid"));
      return;
    }

    // Hit FastAPI to check if farmer profile exists
    try {
      const res = await fetch(`${API_BASE}/api/farmers/me`, {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });

      if (res.ok) {
        const farmer = await res.json();
        setFarmer(farmer);
        router.push("/dashboard");
      } else if (res.status === 404) {
        router.push("/onboarding/register");
      } else {
        setError(t("error"));
      }
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setError("");
    setOtp("");
    const e164 = formatE164(phone.replace(/\D/g, ""));
    setLoading(true);
    await supabase.auth.signInWithOtp({ phone: e164 });
    setLoading(false);
    setCountdown(60);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 flex items-center justify-center p-4">
      {/* Language toggle */}
      <button
        onClick={toggleLanguage}
        className="fixed top-4 right-4 px-3 py-1.5 text-sm rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-all"
      >
        {t("language_toggle")}
      </button>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-400/20 backdrop-blur border border-emerald-400/30 mb-4">
            <span className="text-4xl">🌾</span>
          </div>
          <h1 className="text-3xl font-bold text-white">{t("login_title")}</h1>
          <p className="text-emerald-200 mt-1">{t("login_subtitle")}</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {step === "phone" ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-emerald-100 mb-2">
                  {t("login_phone_label")}
                </label>
                <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/30 transition-all">
                  <span className="text-emerald-200 font-medium">+91</span>
                  <div className="w-px h-5 bg-white/20" />
                  <input
                    id="phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    placeholder={t("login_phone_placeholder")}
                    className="flex-1 bg-transparent text-white placeholder-emerald-300/60 outline-none text-lg tracking-wider"
                    maxLength={10}
                    autoComplete="tel-national"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-300 text-sm bg-red-900/30 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                id="send-otp-btn"
                onClick={handleSendOtp}
                disabled={loading || phone.length !== 10}
                className="w-full py-3.5 px-6 bg-emerald-400 hover:bg-emerald-300 disabled:bg-emerald-800 disabled:cursor-not-allowed text-emerald-900 font-bold text-lg rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/50"
              >
                {loading ? t("login_sending") : t("login_send_otp")}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-emerald-100 text-sm">
                  {t("otp_subtitle")} <span className="font-bold text-white">+91 {phone}</span>
                </p>
              </div>

              <OTPInput
                value={otp}
                onChange={setOtp}
                onComplete={handleVerifyOtp}
                disabled={loading}
              />

              {error && (
                <p className="text-red-300 text-sm bg-red-900/30 rounded-lg px-3 py-2 text-center">{error}</p>
              )}

              <button
                id="verify-otp-btn"
                onClick={() => handleVerifyOtp()}
                disabled={loading || otp.length !== 6}
                className="w-full py-3.5 px-6 bg-emerald-400 hover:bg-emerald-300 disabled:bg-emerald-800 disabled:cursor-not-allowed text-emerald-900 font-bold text-lg rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/50"
              >
                {loading ? t("otp_verifying") : t("otp_verify")}
              </button>

              <div className="text-center">
                <button
                  onClick={handleResend}
                  disabled={countdown > 0 || loading}
                  className="text-sm text-emerald-300 hover:text-white disabled:text-emerald-600 transition-colors"
                >
                  {countdown > 0
                    ? `${t("otp_resend_in")} ${countdown}s`
                    : t("otp_resend")}
                </button>
              </div>

              <button
                onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                className="w-full text-sm text-emerald-400 hover:text-white transition-colors"
              >
                ← {language === "kn" ? "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಬದಲಿಸಿ" : "Change phone number"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
