"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UserHoverCardProps {
  userId: string;
  userName: string;
  avatarUrl?: string;
  handle?: string;
  currentUserId?: string | null;
  size?: "small" | "medium";
  threadId?: string;
}

export default function UserHoverCard({
  userId,
  userName,
  avatarUrl,
  handle,
  currentUserId,
  size = "small",
  threadId,
}: UserHoverCardProps) {
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const avatarSize = size === "small" ? 40 : 48;

  const handleChallenge = async (e: React.MouseEvent, matchType: "simple" | "roll-60-130") => {
    e.stopPropagation();
    
    if (!currentUserId) {
      router.push("/login");
      return;
    }

    if (userId === currentUserId) {
      alert("You can't challenge yourself!");
      return;
    }

    setLoading(matchType);

    try {
      const res = await fetch("/api/forum/grudge/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponent_id: userId,
          match_type: matchType,
          thread_id: threadId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raceType = matchType === "roll-60-130" ? "60-130 Roll Race" : "1/4 Mile Drag Race";
        alert(`${raceType} challenge sent to ${handle || "opponent"}! 🏎️`);
        setShowTooltip(false);
      } else {
        const error = await res.json();
        alert(error.message || "Failed to send challenge");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error sending challenge");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      style={{ 
        position: "relative", 
        display: "inline-block",
        paddingBottom: showTooltip ? "100px" : "0px",
      }}
      onMouseEnter={() => currentUserId && userId !== currentUserId && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Avatar */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={handle || "avatar"}
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: "50%",
            objectFit: "cover",
            cursor: "pointer",
            transition: "all 0.2s ease",
            filter: showTooltip ? "brightness(1.2)" : "brightness(1)",
            border: showTooltip ? "2px solid #00f5ff" : "none",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: "50%",
            background: "#7dd3fc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size === "small" ? 12 : 14,
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s ease",
            filter: showTooltip ? "brightness(1.2)" : "brightness(1)",
            border: showTooltip ? "2px solid #00f5ff" : "none",
          }}
        >
          {(handle?.[0] || "?").toUpperCase()}
        </div>
      )}

      {/* Tooltip - stays visible across whole hover zone */}
      {showTooltip && currentUserId && userId !== currentUserId && (
        <div
          style={{
            position: "absolute",
            top: avatarSize + 12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(135deg, rgba(10, 10, 20, 0.98), rgba(20, 10, 40, 0.98))",
            border: "2px solid #00f5ff",
            borderRadius: "8px",
            padding: "12px",
            zIndex: 10000,
            minWidth: "200px",
            boxShadow: "0 4px 30px rgba(0, 245, 255, 0.4)",
            backdropFilter: "blur(10px)",
            pointerEvents: "auto",
            willChange: "opacity",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <div style={{ fontWeight: "700", color: "#00f5ff", fontSize: "0.9rem" }}>
              {handle || "Unknown"}
            </div>
            <div style={{ fontSize: "0.7rem", color: "#888", marginTop: "4px" }}>
              Pick your race type:
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={(e) => handleChallenge(e, "simple")}
              disabled={loading !== null}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "linear-gradient(135deg, #00f5ff, #ff3bd4)",
                color: "#000",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: loading !== null ? "not-allowed" : "pointer",
                fontSize: "0.8rem",
                textTransform: "uppercase",
                transition: "all 0.2s ease",
                opacity: loading !== null ? 0.6 : 1,
              }}
            >
              {loading === "simple" ? "Sending..." : "🏁 1/4 Mile Drag"}
            </button>
            <button
              onClick={(e) => handleChallenge(e, "roll-60-130")}
              disabled={loading !== null}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "linear-gradient(135deg, #ff8c00, #ff3bd4)",
                color: "#000",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: loading !== null ? "not-allowed" : "pointer",
                fontSize: "0.8rem",
                textTransform: "uppercase",
                transition: "all 0.2s ease",
                opacity: loading !== null ? 0.6 : 1,
              }}
            >
              {loading === "roll-60-130" ? "Sending..." : "🚀 60-130 Roll"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
