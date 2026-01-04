import "./globals.css";
import "../styles/miami-neon.css";
import Link from "next/link";
import { ShortBlocksProvider } from "@/lib/context/ShortBlocksContext";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Cam Spec Elite | Free Camshaft & Engine Performance Calculators",
    template: "%s | Cam Spec Elite",
  },
  description:
    "Free camshaft calculator and engine performance tools. Calculate HP from cam specs, dynamic compression ratio, drag times, boost estimates, and more.",
  keywords: [
    "camshaft calculator",
    "horsepower calculator",
    "engine calculator",
    "performance calculator",
    "cam specs",
    "dyno curve",
    "compression ratio calculator",
  ],
  metadataBase: new URL("https://camspecelite.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://camspecelite.com",
    siteName: "Cam Spec Elite",
    title: "Cam Spec Elite | Free Camshaft & Engine Performance Calculators",
    description:
      "Free camshaft calculator and engine performance tools. Calculate HP from cam specs, dynamic compression ratio, and more.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Cam Spec Elite - Performance Calculators",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cam Spec Elite | Free Camshaft Calculators",
    description: "Free camshaft HP calculator and engine performance tools.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    // Add your verification codes here when you have them
    // google: "your-google-verification-code",
  },
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
        </ShortBlocksProvider>
      </body>
    </html>
  );
}
