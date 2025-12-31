"use client";

import React, { useState, useEffect, useRef } from "react";

// Roll race time slip data
export interface RollTimeSlip {
  reactionTime: number;  // Time to hit the gas from green
  sixtyToHundred: number;  // 60-100 mph time
  hundredToOneTwenty: number;  // 100-120 mph time
  oneTwentyToOneThirty: number;  // 120-130 mph time
  totalTime: number;  // Total 60-130 time
}

interface RollRaceSimulatorProps {
  matchId: string;
  userRole: "challenger" | "opponent";
  challenger: {
    name: string;
    weight_lbs: number;
    hp: number;
  };
  opponent: {
    name: string;
    weight_lbs: number;
    hp: number;
  };
  onFinish: (timeSlip: RollTimeSlip) => void;
}

type LightState = "off" | "on";
interface RollLights {
  ready: LightState;
  set: LightState;
  go: LightState;
}

const initialLights: RollLights = {
  ready: "off",
  set: "off",
  go: "off",
};

export default function RollRaceSimulator({
  matchId,
  userRole,
  challenger,
  opponent,
  onFinish,
}: RollRaceSimulatorProps) {
  const [gameState, setGameState] = useState<"ready" | "countdown" | "rolling" | "racing" | "finished" | "submitted">("ready");
  const [lights, setLights] = useState<RollLights>(initialLights);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [timeSlip, setTimeSlip] = useState<RollTimeSlip | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState(60);
  const [falseStart, setFalseStart] = useState(false);
  const [carProgress, setCarProgress] = useState(0);

  const goLightTimeRef = useRef<number | null>(null);
  const raceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasReactedRef = useRef(false);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get user's vehicle
  const userVehicle = userRole === "challenger" ? challenger : opponent;

  // Calculate roll race times based on HP and weight (60-130 pull)
  const calculateRollTimeSlip = (weight_lbs: number, hp: number, rt: number): RollTimeSlip => {
    // Power to weight ratio
    const pwRatio = hp / weight_lbs;
    
    // Base times for an "average" car (400hp, 3500lbs = 0.114 pw ratio)
    // 60-130 typically takes around 8-15 seconds depending on power
    const basePwRatio = 0.114;
    const powerMultiplier = basePwRatio / pwRatio; // Higher pw = faster
    
    // Segment times with variation
    const base60to100 = 4.5 * powerMultiplier;
    const base100to120 = 3.0 * powerMultiplier;
    const base120to130 = 2.5 * powerMultiplier;
    
    // Add small random variation (±5%)
    const variation = () => 0.95 + Math.random() * 0.10;
    
    const sixtyToHundred = base60to100 * variation();
    const hundredToOneTwenty = base100to120 * variation();
    const oneTwentyToOneThirty = base120to130 * variation();
    const totalTime = sixtyToHundred + hundredToOneTwenty + oneTwentyToOneThirty;
    
    return {
      reactionTime: rt,
      sixtyToHundred: Math.round(sixtyToHundred * 1000) / 1000,
      hundredToOneTwenty: Math.round(hundredToOneTwenty * 1000) / 1000,
      oneTwentyToOneThirty: Math.round(oneTwentyToOneThirty * 1000) / 1000,
      totalTime: Math.round((totalTime + rt) * 1000) / 1000,
    };
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
      if (sequenceTimeoutRef.current) clearTimeout(sequenceTimeoutRef.current);
    };
  }, []);

  // Start the countdown sequence
  const startRace = () => {
    if (gameState !== "ready") return;
    
    setGameState("countdown");
    setLights(initialLights);
    setCurrentSpeed(60);
    setCarProgress(0);
    hasReactedRef.current = false;
    setFalseStart(false);

    // READY light
    setTimeout(() => {
      setLights((prev) => ({ ...prev, ready: "on" }));
    }, 500);

    // SET light (rolling at 60mph)
    setTimeout(() => {
      setLights((prev) => ({ ...prev, set: "on" }));
      setGameState("rolling");
    }, 1500);

    // GO light!
    sequenceTimeoutRef.current = setTimeout(() => {
      setLights((prev) => ({ ...prev, go: "on" }));
      goLightTimeRef.current = performance.now();
    }, 2500 + Math.random() * 1000); // Random delay 2.5-3.5s
  };

  // Handle throttle hit (spacebar or click)
  const handleThrottle = () => {
    if (hasReactedRef.current) return;

    // Check for false start (hit before GO) - during countdown or rolling
    if (lights.go === "off" && (gameState === "countdown" || gameState === "rolling")) {
      setFalseStart(true);
      hasReactedRef.current = true;
      if (sequenceTimeoutRef.current) clearTimeout(sequenceTimeoutRef.current);
      setGameState("finished");
      
      // Create DQ time slip
      const dqSlip: RollTimeSlip = {
        reactionTime: -0.001, // Red light indicator
        sixtyToHundred: 0,
        hundredToOneTwenty: 0,
        oneTwentyToOneThirty: 0,
        totalTime: 999.999,
      };
      setTimeSlip(dqSlip);
      return;
    }

    if (lights.go === "on" && goLightTimeRef.current && !hasReactedRef.current) {
      hasReactedRef.current = true;
      const rt = (performance.now() - goLightTimeRef.current) / 1000;
      setReactionTime(rt);
      setGameState("racing");

      // Calculate the full time slip
      const slip = calculateRollTimeSlip(userVehicle.weight_lbs, userVehicle.hp, rt);
      setTimeSlip(slip);

      // Animate the race (speed climbing from 60 to 130)
      const totalDuration = slip.totalTime * 1000;
      const startTime = performance.now();
      
      raceIntervalRef.current = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / (totalDuration * 0.33), 1); // 3x faster animation
        
        // Calculate current speed based on progress
        const speedProgress = Math.min(elapsed / totalDuration, 1);
        const newSpeed = 60 + (70 * speedProgress); // 60 to 130
        setCurrentSpeed(Math.round(newSpeed));
        setCarProgress(progress * 100);

        if (progress >= 1) {
          clearInterval(raceIntervalRef.current!);
          setCurrentSpeed(130);
          setGameState("finished");
        }
      }, 16);
    }
  };

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && (gameState === "rolling" || lights.go === "on")) {
        e.preventDefault();
        handleThrottle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, lights.go]);

  // Submit results
  const handleSubmit = () => {
    if (timeSlip && gameState === "finished") {
      setGameState("submitted");
      onFinish(timeSlip);
    }
  };

  // Render light bulb
  const renderLight = (color: string, state: LightState, label: string) => (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: "50%",
          background: state === "on" ? color : "rgba(50,50,50,0.8)",
          boxShadow: state === "on" ? `0 0 20px ${color}, 0 0 40px ${color}` : "none",
          border: "3px solid #333",
          margin: "0 auto 8px",
          transition: "all 0.1s",
        }}
      />
      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{label}</div>
    </div>
  );

  return (
    <div
      style={{
        padding: 24,
        background: "linear-gradient(180deg, rgba(10,10,30,0.95), rgba(5,5,20,0.98))",
        borderRadius: 16,
        border: "2px solid rgba(139,92,246,0.3)",
        minHeight: 400,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h2 style={{ color: "#a78bfa", fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "0.1em" }}>
          🚀 60-130 ROLL RACE
        </h2>
        <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 8 }}>
          {userVehicle.weight_lbs} lbs • {userVehicle.hp} HP
        </p>
      </div>

      {/* Light Panel */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 30,
          padding: 20,
          background: "rgba(0,0,0,0.4)",
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        {renderLight("#fbbf24", lights.ready, "READY")}
        {renderLight("#f97316", lights.set, "SET")}
        {renderLight("#22c55e", lights.go, "GO!")}
      </div>

      {/* Track / Speed Display */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            height: 80,
            background: "linear-gradient(90deg, #1a1a2e, #16213e)",
            borderRadius: 8,
            position: "relative",
            overflow: "hidden",
            border: "1px solid rgba(139,92,246,0.3)",
          }}
        >
          {/* Speed markers */}
          <div style={{ position: "absolute", top: 8, left: "14%", color: "#64748b", fontSize: 10 }}>60</div>
          <div style={{ position: "absolute", top: 8, left: "42%", color: "#64748b", fontSize: 10 }}>100</div>
          <div style={{ position: "absolute", top: 8, left: "71%", color: "#64748b", fontSize: 10 }}>120</div>
          <div style={{ position: "absolute", top: 8, right: "5%", color: "#22c55e", fontSize: 10, fontWeight: 700 }}>130</div>
          
          {/* Road markings */}
          <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.1)" }} />
          
          {/* Car emoji - flipped to face right */}
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: `${10 + carProgress * 0.8}%`,
              fontSize: 36,
              transition: "left 0.05s linear",
              filter: gameState === "racing" ? "drop-shadow(0 0 10px #a78bfa)" : "none",
              transform: "scaleX(-1)",
            }}
          >
            🏎️
          </div>
        </div>

        {/* Current speed display */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <div style={{ 
            fontSize: 48, 
            fontWeight: 900, 
            fontFamily: "monospace",
            color: currentSpeed >= 130 ? "#22c55e" : currentSpeed >= 100 ? "#fbbf24" : "#a78bfa",
            textShadow: "0 0 20px currentColor",
          }}>
            {currentSpeed} <span style={{ fontSize: 20 }}>MPH</span>
          </div>
        </div>
      </div>

      {/* Controls / Status */}
      <div style={{ textAlign: "center" }}>
        {/* Status message */}
        <div style={{ marginBottom: 12, minHeight: 50 }}>
          {gameState === "ready" && (
            <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>
              Press Start to begin countdown
            </p>
          )}
          {gameState === "countdown" && (
            <p style={{ color: "#fbbf24", fontSize: 14, fontWeight: 600, margin: 0 }}>
              Get ready to roll...
            </p>
          )}
          {gameState === "rolling" && lights.go === "off" && (
            <div>
              <p style={{ color: "#f97316", fontSize: 14, fontWeight: 600, margin: "0 0 4px 0" }}>
                Rolling at 60 MPH...
              </p>
              <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>
                Wait for GO light, then hit Launch
              </p>
            </div>
          )}
          {(gameState === "rolling" || gameState === "racing") && lights.go === "on" && !hasReactedRef.current && (
            <p style={{ color: "#22c55e", fontSize: 14, fontWeight: 600, margin: 0 }}>
              GO! Hit Launch now!
            </p>
          )}
          {gameState === "racing" && (
            <p style={{ color: "#a78bfa", fontSize: 14, margin: 0 }}>
              Pulling to 130...
            </p>
          )}
        </div>

        {/* Buttons - always visible in same position */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          {/* Start button */}
          <button
            onClick={startRace}
            disabled={gameState !== "ready"}
            style={{
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              background: gameState === "ready" ? "rgba(139, 92, 246, 0.15)" : "rgba(50, 50, 50, 0.15)",
              color: gameState === "ready" ? "#a78bfa" : "#4b5563",
              border: `1px solid ${gameState === "ready" ? "rgba(139, 92, 246, 0.4)" : "rgba(50, 50, 50, 0.3)"}`,
              borderRadius: 8,
              cursor: gameState === "ready" ? "pointer" : "not-allowed",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Start
          </button>

          {/* Launch button - always clickable during countdown/rolling for false start */}
          <button
            onClick={handleThrottle}
            disabled={gameState === "ready" || gameState === "racing" || gameState === "finished" || gameState === "submitted" || hasReactedRef.current}
            style={{
              padding: "12px 32px",
              fontSize: 14,
              fontWeight: 600,
              background: lights.go === "on" && !hasReactedRef.current 
                ? "rgba(34, 197, 94, 0.2)" 
                : (gameState === "countdown" || gameState === "rolling") && !hasReactedRef.current
                ? "rgba(239, 68, 68, 0.1)"
                : "rgba(100, 100, 100, 0.15)",
              color: lights.go === "on" && !hasReactedRef.current 
                ? "#22c55e" 
                : (gameState === "countdown" || gameState === "rolling") && !hasReactedRef.current
                ? "#ef4444"
                : "#64748b",
              border: `1px solid ${lights.go === "on" && !hasReactedRef.current 
                ? "rgba(34, 197, 94, 0.5)" 
                : (gameState === "countdown" || gameState === "rolling") && !hasReactedRef.current
                ? "rgba(239, 68, 68, 0.3)"
                : "rgba(100, 100, 100, 0.3)"}`,
              borderRadius: 8,
              cursor: (gameState === "countdown" || gameState === "rolling" || lights.go === "on") && !hasReactedRef.current ? "pointer" : "not-allowed",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Launch
          </button>
        </div>

        {gameState === "finished" && timeSlip && (
          <div style={{ marginTop: 16 }}>
            {falseStart ? (
              <div style={{ 
                background: "rgba(239,68,68,0.2)", 
                border: "2px solid #ef4444", 
                borderRadius: 12, 
                padding: 20,
                marginBottom: 16,
              }}>
                <p style={{ color: "#ef4444", fontSize: 24, fontWeight: 900, margin: 0 }}>
                  🚫 JUMPED THE START!
                </p>
                <p style={{ color: "#f87171", fontSize: 14, marginTop: 8 }}>
                  You hit the throttle before GO - Disqualified
                </p>
              </div>
            ) : (
              <div style={{ 
                background: "rgba(139,92,246,0.1)", 
                border: "2px solid rgba(139,92,246,0.4)", 
                borderRadius: 12, 
                padding: 20,
                marginBottom: 16,
              }}>
                <p style={{ color: "#a78bfa", fontSize: 14, fontWeight: 600, marginBottom: 12, textTransform: "uppercase" }}>
                  60-130 Roll Time Slip
                </p>
                <div style={{ fontFamily: "monospace", fontSize: 14, color: "#e2e8f0", textAlign: "left", maxWidth: 280, margin: "0 auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, padding: "4px 0", borderBottom: "1px solid rgba(139,92,246,0.2)" }}>
                    <span style={{ color: "#94a3b8" }}>Reaction:</span>
                    <span style={{ color: timeSlip.reactionTime < 0.2 ? "#22c55e" : "#fbbf24" }}>
                      {timeSlip.reactionTime.toFixed(3)}s
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#94a3b8" }}>60-100:</span>
                    <span>{timeSlip.sixtyToHundred.toFixed(3)}s</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#94a3b8" }}>100-120:</span>
                    <span>{timeSlip.hundredToOneTwenty.toFixed(3)}s</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#94a3b8" }}>120-130:</span>
                    <span>{timeSlip.oneTwentyToOneThirty.toFixed(3)}s</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, padding: "8px 0", borderTop: "2px solid rgba(139,92,246,0.4)" }}>
                    <span style={{ color: "#a78bfa", fontWeight: 700 }}>TOTAL 60-130:</span>
                    <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>
                      {timeSlip.totalTime.toFixed(3)}s
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              style={{
                padding: "14px 40px",
                fontSize: 16,
                fontWeight: 700,
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "white",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              ✓ Submit Results
            </button>
          </div>
        )}

        {gameState === "submitted" && (
          <div style={{ 
            background: "rgba(34,197,94,0.1)", 
            border: "2px solid #22c55e", 
            borderRadius: 12, 
            padding: 20,
          }}>
            <p style={{ color: "#22c55e", fontSize: 18, fontWeight: 700, margin: 0 }}>
              ✓ Results Submitted!
            </p>
            <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 8 }}>
              Waiting for opponent to complete their run...
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
