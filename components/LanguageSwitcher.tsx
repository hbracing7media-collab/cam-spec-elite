"use client";

import { useState, useRef, useEffect } from "react";

const locales = ["en", "es", "de", "fr", "ja", "pt"] as const;
type Locale = (typeof locales)[number];

const localeData: Record<Locale, { name: string; flag: string }> = {
  en: { name: "English", flag: "🇺🇸" },
  es: { name: "Español", flag: "🇪🇸" },
  de: { name: "Deutsch", flag: "🇩🇪" },
  fr: { name: "Français", flag: "🇫🇷" },
  ja: { name: "日本語", flag: "🇯🇵" },
  pt: { name: "Português", flag: "🇧🇷" },
};

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<Locale>("en");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get current locale from cookie
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("locale="));
    if (cookie) {
      const value = cookie.split("=")[1] as Locale;
      if (locales.includes(value)) {
        setCurrentLocale(value);
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function changeLocale(locale: Locale) {
    // Set cookie
    document.cookie = `locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    setCurrentLocale(locale);
    setIsOpen(false);
    // Reload to apply new locale
    window.location.reload();
  }

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 12px",
          background: "rgba(2, 6, 23, 0.55)",
          border: "1px solid rgba(148, 163, 184, 0.25)",
          borderRadius: 8,
          color: "#e5e7eb",
          cursor: "pointer",
          fontSize: 14,
        }}
        aria-label="Select language"
      >
        <span style={{ fontSize: 18 }}>{localeData[currentLocale].flag}</span>
        <span>{localeData[currentLocale].name}</span>
        <span style={{ fontSize: 10, opacity: 0.7 }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 4,
            background: "rgba(2, 6, 23, 0.95)",
            border: "1px solid rgba(148, 163, 184, 0.25)",
            borderRadius: 8,
            overflow: "hidden",
            zIndex: 1000,
            minWidth: 160,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          }}
        >
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => changeLocale(locale)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "10px 14px",
                background: locale === currentLocale ? "rgba(56, 189, 248, 0.15)" : "transparent",
                border: "none",
                color: locale === currentLocale ? "#7dd3fc" : "#e5e7eb",
                cursor: "pointer",
                fontSize: 14,
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (locale !== currentLocale) {
                  e.currentTarget.style.background = "rgba(56, 189, 248, 0.08)";
                }
              }}
              onMouseLeave={(e) => {
                if (locale !== currentLocale) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span style={{ fontSize: 18 }}>{localeData[locale].flag}</span>
              <span>{localeData[locale].name}</span>
              {locale === currentLocale && (
                <span style={{ marginLeft: "auto", fontSize: 12 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
