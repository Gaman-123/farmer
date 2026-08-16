"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguageStore } from "@/store/language";
import { useFarmerStore } from "@/store/farmer";

interface NavbarProps {
  /** Optional back-link label. If provided, shows a back chevron. */
  backHref?: string;
  backLabel?: string;
}

export default function Navbar({ backHref, backLabel }: NavbarProps) {
  const router = useRouter();
  const { language, toggleLanguage } = useLanguageStore();
  const { user, clearUser } = useFarmerStore();
  const isKan = language === "kn";

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);

    function setIsScrolled(v: boolean) { setScrolled(v); }
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    clearUser();
    router.push("/");
  }

  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    farmer: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
    buyer:  { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  };
  const roleStyle = user ? (roleColors[user.role] ?? roleColors.farmer) : roleColors.farmer;

  return (
    <>
      <nav
        id="main-navbar"
        className="fixed top-0 left-0 right-0 z-50 animate-slideDown"
        style={{
          background: scrolled
            ? "rgba(255, 255, 255, 0.92)"
            : "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: scrolled ? "1px solid rgba(5, 150, 105, 0.12)" : "1px solid transparent",
          boxShadow: scrolled ? "0 4px 24px -4px rgb(0 0 0 / 0.06)" : "none",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

          {/* ── Left: Logo / Back ── */}
          <div className="flex items-center gap-3">
            {backHref ? (
              <button
                onClick={() => router.push(backHref)}
                className="flex items-center gap-2 text-gray-500 hover:text-emerald-700 transition-colors font-semibold text-sm group"
              >
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:bg-emerald-50"
                  style={{ border: "1.5px solid #e5e7eb" }}
                >
                  ←
                </span>
                <span className="hidden sm:block">{backLabel ?? (isKan ? "ಹಿಂದೆ" : "Back")}</span>
              </button>
            ) : (
              <button
                onClick={() => router.push(user ? (user.role === "farmer" ? "/dashboard" : "/marketplace") : "/")}
                className="flex items-center gap-2.5 group"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm transition-all group-hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #059669, #0d9488)",
                    boxShadow: "0 4px 12px rgb(5 150 105 / 0.3)",
                  }}
                >
                  🌿
                </div>
                <div className="leading-tight">
                  <p
                    className="font-black text-gray-900 text-base leading-tight"
                    style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}
                  >
                    E-Krishi
                  </p>
                  <p className="text-emerald-600 text-[9px] font-bold tracking-widest uppercase opacity-80">
                    ಇ-ಕೃಷಿ ಪೋರ್ಟಲ್
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* ── Center: Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-1">
            {user && (
              <>
                <NavLink
                  label={isKan ? "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್" : "Dashboard"}
                  href="/dashboard"
                  router={router}
                />
                <NavLink
                  label={isKan ? "ಮಾರುಕಟ್ಟೆ" : "Marketplace"}
                  href="/marketplace"
                  router={router}
                />
                {user.role === "farmer" && (
                  <NavLink
                    label={isKan ? "ಪಟ್ಟಿ ಸೇರಿಸಿ" : "+ New Listing"}
                    href="/dashboard/listings/new"
                    router={router}
                    highlight
                  />
                )}
              </>
            )}
          </div>

          {/* ── Right: Actions ── */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language toggle */}
            <button
              id="lang-toggle-btn"
              onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: "#f0fdf4",
                color: "#047857",
                border: "1px solid #a7f3d0",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "#d1fae5";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "#f0fdf4";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              🇮🇳 <span className="tracking-wide">{isKan ? "EN" : "ಕನ್ನಡ"}</span>
            </button>

            {/* User chip */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-3 pr-1 py-1 rounded-full" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-sm"
                  style={{ background: "linear-gradient(135deg, #059669, #0d9488)" }}
                >
                  {(user.name?.[0] ?? "U").toUpperCase()}
                </div>
                <div className="leading-tight pr-1">
                  <p className="text-gray-800 font-bold text-xs">{user.name}</p>
                  <span
                    className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                    style={{ background: roleStyle.bg, color: roleStyle.text, border: `1px solid ${roleStyle.border}` }}
                  >
                    {isKan ? (user.role === "farmer" ? "ರೈತ" : "ಖರೀದಿ") : user.role}
                  </span>
                </div>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-xs font-bold"
                  title="Logout"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden w-9 h-9 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all"
              style={{ border: "1.5px solid #e5e7eb", background: "#fff" }}
              onClick={() => setMenuOpen(o => !o)}
            >
              <span className="w-4 h-0.5 bg-gray-500 rounded transition-all" style={{ transform: menuOpen ? "rotate(45deg) translateY(3px)" : "" }} />
              <span className="w-4 h-0.5 bg-gray-500 rounded transition-all" style={{ opacity: menuOpen ? 0 : 1 }} />
              <span className="w-4 h-0.5 bg-gray-500 rounded transition-all" style={{ transform: menuOpen ? "rotate(-45deg) translateY(-3px)" : "" }} />
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown menu ── */}
        {menuOpen && (
          <div
            className="md:hidden px-4 pb-4 pt-2 border-t animate-slideDown"
            style={{ borderColor: "rgba(5, 150, 105, 0.1)", background: "rgba(255,255,255,0.97)" }}
          >
            <div className="flex flex-col gap-1">
              {user && (
                <>
                  <MobileNavLink label={isKan ? "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್" : "Dashboard"} href="/dashboard" router={router} onClick={() => setMenuOpen(false)} />
                  <MobileNavLink label={isKan ? "ಮಾರುಕಟ್ಟೆ" : "Marketplace"} href="/marketplace" router={router} onClick={() => setMenuOpen(false)} />
                  {user.role === "farmer" && (
                    <MobileNavLink label={isKan ? "ಪಟ್ಟಿ ಸೇರಿಸಿ" : "New Listing"} href="/dashboard/listings/new" router={router} onClick={() => setMenuOpen(false)} />
                  )}
                  <MobileNavLink label={isKan ? "ವ್ಯವಹಾರಗಳು" : "Transactions"} href="/dashboard/transactions" router={router} onClick={() => setMenuOpen(false)} />
                </>
              )}
              <button
                onClick={() => { toggleLanguage(); setMenuOpen(false); }}
                className="text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-all"
              >
                🌐 {isKan ? "Switch to English" : "ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ"}
              </button>
              {user && (
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
                >
                  🚪 {isKan ? "ಲಾಗ್‌ಔಟ್" : "Logout"}
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer so content doesn't hide behind fixed navbar */}
      <div className="h-16 w-full" />
    </>
  );
}

/* ─── Helper sub-components ─────────────────────────── */

function NavLink({
  label, href, router, highlight = false,
}: {
  label: string;
  href: string;
  router: ReturnType<typeof useRouter>;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={() => router.push(href)}
      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
      style={highlight ? {
        background: "linear-gradient(135deg, #059669, #0d9488)",
        color: "#fff",
        boxShadow: "0 3px 12px rgb(5 150 105 / 0.3)",
      } : {
        color: "#4b5563",
      }}
      onMouseEnter={e => {
        if (!highlight) {
          e.currentTarget.style.background = "#f0fdf4";
          e.currentTarget.style.color = "#047857";
        } else {
          e.currentTarget.style.transform = "scale(1.03)";
        }
      }}
      onMouseLeave={e => {
        if (!highlight) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#4b5563";
        } else {
          e.currentTarget.style.transform = "scale(1)";
        }
      }}
    >
      {label}
    </button>
  );
}

function MobileNavLink({
  label, href, router, onClick,
}: {
  label: string;
  href: string;
  router: ReturnType<typeof useRouter>;
  onClick: () => void;
}) {
  return (
    <button
      onClick={() => { router.push(href); onClick(); }}
      className="text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
    >
      {label}
    </button>
  );
}
