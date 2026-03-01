import "./globals.css";
import "../styles/miami-neon.css";
import Link from "next/link";
import { ShortBlocksProvider } from "@/lib/context/ShortBlocksContext";
import AIChatBot from "@/components/AIChatBot";
import ContactButton from "@/components/ContactButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import I18nProvider from "@/components/I18nProvider";

export const metadata = {
  title: "Cam Spec Elite",
  description: "Dark Miami Neon Performance System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <ShortBlocksProvider>
            {/* Global background */}
            <div className="app-background" />

            {/* Global header / home logo */}
            <header className="app-header">
              <Link href="/" className="home-logo">
                <img
                  src="/hbracing-logo.png"
                  alt="HB Racing Home"
                  draggable={false}
                />
              </Link>
            </header>

            {/* Language Switcher - fixed top right */}
            <div style={{ position: "fixed", top: 12, right: 16, zIndex: 9999 }}>
              <LanguageSwitcher />
            </div>

            {/* Page content */}
            <main className="app-content">{children}</main>

            {/* Global AI Chatbot */}
            <AIChatBot 
              defaultCollapsed={true}
              title="Cam Spec Elite AI"
              placeholder="Ask about cams, HP, engine combos..."
            />

            {/* Global Contact Button */}
            <ContactButton />
          </ShortBlocksProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
