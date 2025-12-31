"use client";

import React, { useState, useEffect, useRef } from "react";

// Time slip data (exported for use in parent components)
export interface TimeSlip {
  reactionTime: number;
  sixtyFoot: number;
  eighthET: number;
  eighthMPH: number;
  quarterET: number;
  quarterMPH: number;
}

interface DragSimulatorProps {
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
  onFinish: (timeSlip: TimeSlip) => void;
}

// Christmas Tree light states
type LightState = "off" | "on";
interface TreeLights {
  preStage: LightState;
  stage: LightState;
  amber1: LightState;
  amber2: LightState;
  amber3: LightState;
  green: LightState;
  red: LightState;
}

// (TimeSlip interface moved to exports above)

const initialLights: TreeLights = {
  preStage: "off",
  stage: "off",
  amber1: "off",
  amber2: "off",
  amber3: "off",
  green: "off",
  red: "off",
};

export default function DragSimulator({
  matchId,
  userRole,
  challenger,
  opponent,
  onFinish,
}: DragSimulatorProps) {
  const [gameState, setGameState] = useState<"ready" | "staging" | "waiting" | "racing" | "finished" | "submitted">(
    "ready"
  );
  const [lights, setLights] = useState<TreeLights>(initialLights);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [timeSlip, setTimeSlip] = useState<TimeSlip | null>(null);
  const [carProgress, setCarProgress] = useState(0);
  const [falseStart, setFalseStart] = useState(false);

  const greenLightTimeRef = useRef<number | null>(null);
  const raceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasReactedRef = useRef(false);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get user's vehicle
  const userVehicle = userRole === "challenger" ? challenger : opponent;

  // Calculate realistic drag times based on HP and weight
  const calculateTimeSlip = (weight_lbs: number, hp: number, rt: number): TimeSlip => {
    // Using common drag racing formulas
    const powerToWeight = weight_lbs / hp;
    
    // 1/4 mile ET: ET = 5.825 * (weight/hp)^0.333
    const quarterET = 5.825 * Math.pow(powerToWeight, 0.333);
    
    // 1/4 mile trap speed: MPH = 234 * (hp/weight)^0.333
    const quarterMPH = 234 * Math.pow(hp / weight_lbs, 0.333);
    
    // 1/8 mile is roughly 55% of 1/4 mile ET
    const eighthET = quarterET * 0.55;
    
    // 1/8 mile speed is roughly 85% of 1/4 mile speed
    const eighthMPH = quarterMPH * 0.85;
    
    // 60ft time estimation (typically 1.5-2.5 seconds for street cars)
    // Better power/weight = better 60ft
    const sixtyFoot = 1.3 + (powerToWeight / 15);
    
    // Add some variance for realism (+/- 2%)
    const variance = () => 0.98 + Math.random() * 0.04;
    
    return {
      reactionTime: rt,
      sixtyFoot: Math.max(1.3, sixtyFoot * variance()),
      eighthET: eighthET * variance(),
      eighthMPH: eighthMPH * variance(),
      quarterET: quarterET * variance(),
      quarterMPH: quarterMPH * variance(),
    };
  };

  const handleStart = () => {
    setGameState("staging");
    hasReactedRef.current = false;
    setFalseStart(false);
    setTimeSlip(null);
    setCarProgress(0);
    setLights({ ...initialLights, preStage: "on" });

    // Staging sequence
    setTimeout(() => {
      setLights((prev) => ({ ...prev, stage: "on" }));
      
      // Start the Christmas tree sequence after staging
      setTimeout(() => {
        setGameState("waiting");
        runTreeSequence();
      }, 800);
    }, 500);
  };

  const runTreeSequence = () => {
    const amberDelay = 500; // 0.5 seconds between each amber (Sportsman tree)
    
    // Amber 1
    sequenceTimeoutRef.current = setTimeout(() => {
      setLights((prev) => ({ ...prev, amber1: "on" }));
      
      // Amber 2
      sequenceTimeoutRef.current = setTimeout(() => {
        setLights((prev) => ({ ...prev, amber1: "off", amber2: "on" }));
        
        // Amber 3
        sequenceTimeoutRef.current = setTimeout(() => {
          setLights((prev) => ({ ...prev, amber2: "off", amber3: "on" }));
          
          // Green light!
          sequenceTimeoutRef.current = setTimeout(() => {
            setLights((prev) => ({ ...prev, amber3: "off", green: "on" }));
            greenLightTimeRef.current = Date.now();
            setGameState("racing");
          }, amberDelay);
        }, amberDelay);
      }, amberDelay);
    }, amberDelay);
  };

  const handleReact = () => {
    // Check for false start (reacting before green)
    if (gameState === "waiting" && !hasReactedRef.current) {
      hasReactedRef.current = true;
      setFalseStart(true);
      setLights((prev) => ({ ...prev, red: "on", green: "off", amber1: "off", amber2: "off", amber3: "off" }));
      
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
      
      // Create DQ time slip with losing values
      const dqSlip: TimeSlip = {
        reactionTime: 999.999, // Red light = automatic loss (high value loses)
        sixtyFoot: 0,
        eighthET: 0,
        eighthMPH: 0,
        quarterET: 999.999,
        quarterMPH: 0,
      };
      setTimeSlip(dqSlip);
      setReactionTime(999.999);
      setGameState("finished");
      return;
    }
    
    if (gameState !== "racing" || hasReactedRef.current) return;

    hasReactedRef.current = true;
    
    // Calculate reaction time from when green light came on
    const reactTimeMs = Date.now() - (greenLightTimeRef.current || 0);
    const reactTimeSec = reactTimeMs / 1000;
    setReactionTime(reactTimeSec);

    // Calculate time slip based on vehicle specs
    const slip = calculateTimeSlip(userVehicle.weight_lbs, userVehicle.hp, reactTimeSec);
    
    // Animate car to finish line (3x faster than real time for better UX)
    const animationDuration = (slip.quarterET * 1000) / 3;
    const startTime = Date.now();
    
    raceIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / animationDuration) * 100, 100);
      setCarProgress(progress);
      
      if (progress >= 100) {
        clearInterval(raceIntervalRef.current!);
        setTimeSlip(slip);
        setGameState("finished");
      }
    }, 50);
  };

  const handleSubmitResults = async () => {
    if (reactionTime === null || !timeSlip) return;

    try {
      // Pass full time slip data to parent
      onFinish(timeSlip);
      setGameState("submitted");
    } catch (error) {
      console.error("Error submitting results:", error);
    }
  };

  const handleReset = () => {
    setGameState("ready");
    setLights(initialLights);
    setReactionTime(null);
    setTimeSlip(null);
    setCarProgress(0);
    setFalseStart(false);
    hasReactedRef.current = false;
    greenLightTimeRef.current = null;
    if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
    if (sequenceTimeoutRef.current) clearTimeout(sequenceTimeoutRef.current);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
      if (sequenceTimeoutRef.current) clearTimeout(sequenceTimeoutRef.current);
    };
  }, []);

  return (
    <div className="drag-simulator">
      {/* Your Vehicle Info */}
      <div className="vehicle-info">
        <h3>Your Vehicle</h3>
        <div className="specs">
          <span>{userVehicle.weight_lbs} lbs</span>
          <span>•</span>
          <span>{userVehicle.hp} hp</span>
        </div>
      </div>

      {/* Christmas Tree */}
      <div className="christmas-tree-container">
        <div className="christmas-tree">
          {/* Pre-Stage Lights */}
          <div className="light-row">
            <div className={`light small ${lights.preStage === "on" ? "blue-on" : ""}`} />
          </div>
          
          {/* Stage Lights */}
          <div className="light-row">
            <div className={`light small ${lights.stage === "on" ? "blue-on" : ""}`} />
          </div>
          
          {/* Amber 1 */}
          <div className="light-row">
            <div className={`light amber ${lights.amber1 === "on" ? "amber-on" : ""}`} />
          </div>
          
          {/* Amber 2 */}
          <div className="light-row">
            <div className={`light amber ${lights.amber2 === "on" ? "amber-on" : ""}`} />
          </div>
          
          {/* Amber 3 */}
          <div className="light-row">
            <div className={`light amber ${lights.amber3 === "on" ? "amber-on" : ""}`} />
          </div>
          
          {/* Green Light */}
          <div className="light-row">
            <div className={`light green ${lights.green === "on" ? "green-on" : ""}`} />
          </div>
          
          {/* Red Light */}
          <div className="light-row">
            <div className={`light red ${lights.red === "on" ? "red-on" : ""}`} />
          </div>
        </div>
      </div>

      {/* Race Track - Single Lane */}
      <div className="race-track">
        <div className="lane">
          <div className="start-line" />
          <div className="car" style={{ left: `calc(${carProgress}% - 20px)` }}>
            🏎️
          </div>
          <div className="distance-markers">
            <div className="marker" style={{ left: "4.5%" }}>60&apos;</div>
            <div className="marker" style={{ left: "50%" }}>1/8</div>
            <div className="marker" style={{ left: "100%" }}>1/4</div>
          </div>
          <div className="finish-line" />
        </div>
      </div>

      {/* Game Controls & Info */}
      <div className="game-controls">
        {gameState === "ready" && (
          <button className="btn btn-primary" onClick={handleStart}>
            Stage Vehicle
          </button>
        )}

        {gameState === "staging" && (
          <div className="staging-message">
            Staging... Get Ready!
          </div>
        )}

        {gameState === "waiting" && (
          <div className="react-container">
            <p className="waiting-text">Watch the Tree!</p>
            <button className="btn btn-react" onClick={handleReact}>
              LAUNCH!
            </button>
          </div>
        )}

        {gameState === "racing" && (
          <div className="react-container">
            <p className="react-text">🟢 GO GO GO!</p>
            <button
              className="btn btn-react racing"
              onClick={handleReact}
              disabled={reactionTime !== null}
            >
              {reactionTime !== null ? `RT: ${reactionTime.toFixed(3)}s` : "LAUNCH!"}
            </button>
          </div>
        )}

        {gameState === "finished" && (
          <div className="results">
            <h3>{falseStart ? "🔴 FALSE START!" : "🏁 Time Slip"}</h3>
            
            {falseStart ? (
              <p className="foul-text">Jumped the light! DQ</p>
            ) : timeSlip && (
              <div className="time-slip">
                <div className="slip-row">
                  <span className="label">R/T</span>
                  <span className={`value ${timeSlip.reactionTime < 0.1 ? "excellent" : timeSlip.reactionTime < 0.3 ? "good" : ""}`}>
                    {timeSlip.reactionTime.toFixed(3)}
                  </span>
                </div>
                <div className="slip-row">
                  <span className="label">60&apos;</span>
                  <span className="value">{timeSlip.sixtyFoot.toFixed(3)}</span>
                </div>
                <div className="slip-divider" />
                <div className="slip-row">
                  <span className="label">1/8 ET</span>
                  <span className="value">{timeSlip.eighthET.toFixed(3)}</span>
                </div>
                <div className="slip-row">
                  <span className="label">1/8 MPH</span>
                  <span className="value">{timeSlip.eighthMPH.toFixed(2)}</span>
                </div>
                <div className="slip-divider" />
                <div className="slip-row highlight">
                  <span className="label">1/4 ET</span>
                  <span className="value">{timeSlip.quarterET.toFixed(3)}</span>
                </div>
                <div className="slip-row highlight">
                  <span className="label">1/4 MPH</span>
                  <span className="value">{timeSlip.quarterMPH.toFixed(2)}</span>
                </div>
              </div>
            )}
            
            <div className="button-group">
              {timeSlip && (
                <button className="btn btn-primary" onClick={handleSubmitResults}>
                  {falseStart ? "Submit DQ" : "Submit Results"}
                </button>
              )}
            </div>
          </div>
        )}

        {gameState === "submitted" && timeSlip && (
          <div className="results">
            <h3>✅ Results Submitted!</h3>
            <p className="submitted-message">Waiting for opponent to complete their run...</p>
            <div className="time-slip">
              <div className="slip-row">
                <span className="label">R/T</span>
                <span className="value">{timeSlip.reactionTime.toFixed(3)}</span>
              </div>
              <div className="slip-row">
                <span className="label">60&apos;</span>
                <span className="value">{timeSlip.sixtyFoot.toFixed(3)}</span>
              </div>
              <div className="slip-divider" />
              <div className="slip-row">
                <span className="label">1/8 ET</span>
                <span className="value">{timeSlip.eighthET.toFixed(3)}</span>
              </div>
              <div className="slip-row">
                <span className="label">1/8 MPH</span>
                <span className="value">{timeSlip.eighthMPH.toFixed(2)}</span>
              </div>
              <div className="slip-divider" />
              <div className="slip-row highlight">
                <span className="label">1/4 ET</span>
                <span className="value">{timeSlip.quarterET.toFixed(3)}</span>
              </div>
              <div className="slip-row highlight">
                <span className="label">1/4 MPH</span>
                <span className="value">{timeSlip.quarterMPH.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .drag-simulator {
          width: 100%;
          max-width: 500px;
          padding: 20px;
          background: linear-gradient(135deg, rgba(10, 10, 20, 0.95), rgba(20, 10, 40, 0.95));
          border: 2px solid rgba(0, 245, 255, 0.4);
          border-radius: 12px;
          margin: 20px auto;
        }

        .vehicle-info {
          text-align: center;
          margin-bottom: 20px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
        }

        .vehicle-info h3 {
          margin: 0 0 8px 0;
          color: #00f5ff;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .vehicle-info .specs {
          display: flex;
          justify-content: center;
          gap: 10px;
          color: #94a3b8;
          font-size: 1rem;
        }

        /* Christmas Tree Styles */
        .christmas-tree-container {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .christmas-tree {
          background: linear-gradient(180deg, #1a1a2e, #0d0d1a);
          border: 3px solid #333;
          border-radius: 8px;
          padding: 10px 16px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 0, 0, 0.3);
        }

        .light-row {
          display: flex;
          justify-content: center;
          margin: 5px 0;
        }

        .light {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #222;
          border: 2px solid #444;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
          transition: all 0.1s ease;
        }

        .light.small {
          width: 16px;
          height: 16px;
        }

        .light.blue-on {
          background: radial-gradient(circle at 30% 30%, #7dd3fc, #0284c7);
          box-shadow: 0 0 15px #0ea5e9, 0 0 30px rgba(14, 165, 233, 0.5);
          border-color: #0ea5e9;
        }

        .light.amber-on {
          background: radial-gradient(circle at 30% 30%, #fde047, #ca8a04);
          box-shadow: 0 0 20px #eab308, 0 0 40px rgba(234, 179, 8, 0.6);
          border-color: #eab308;
        }

        .light.green-on {
          background: radial-gradient(circle at 30% 30%, #86efac, #16a34a);
          box-shadow: 0 0 25px #22c55e, 0 0 50px rgba(34, 197, 94, 0.7);
          border-color: #22c55e;
        }

        .light.red-on {
          background: radial-gradient(circle at 30% 30%, #fca5a5, #dc2626);
          box-shadow: 0 0 25px #ef4444, 0 0 50px rgba(239, 68, 68, 0.7);
          border-color: #ef4444;
        }

        .race-track {
          margin-bottom: 20px;
          background: rgba(0, 0, 0, 0.5);
          padding: 15px;
          border-radius: 8px;
          border: 1px solid rgba(0, 245, 255, 0.2);
        }

        .lane {
          position: relative;
          height: 50px;
          background: linear-gradient(90deg, #1a1a2e 0%, #2d1f3d 50%, #1a1a2e 100%);
          border: 1px solid rgba(0, 245, 255, 0.3);
          border-radius: 4px;
          overflow: visible;
        }

        .car {
          position: absolute;
          top: 50%;
          transform: translateY(-50%) scaleX(-1);
          font-size: 2rem;
          transition: left 0.05s linear;
          z-index: 2;
          filter: drop-shadow(0 0 10px rgba(0, 245, 255, 0.5));
        }

        .start-line {
          position: absolute;
          left: 0;
          top: 0;
          width: 3px;
          height: 100%;
          background: #22c55e;
          z-index: 1;
        }

        .finish-line {
          position: absolute;
          right: 0;
          top: 0;
          width: 4px;
          height: 100%;
          background: repeating-linear-gradient(
            180deg,
            white,
            white 5px,
            black 5px,
            black 10px
          );
          z-index: 1;
        }

        .distance-markers {
          position: absolute;
          bottom: -18px;
          left: 0;
          right: 0;
          height: 15px;
        }

        .marker {
          position: absolute;
          transform: translateX(-50%);
          font-size: 0.65rem;
          color: #64748b;
          text-transform: uppercase;
        }

        .game-controls {
          text-align: center;
          padding: 15px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
        }

        .btn {
          padding: 12px 24px;
          margin: 8px 5px;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          font-size: 0.9rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, #00f5ff, #ff3bd4);
          color: #000;
        }

        .btn-primary:hover {
          box-shadow: 0 0 20px rgba(0, 245, 255, 0.6);
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: rgba(100, 100, 150, 0.3);
          color: #00f5ff;
          border: 1px solid rgba(0, 245, 255, 0.5);
        }

        .btn-secondary:hover {
          background: rgba(100, 100, 150, 0.5);
        }

        .btn-react {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #000;
          padding: 18px 36px;
          font-size: 1.2rem;
          border-radius: 12px;
          letter-spacing: 2px;
        }

        .btn-react.racing {
          background: linear-gradient(135deg, #22c55e, #16a34a);
        }

        .btn-react:hover:not(:disabled) {
          box-shadow: 0 0 30px rgba(251, 191, 36, 0.8);
          transform: scale(1.05);
        }

        .btn-react:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .staging-message {
          font-size: 1.2rem;
          color: #0ea5e9;
          margin: 15px 0;
          font-weight: bold;
          animation: pulse-text 1s infinite;
        }

        .waiting-text {
          font-size: 1.3rem;
          color: #eab308;
          margin: 0 0 12px 0;
          font-weight: bold;
        }

        @keyframes pulse-text {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .react-container {
          padding: 10px;
        }

        .react-text {
          font-size: 1.8rem;
          color: #22c55e;
          margin: 0 0 12px 0;
          font-weight: bold;
          animation: flash-green 0.3s ease-out;
        }

        @keyframes flash-green {
          0% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .results {
          padding: 15px;
        }

        .results h3 {
          color: #00f5ff;
          margin-bottom: 15px;
          font-size: 1.2rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .foul-text {
          color: #ef4444;
          font-size: 1.1rem;
          margin: 20px 0;
        }

        /* Time Slip Styles */
        .time-slip {
          background: linear-gradient(135deg, #0f172a, #1e293b);
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 15px;
          font-family: 'Courier New', monospace;
        }

        .slip-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px dashed #334155;
        }

        .slip-row:last-child {
          border-bottom: none;
        }

        .slip-row .label {
          color: #94a3b8;
          font-size: 0.85rem;
        }

        .slip-row .value {
          color: #00f5ff;
          font-size: 1rem;
          font-weight: bold;
        }

        .slip-row .value.excellent {
          color: #22c55e;
        }

        .slip-row .value.good {
          color: #eab308;
        }

        .slip-row.highlight {
          background: rgba(0, 245, 255, 0.1);
          margin: 0 -15px;
          padding: 8px 15px;
          border-radius: 4px;
        }

        .slip-row.highlight .value {
          font-size: 1.1rem;
          color: #fbbf24;
        }

        .slip-divider {
          height: 1px;
          background: #475569;
          margin: 8px 0;
        }

        .button-group {
          margin-top: 20px;
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .submitted-message {
          color: #22c55e;
          font-size: 1rem;
          margin: 15px 0;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
