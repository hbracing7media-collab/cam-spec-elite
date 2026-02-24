"use client";

import { NextIntlClientProvider } from "next-intl";
import { ReactNode, useEffect, useState } from "react";

// Import English messages synchronously as fallback
import enMessages from "../messages/en.json";

type Props = {
  children: ReactNode;
};

export default function I18nProvider({ children }: Props) {
  const [locale, setLocale] = useState("en");
  const [messages, setMessages] = useState<Record<string, any>>(enMessages);

  useEffect(() => {
    async function loadMessages() {
      // Get locale from cookie
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("locale="));
      const localeValue = cookie?.split("=")[1] || "en";
      
      const validLocales = ["en", "es", "de", "fr", "ja", "pt"];
      const finalLocale = validLocales.includes(localeValue) ? localeValue : "en";
      
      setLocale(finalLocale);

      if (finalLocale !== "en") {
        try {
          const msgs = await import(`../messages/${finalLocale}.json`);
          setMessages(msgs.default);
        } catch {
          // Keep English fallback
        }
      }
    }

    loadMessages();
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
