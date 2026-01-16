import "./globals.css";
import "../styles/miami-neon.css";
import Link from "next/link";
import { ShortBlocksProvider } from "@/lib/context/ShortBlocksContext";
import AIChatBot from "@/components/AIChatBot";

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

          {/* Page content */}
          <main className="app-content">{children}</main>

          {/* Global AI Chatbot */}
          <AIChatBot 
            defaultCollapsed={true}
            title="Cam Spec Elite AI"
            placeholder="Ask about cams, HP, engine combos..."
          />
        </ShortBlocksProvider>
      </body>
    </html>
  );
}
