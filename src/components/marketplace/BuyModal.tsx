"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Listing } from "@/components/listings/ListingCard";
import { useLanguageStore } from "@/store/language";

interface BuyModalProps {
  listing: Listing | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BuyModal({ listing, onClose, onSuccess }: BuyModalProps) {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const isKan = language === "kn";

  const [quantityKg, setQuantityKg] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [forcePaidLoading, setForcePaidLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"checkout" | "qr">("checkout");

  useEffect(() => {
    if (listing) {
      setQuantityKg(listing.quantity_remaining_kg.toString());
      setError("");
      setStep("");
    }
  }, [listing]);

  if (!listing) return null;

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(quantityKg);
    if (!quantityKg || qty <= 0) {
      setError(isKan ? "ಪ್ರಮಾಣವು 0 ಗಿಂತ ಹೆಚ್ಚಿರಬೇಕು" : "Quantity must be > 0");
      return;
    }
    if (qty > listing!.quantity_remaining_kg) {
      setError(isKan ? "ಲಭ್ಯವಿರುವ ಪ್ರಮಾಣಕ್ಕಿಂತ ಹೆಚ್ಚಾಗಿದೆ" : "Exceeds available quantity");
      return;
    }

    setLoading(true);
    setError("");
    setStep(isKan ? "ವಹಿವಾಟನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ..." : "Step 1: Preparing transaction...");

    try {
      // 1. Create Transaction
      const txnResp = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing!.listing_id,
          farmer_id: (listing as any).farmer_id,
          commodity_name: listing!.commodity_name,
          quantity_kg: qty,
          price_per_kg: listing!.minimum_price_per_kg,
          hsn_code: (listing as any).hsn_code || null,
          sale_channel: "marketplace",
          district: listing!.farmer_district || "Karnataka"
        }),
      });
      const txn = await txnResp.json();
      if (!txn.transaction_id) throw new Error(txn.message || "Transaction creation failed");

      setStep(isKan ? "ಪಾವತಿ ಕೋರಿಕೆಯನ್ನು ರಚಿಸಲಾಗುತ್ತಿದೆ..." : "Step 2: Creating secure order...");

      // 2. Create Razorpay Order
      const orderResp = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: txn.transaction_id }),
      });
      const order = await orderResp.json();
      if (!order.razorpay_order_id) throw new Error(order.message || "Order creation failed");

      setStep(isKan ? "ಸುರಕ್ಷಿತ ಪಾವತಿ ವಿಂಡೋವನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ..." : "Step 3: Opening payment window...");

      // 3. Open Razorpay Checkout — force UPI method, prefill farmer VPA
      const options = {
        key: order.key_id,
        amount: order.amount_paise,
        currency: "INR",
        name: "E-Krishi Marketplace",
        description: `Order #${txn.transaction_id.slice(0, 8)} - ${qty}kg ${listing!.commodity_name}`,
        order_id: order.razorpay_order_id,
        method: {
          upi: true,
          card: false,
          netbanking: false,
          wallet: false,
          paylater: false
        },
        prefill: {
          vpa: listing!.farmer_upi || ""
        },
        config: {
          display: {
            blocks: {
              upi: { name: "Pay via UPI", instruments: [{ method: "upi" }] }
            },
            sequence: ["block.upi"],
            preferences: { show_default_blocks: false }
          }
        },
        handler: async function (response: any) {
          setStep(isKan ? "ಪಾವತಿಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ..." : "Final Step: Verifying payment...");
          try {
            const verifyResp = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                transaction_id: txn.transaction_id
              }),
            });
            const verify = await verifyResp.json();
            if (verify.ok) {
              onSuccess();
              onClose();
            } else {
              setError("Payment verification failed. Please contact support.");
            }
          } catch (err: any) {
            setError("Verification error: " + err.message);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setStep("");
          }
        },
        theme: { color: "#10b981" }
      };

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);

    } catch (err: any) {
      setLoading(false);
      setStep("");
      setError(err.message || "Network error.");
    }
  }

  async function handlePayQR(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(quantityKg);
    if (!quantityKg || qty <= 0) { setError("Quantity must be > 0"); return; }

    setLoading(true);
    setError("");
    try {
      const txnResp = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing!.listing_id,
          farmer_id: (listing as any).farmer_id,
          commodity_name: listing!.commodity_name,
          quantity_kg: qty,
          price_per_kg: listing!.minimum_price_per_kg,
          hsn_code: (listing as any).hsn_code || null,
          sale_channel: "marketplace",
          district: listing!.farmer_district || "Karnataka",
          payment_method: "qr_manual"
        }),
      });
      const txn = await txnResp.json();
      if (!txn.transaction_id) throw new Error(txn.message || "Transaction creation failed");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForcePaid() {
    const qty = parseFloat(quantityKg);
    if (!quantityKg || qty <= 0) { setError("Quantity must be > 0"); return; }
    if (qty > listing!.quantity_remaining_kg) { setError("Exceeds available quantity"); return; }
    setForcePaidLoading(true);
    setError("");
    try {
      // 1. Create transaction row
      const txnResp = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing!.listing_id,
          farmer_id: (listing as any).farmer_id,
          commodity_name: listing!.commodity_name,
          quantity_kg: qty,
          price_per_kg: listing!.minimum_price_per_kg,
          hsn_code: (listing as any).hsn_code || null,
          sale_channel: "marketplace",
          district: listing!.farmer_district || "Karnataka"
        }),
      });
      const txn = await txnResp.json();
      if (!txn.transaction_id) throw new Error(txn.message || "Transaction creation failed");

      // 2. Force-mark as released
      const fp = await fetch("/api/payments/force-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: txn.transaction_id }),
      });
      const fpData = await fp.json();
      if (!fpData.ok) throw new Error(fpData.message || "Force paid failed");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError("Force paid error: " + err.message);
    } finally {
      setForcePaidLoading(false);
    }
  }

  const totalAmount = parseFloat(quantityKg) * listing.minimum_price_per_kg;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fadeIn"
      style={{
        background: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(12px) saturate(150%)",
        WebkitBackdropFilter: "blur(12px) saturate(150%)",
      }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-slideUp transform transition-all relative border border-white/50"
        onClick={e => e.stopPropagation()}
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.1) inset"
        }}
      >
        {/* Header Background */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-800 -z-10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        </div>

        {/* Header Content */}
        <div className="pt-6 px-8 pb-6 text-white relative">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-lg backdrop-blur-md border border-white/20 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulseGlow"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-50">Market Price: ₹{listing.minimum_price_per_kg}</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight font-['Outfit']">
                {isKan ? "ಈಗಲೇ ಖರೀದಿಸಿ" : "Buy Now"}
              </h2>
              <p className="text-teal-100 font-medium text-sm mt-0.5 opacity-90">
                {isKan ? listing.commodity_name_kn : listing.commodity_name}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all backdrop-blur-md"
            >
              <span className="text-sm font-bold opacity-80 hover:opacity-100">✕</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-t-3xl -mt-6 relative shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          {/* Payment Mode Toggle */}
          <div className="p-4 bg-gray-50/80 border-b border-gray-100 rounded-t-3xl">
            <div className="flex bg-gray-200/50 p-1 rounded-xl">
              <button
                onClick={() => setPaymentMode("checkout")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${paymentMode === "checkout" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                SMART CHECKOUT
              </button>
              <button
                onClick={() => setPaymentMode("qr")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${paymentMode === "qr" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                SCAN & PAY (OFFLINE)
              </button>
            </div>
          </div>

          <div className="p-8 max-h-[65vh] overflow-y-auto">
            {!listing.farmer_upi ? (
              <div className="space-y-6 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex justify-center items-center text-red-500 text-2xl mb-2 font-bold animate-shake">✕</div>
                <h3 className="font-black text-gray-900 text-xl font-['Outfit']">{isKan ? "ಖರೀದಿ ಅಲಭ್ಯ" : "Purchase Unavailable"}</h3>
                <p className="text-gray-500 text-sm">
                  {isKan ? "ರೈತರು ಯುಪಿಐ ಅನ್ನು ಒದಗಿಸಿಲ್ಲ." : "Farmer has not configured an active UPI ID. Online escrow flow disabled."}
                </p>
                <button onClick={onClose} className="w-full py-4 border-2 border-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 uppercase tracking-widest text-xs transition-all">
                  {t("cancel")}
                </button>
              </div>
            ) : paymentMode === "qr" ? (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Scan using any UPI App (GPay, PhonePe, etc.)</p>
                  <div className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] inline-block relative group border-2 border-dashed border-emerald-200 hover:border-emerald-400 transition-colors">
                    <div className="w-48 h-48 mx-auto flex items-center justify-center bg-emerald-50 rounded-2xl overflow-hidden">
                      <img src="/images/qr_code.jpeg" alt="Payment QR" className="max-w-full max-h-full object-contain" />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">UPI ID</span>
                    <p className="text-gray-900 font-black text-lg">{listing.farmer_upi}</p>
                  </div>
                </div>

                <form onSubmit={handlePayQR} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-2">Quantity (kg)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={quantityKg}
                        onChange={e => setQuantityKg(e.target.value)}
                        className="input-premium pl-4 pr-12 text-lg font-bold text-gray-900 h-14"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">KG</span>
                    </div>
                  </div>

                  {error && <div className="text-red-500 text-xs font-bold text-center bg-red-50 py-3 rounded-xl border border-red-100 animate-shake">{error}</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.2)] hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : "Submit Payment"}
                  </button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleBuy} className="space-y-6">
                {error && <div className="bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 animate-shake">
                  <span className="text-lg">⚠️</span>
                  {error}
                </div>}

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-2 flex justify-between">
                    <span>{isKan ? "ಖರೀದಿಸಲು ಪ್ರಮಾಣ (ಕೆಜಿ)" : "Quantity to Buy (kg)"} *</span>
                    <span className="text-emerald-500">Max {listing.quantity_remaining_kg} kg</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number" step="1" min="1" max={listing.quantity_remaining_kg}
                      value={quantityKg}
                      onChange={e => setQuantityKg(e.target.value)}
                      placeholder={`Max ${listing.quantity_remaining_kg} kg`}
                      className="input-premium pl-4 pr-12 text-xl font-bold text-gray-900 h-14"
                      disabled={loading}
                      autoFocus
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">KG</span>
                  </div>
                </div>

                {!isNaN(totalAmount) && totalAmount > 0 && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/50 rounded-2xl p-5 flex items-center justify-between shadow-inner animate-fadeIn">
                    <span className="text-emerald-700 font-bold text-sm uppercase tracking-widest">{isKan ? "ಒಟ್ಟು ಮೊತ್ತ" : "Total Amount"}</span>
                    <div className="text-right">
                      <span className="font-black text-emerald-600 text-3xl block tracking-tight">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      <span className="text-[10px] text-emerald-500/80 uppercase font-bold tracking-tighter italic block mt-1">+ taxes & platform fees</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  {!loading && (
                    <button type="button" onClick={onClose} className="flex-1 py-4 border-2 border-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 hover:text-gray-900 transition-all uppercase tracking-widest text-sm">
                      {t("cancel")}
                    </button>
                  )}
                  <button type="submit" disabled={loading} className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-80 text-white font-black rounded-2xl transition-all shadow-[0_8px_25px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.4)] flex flex-col items-center justify-center uppercase tracking-widest text-sm hover:-translate-y-0.5 active:scale-95 pulse-ring">
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="text-xs">{step}</span>
                      </div>
                    ) : (
                      <span>{isKan ? "ಪಾವತಿಸಿ" : "PAY NOW"}</span>
                    )}
                  </button>
                </div>

                <div className="text-center pt-2">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Secured by Razorpay • Escrow Enabled</p>
                </div>

                {/* DEV ONLY: Force Paid button */}
                <div className="border-t border-dashed border-gray-200 pt-6 mt-4 opacity-50 hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-3 text-center">Developer Menu</p>
                  <button
                    type="button"
                    onClick={handleForcePaid}
                    disabled={forcePaidLoading || loading}
                    className="w-full py-3 border border-red-200 bg-red-50 text-red-600 text-xs font-black rounded-xl hover:bg-red-100 transition-all uppercase tracking-widest disabled:opacity-50"
                  >
                    {forcePaidLoading ? "Processing..." : "⚡ Force Paid"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
