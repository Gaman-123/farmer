import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LanguageStore {
  language: "en" | "kn";
  setLanguage: (lang: "en" | "kn") => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: "kn",
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () =>
        set({ language: get().language === "kn" ? "en" : "kn" }),
    }),
    { name: "ekrishi-language" }
  )
);
