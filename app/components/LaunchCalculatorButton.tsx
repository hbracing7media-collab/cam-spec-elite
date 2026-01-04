"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

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
      const user = await getCurrentUser();
      if (user) {
        router.push(calculatorPath);
      } else {
        // Redirect to login - after login they'll go to home page
        router.push("/auth/login");
      }
    } catch (error) {
      // On error, send to login
      router.push("/auth/login");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "16px 32px",
        fontSize: "1.1rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        background: "linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899)",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        cursor: isLoading ? "wait" : "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        boxShadow: "0 4px 20px rgba(139, 92, 246, 0.4)",
      }}
      onMouseEnter={(e) => {
        if (!isLoading) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 30px rgba(139, 92, 246, 0.6)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(139, 92, 246, 0.4)";
      }}
    >
      {isLoading ? (
        <>
          <span
            style={{
              width: 16,
              height: 16,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          Loading...
        </>
      ) : (
        children
      )}
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
