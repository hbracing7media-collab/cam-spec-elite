"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface LayawayBannerProps {
  imageSrc?: string;
}

export default function LayawayBanner({ imageSrc = "/shop/Layaway graphic.png" }: LayawayBannerProps) {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user dismissed the banner in this session
    const wasDismissed = sessionStorage.getItem("layaway-banner-dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Animation takes 4 seconds
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("layaway-banner-dismissed", "true");
  };

  if (dismissed) return null;

  return (
    <Link href="/shop" style={{ textDecoration: "none" }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, rgba(255, 59, 212, 0.15), rgba(0, 245, 255, 0.15))",
          border: "1px solid rgba(255, 59, 212, 0.3)",
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 20,
          cursor: "pointer",
          minHeight: 100,
        }}
      >
        {/* Dismiss button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDismiss();
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "rgba(255, 255, 255, 0.1)",
            border: "none",
            borderRadius: "50%",
            width: 24,
            height: 24,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
            fontSize: 14,
            zIndex: 10,
          }}
          aria-label="Dismiss"
        >
          ✕
        </button>

        {/* Static background content (description) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            opacity: animationComplete ? 1 : 0.3,
            transition: "opacity 0.5s ease",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ 
              fontSize: 18, 
              fontWeight: 700, 
              color: "#ff3bd4",
              marginBottom: 4,
            }}>
              💰 LAYAWAY NOW AVAILABLE! 💰
            </div>
            <div style={{ 
              fontSize: 14, 
              color: "#e2e8f0",
              lineHeight: 1.5,
            }}>
              Pay over time, get your item when it&apos;s paid off! <span style={{ color: "#22c55e" }}>0% Interest</span> • 
              <span style={{ color: "#00f5ff" }}> No credit check</span> • 
              <span style={{ color: "#fbbf24" }}> Weekly, Bi-Weekly, or Monthly</span>
            </div>
            <div style={{ 
              fontSize: 12, 
              color: "#94a3b8", 
              marginTop: 6 
            }}>
              Click to visit the shop →
            </div>
          </div>
        </div>

        {/* Sliding image overlay */}
        {!animationComplete && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              animation: "slideLayawayImage 4s ease-in-out forwards",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "linear-gradient(90deg, rgba(10, 10, 30, 0.95), rgba(10, 10, 30, 0.98), rgba(10, 10, 30, 0.95))",
                padding: "0 24px",
                borderRadius: 8,
                boxShadow: "0 0 30px rgba(255, 59, 212, 0.4), 0 0 60px rgba(0, 245, 255, 0.2)",
                whiteSpace: "nowrap",
                height: "100%",
              }}
            >
              <Image
                src={imageSrc}
                alt="Layaway Available"
                width={100}
                height={100}
                style={{ 
                  objectFit: "contain",
                  filter: "drop-shadow(0 0 10px rgba(255, 59, 212, 0.5))",
                  height: "90%",
                  width: "auto",
                }}
                onError={(e) => {
                  // Hide if image doesn't exist
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div>
                <div style={{ 
                  fontSize: 20, 
                  fontWeight: 800, 
                  background: "linear-gradient(90deg, #ff3bd4, #00f5ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: 1,
                }}>
                  🛒 LAYAWAY NOW AVAILABLE!
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>
                  0% Interest • Pay it off, then we ship!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CSS Animation */}
        <style jsx>{`
          @keyframes slideLayawayImage {
            0% {
              transform: translateX(-100%);
            }
            15% {
              transform: translateX(0%);
            }
            85% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(110%);
            }
          }
        `}</style>
      </div>
    </Link>
  );
}
