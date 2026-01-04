"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LaunchCalculatorButtonProps {
  calculatorPath: string;
  className?: string;
  children: React.ReactNode;
}

export default function LaunchCalculatorButton({
  calculatorPath,
  className = "",
  children,
}: LaunchCalculatorButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setIsLoading(true);
    try {
      // Use the API endpoint that checks server-side cookies
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      
      if (res.ok && data?.user) {
        // User is authenticated - go to home page
        window.location.href = "/";
      } else {
        // Not authenticated - redirect to login
        window.location.href = "/auth/login";
      }
    } catch (error) {
      // On error, send to login
      window.location.href = "/auth/login";
    } finally {
      setIsLoading(false);
    }
  }

  // If className includes "pill", use minimal inline styles and let CSS class handle styling
  const isPill = className.includes("pill");

  const baseStyle = isPill
    ? {
        cursor: isLoading ? "wait" : "pointer",
        textAlign: "center" as const,
        padding: "12px 16px",
      }
    : {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "16px 32px",
        fontSize: "1.1rem",
        fontWeight: 700,
        textTransform: "uppercase" as const,
        letterSpacing: "0.1em",
        background: "linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899)",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        cursor: isLoading ? "wait" : "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        boxShadow: "0 4px 20px rgba(139, 92, 246, 0.4)",
      };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (!isLoading && !isPill) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 30px rgba(139, 92, 246, 0.6)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isPill) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(139, 92, 246, 0.4)";
        }
      }}
    >
      {isLoading ? "..." : children}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
}
