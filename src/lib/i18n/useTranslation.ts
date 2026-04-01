"use client";

import { useLanguageStore } from "@/store/language";
import { en, TranslationKey } from "./en";
import { kn } from "./kn";

const translations = { en, kn };

export function useTranslation() {
  const { language } = useLanguageStore();

  function t(key: TranslationKey): string {
    const lang = language as keyof typeof translations;
    return translations[lang]?.[key] ?? en[key] ?? key;
  }

  return { t, language };
}
