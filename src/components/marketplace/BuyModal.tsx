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
        description: `Order #${txn.transaction_id.slice(0,8)} - ${qty}kg ${listing!.commodity_name}`,
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
          ondismiss: function() {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold">{isKan ? "ಈಗಲೇ ಖರೀದಿಸಿ" : "Buy Now"}</h2>
              <p className="text-emerald-100 font-medium">{isKan ? listing.commodity_name_kn : listing.commodity_name}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors text-xl font-bold">✕</button>
          </div>
          <div className="mt-4 flex gap-3">
            <div className="bg-white/20 rounded-xl px-3 py-2 text-sm flex-1">
              <p className="text-emerald-100 text-xs">{isKan ? "ಬೆಲೆ" : "Price"}</p>
              <p className="font-bold text-lg">₹{Number(listing.minimum_price_per_kg).toFixed(2)}/kg</p>
            </div>
            <div className="bg-white/20 rounded-xl px-3 py-2 text-sm flex-1">
              <p className="text-emerald-100 text-xs">{isKan ? "ಲಭ್ಯ" : "Available"}</p>
              <p className="font-bold text-lg">{Number(listing.quantity_remaining_kg).toLocaleString()} kg</p>
            </div>
          </div>
        </div>

        {!listing.farmer_upi ? (
          <div className="p-8 space-y-6 bg-gray-50 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex justify-center items-center text-red-500 text-2xl mb-2 font-bold">✕</div>
            <h3 className="font-bold text-gray-800 text-lg uppercase tracking-wider">{isKan ? "ಖರೀದಿ ಅಲಭ್ಯ" : "Purchase Unavailable"}</h3>
            <p className="text-gray-500 text-sm">
              {isKan ? "ರೈತರು ಯುಪಿಐ ಅನ್ನು ಒದಗಿಸಿಲ್ಲ." : "Farmer has not configured an active UPI ID. Online escrow flow disabled."}
            </p>
            <button onClick={onClose} className="w-full py-3.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 uppercase tracking-wider text-xs">
              {t("cancel")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleBuy} className="p-6 space-y-5 bg-gray-50">
            {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 text-sm font-medium">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{isKan ? "ಖರೀದಿಸಲು ಪ್ರಮಾಣ (ಕೆಜಿ)" : "Quantity to Buy (kg)"} *</label>
              <input
                type="number"
                step="1"
                min="1"
                max={listing.quantity_remaining_kg}
                value={quantityKg}
                onChange={e => setQuantityKg(e.target.value)}
                placeholder={`Max ${listing.quantity_remaining_kg} kg`}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800 font-bold text-lg"
                disabled={loading}
                autoFocus
              />
            </div>

            {!isNaN(totalAmount) && totalAmount > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between shadow-inner">
                <span className="text-emerald-800 font-medium">{isKan ? "ಒಟ್ಟು ಮೊತ್ತ" : "Total Amount"}</span>
                <div className="text-right">
                  <span className="font-extrabold text-emerald-700 text-2xl block">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-tighter italic">+ taxes & platform fees</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {!loading && (
                <button type="button" onClick={onClose} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all uppercase tracking-wider text-xs">
                  {t("cancel")}
                </button>
              )}
              <button type="submit" disabled={loading} className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-80 text-white font-extrabold rounded-xl transition-all shadow-md hover:shadow-lg flex flex-col items-center justify-center">
                {loading ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-[10px] font-medium animate-pulse">{step}</span>
                  </div>
                ) : (
                  <span>{isKan ? "ಪಾವತಿಸಿ" : "PAY NOW"}</span>
                )}
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Secured by Razorpay • Escrow Enabled</p>
            </div>

            {/* DEV ONLY: Force Paid button */}
            <div className="border-t border-dashed border-red-200 pt-4 mt-2">
              <p className="text-[10px] text-red-400 uppercase tracking-widest font-semibold mb-2 text-center">⚠ Dev Only</p>
              <button
                type="button"
                onClick={handleForcePaid}
                disabled={forcePaidLoading || loading}
                className="w-full py-2.5 border-2 border-red-400 text-red-600 text-xs font-extrabold rounded-xl hover:bg-red-50 transition-all uppercase tracking-widest disabled:opacity-50"
              >
                {forcePaidLoading ? "Processing..." : "⚡ Force Paid"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
