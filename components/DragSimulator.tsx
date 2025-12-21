"use client";

import React, { useState, useEffect, useRef } from "react";

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
  onFinish: (reactionTime: number, raceTime: number) => void;
}

export default function DragSimulator({
  matchId,
  userRole,
  challenger,
  opponent,
  onFinish,
}: DragSimulatorProps) {
  const [gameState, setGameState] = useState<"ready" | "waiting" | "racing" | "finished">(
    "ready"
  );
  const [countDown, setCountDown] = useState(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [raceTime, setRaceTime] = useState<number | null>(null);
  const [progressChallenger, setProgressChallenger] = useState(0);
  const [progressOpponent, setProgressOpponent] = useState(0);

  const reactionStartRef = useRef<number | null>(null);
  const raceStartRef = useRef<number | null>(null);
  const raceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countDownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasReactedRef = useRef(false);

  // Calculate ET (elapsed time) and 0-60 performance
  const calculatePerformance = (weight_lbs: number, hp: number) => {
    const weightKg = weight_lbs / 2.205;
    const hpPerKg = hp / weightKg;
    const et = 1 / (hpPerKg * 0.0001); // Simplified ET calculation
    return { et, hpPerKg };
  };

  const handleStart = () => {
    setGameState("waiting");
    reactionStartRef.current = Date.now();
    hasReactedRef.current = false;

    // Random delay between 1-4 seconds before "GO"
    const delay = Math.random() * 3000 + 1000;

    setTimeout(() => {
      setCountDown(0);
      setGameState("racing");
      raceStartRef.current = Date.now();

      // Start race animation
      raceIntervalRef.current = setInterval(() => {
        setProgressChallenger((prev) => {
          if (prev >= 100) {
            clearInterval(raceIntervalRef.current!);
            return 100;
          }
          return prev + Math.random() * 15;
        });

        setProgressOpponent((prev) => {
          if (prev >= 100) {
            clearInterval(raceIntervalRef.current!);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 100);
    }, delay);
  };

  const handleReact = () => {
    if (gameState !== "racing" || hasReactedRef.current) return;

    hasReactedRef.current = true;
    const reactTime = Date.now() - (reactionStartRef.current || 0);
    setReactionTime(reactTime);

    // Simulate finish after 4-6 seconds of racing
    setTimeout(() => {
      const finalRaceTime = Date.now() - (raceStartRef.current || 0);
      setRaceTime(finalRaceTime);
      setGameState("finished");
      setProgressChallenger(100);
      setProgressOpponent(100);

      if (raceIntervalRef.current) {
        clearInterval(raceIntervalRef.current);
      }
    }, 4000 + Math.random() * 2000);
  };

  const handleSubmitResults = async () => {
    if (!reactionTime || !raceTime) return;

    try {
      // This will be called with both players' reaction times
      onFinish(reactionTime, raceTime);
    } catch (error) {
      console.error("Error submitting results:", error);
    }
  };

  const handleReset = () => {
    setGameState("ready");
    setCountDown(0);
    setReactionTime(null);
    setRaceTime(null);
    setProgressChallenger(0);
    setProgressOpponent(0);
    hasReactedRef.current = false;
    if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
    if (countDownIntervalRef.current) clearInterval(countDownIntervalRef.current);
  };

  return (
    <div className="drag-simulator">
      {/* Vehicle Info */}
      <div className="vehicles-info">
        <div className="vehicle-spec">
          <h3>{challenger.name}</h3>
          <p>{challenger.weight_lbs} lbs</p>
          <p>{challenger.hp} hp</p>
        </div>
        <div className="vs">VS</div>
        <div className="vehicle-spec">
          <h3>{opponent.name}</h3>
          <p>{opponent.weight_lbs} lbs</p>
          <p>{opponent.hp} hp</p>
        </div>
      </div>

      {/* Race Track */}
      <div className="race-track">
        <div className="lane">
          <div className="car challenger-car" style={{ left: `${progressChallenger}%` }}>
            🏎️
          </div>
          <div className="finish-line" />
        </div>

        <div className="lane">
          <div className="car opponent-car" style={{ left: `${progressOpponent}%` }}>
            🏎️
          </div>
          <div className="finish-line" />
        </div>
      </div>

      {/* Game Controls & Info */}
      <div className="game-controls">
        {gameState === "ready" && (
          <button className="btn btn-primary" onClick={handleStart}>
            Start Race
          </button>
        )}

        {gameState === "waiting" && (
          <div className="waiting-message">
            Wait for the light... <span className="blink">●</span>
          </div>
        )}

        {gameState === "racing" && (
          <div className="react-container">
            <p className="react-text">🚦 GO!</p>
            <button
              className="btn btn-react"
              onClick={handleReact}
              disabled={reactionTime !== null}
            >
              {reactionTime ? `Reacted: ${reactionTime}ms` : "Click to React!"}
            </button>
          </div>
        )}

        {gameState === "finished" && (
          <div className="results">
            <h3>Race Finished!</h3>
            {reactionTime && (
              <p className="reaction-result">
                Your Reaction Time: <strong>{reactionTime}ms</strong>
              </p>
            )}
            {raceTime && (
              <p className="race-result">
                Total Time: <strong>{(raceTime / 1000).toFixed(2)}s</strong>
              </p>
            )}
            <div className="button-group">
              <button className="btn btn-primary" onClick={handleSubmitResults}>
                Submit Results
              </button>
              <button className="btn btn-secondary" onClick={handleReset}>
                Run Again
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .drag-simulator {
          width: 100%;
          max-width: 600px;
          padding: 20px;
          background: linear-gradient(135deg, rgba(10, 10, 20, 0.8), rgba(20, 10, 40, 0.8));
          border: 2px solid rgba(0, 245, 255, 0.4);
          border-radius: 12px;
          margin: 20px auto;
        }

        .vehicles-info {
          display: flex;
          justify-content: space-around;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
          padding: 15px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
        }

        .vehicle-spec {
          text-align: center;
          flex: 1;
        }

        .vehicle-spec h3 {
          margin: 0 0 8px 0;
          color: #00f5ff;
          font-size: 1rem;
        }

        .vehicle-spec p {
          margin: 4px 0;
          color: #aaa;
          font-size: 0.9rem;
        }

        .vs {
          color: #ff3bd4;
          font-weight: bold;
          font-size: 1.2rem;
        }

        .race-track {
          margin-bottom: 30px;
          background: rgba(0, 0, 0, 0.5);
          padding: 20px;
          border-radius: 8px;
          border: 1px solid rgba(0, 245, 255, 0.2);
        }

        .lane {
          position: relative;
          height: 60px;
          margin-bottom: 20px;
          background: linear-gradient(90deg, rgba(0, 245, 255, 0.05), rgba(255, 59, 212, 0.05));
          border: 1px solid rgba(0, 245, 255, 0.3);
          border-radius: 4px;
          overflow: hidden;
        }

        .lane:last-child {
          margin-bottom: 0;
        }

        .car {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          font-size: 2rem;
          transition: left 0.1s linear;
          z-index: 2;
        }

        .finish-line {
          position: absolute;
          right: 0;
          top: 0;
          width: 3px;
          height: 100%;
          background: repeating-linear-gradient(
            180deg,
            #ff3bd4,
            #ff3bd4 10px,
            white 10px,
            white 20px
          );
          z-index: 1;
        }

        .game-controls {
          text-align: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
        }

        .btn {
          padding: 10px 20px;
          margin: 10px 5px;
          border: none;
          border-radius: 6px;
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
          box-shadow: 0 0 15px rgba(0, 245, 255, 0.3);
        }

        .btn-react {
          background: linear-gradient(135deg, #00f5ff, #00ff88);
          color: #000;
          padding: 15px 30px;
          font-size: 1.1rem;
        }

        .btn-react:hover:not(:disabled) {
          box-shadow: 0 0 30px rgba(0, 255, 136, 0.8);
          transform: scale(1.05);
        }

        .btn-react:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .waiting-message {
          font-size: 1.2rem;
          color: #ffaa00;
          margin: 20px 0;
          font-weight: bold;
        }

        .blink {
          animation: blink 1s infinite;
          color: #ff3bd4;
        }

        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }

        .react-container {
          padding: 20px;
        }

        .react-text {
          font-size: 2.5rem;
          color: #00ff88;
          margin: 0 0 10px 0;
          font-weight: bold;
          animation: pulse 0.5s ease-out;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.2);
            opacity: 0.7;
          }
        }

        .results {
          padding: 20px;
        }

        .results h3 {
          color: #00f5ff;
          margin-bottom: 15px;
        }

        .reaction-result,
        .race-result {
          font-size: 1.1rem;
          color: #aaa;
          margin: 10px 0;
        }

        .reaction-result strong,
        .race-result strong {
          color: #00ff88;
          font-size: 1.3rem;
        }

        .button-group {
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}
