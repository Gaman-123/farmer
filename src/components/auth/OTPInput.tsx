"use client";

import { useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";

interface OTPInputProps {
  value: string;
  onChange: (val: string) => void;
  onComplete?: (val: string) => void;
  length?: number;
  disabled?: boolean;
}

export default function OTPInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
}: OTPInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first empty slot on mount
  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const digits = value.split("").slice(0, length);
  while (digits.length < length) digits.push("");

  function handleChange(idx: number, raw: string) {
    const ch = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = ch;
    const joined = next.join("");
    onChange(joined);
    if (ch && idx < length - 1) {
      inputs.current[idx + 1]?.focus();
    }
    if (joined.replace(/\s/g, "").length === length) {
      onComplete?.(joined);
    }
  }

  function handleKeyDown(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
      const next = [...digits];
      next[idx - 1] = "";
      onChange(next.join(""));
    }
    if (e.key === "ArrowLeft" && idx > 0) inputs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < length - 1) inputs.current[idx + 1]?.focus();
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted.padEnd(length, ""));
    const focusIdx = Math.min(pasted.length, length - 1);
    inputs.current[focusIdx]?.focus();
    if (pasted.length === length) onComplete?.(pasted);
  }

  return (
    <div className="flex gap-3 justify-center" role="group" aria-label="OTP input">
      {digits.map((d, idx) => (
        <input
          key={idx}
          ref={(el) => { inputs.current[idx] = el; }}
          id={`otp-digit-${idx}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className={`
            w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none
            transition-all duration-200
            ${d ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-gray-300 bg-white text-gray-900"}
            focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label={`Digit ${idx + 1}`}
        />
      ))}
    </div>
  );
}
