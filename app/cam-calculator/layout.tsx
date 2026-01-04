import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cam Horsepower Calculator | Predict Engine Power from Cam Specs",
  description:
    "Free cam horsepower calculator. Enter your camshaft duration, lift, and LSA to estimate peak HP and torque. Works for Ford, Chevy, Mopar, and more.",
  keywords: [
    "cam calculator",
    "camshaft horsepower calculator",
    "cam duration calculator",
    "engine power calculator",
    "cam specs",
    "horsepower estimator",
  ],
  openGraph: {
    title: "Cam Horsepower Calculator | Predict Engine Power from Cam Specs",
    description:
      "Free cam horsepower calculator. Enter your camshaft duration, lift, and LSA to estimate peak HP and torque.",
    type: "website",
    url: "https://camspecelite.com/cam-calculator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cam Horsepower Calculator",
    description:
      "Free cam horsepower calculator. Estimate peak HP and torque from cam specs.",
  },
  alternates: {
    canonical: "https://camspecelite.com/cam-calculator",
  },
};

export default function CamCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
