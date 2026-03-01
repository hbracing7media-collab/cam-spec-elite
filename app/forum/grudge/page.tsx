"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import DragSimulator, { TimeSlip } from "@/components/DragSimulator";
import RollRaceSimulator, { RollTimeSlip } from "@/components/RollRaceSimulator";

interface Match {
  id: string;
  challenger_id: string;
  opponent_id: string;
  match_type: "simple" | "pro" | "roll-60-130";
  status: "pending" | "accepted" | "in_progress" | "waiting_opponent" | "completed";
  challenger_weight_lbs: number | null;
  challenger_hp: number | null;
  opponent_weight_lbs: number | null;
  opponent_hp: number | null;
  challenger_reaction_ms: number | null;
  opponent_reaction_ms: number | null;
  challenger_sixty_ft: number | null;
  challenger_eighth_et: number | null;
  challenger_eighth_mph: number | null;
  challenger_quarter_et: number | null;
  challenger_quarter_mph: number | null;
  opponent_sixty_ft: number | null;
  opponent_eighth_et: number | null;
  opponent_eighth_mph: number | null;
  opponent_quarter_et: number | null;
  opponent_quarter_mph: number | null;
  // Roll race specific fields
  challenger_roll_sixty_to_hundred: number | null;
  challenger_roll_hundred_to_one_twenty: number | null;
  challenger_roll_one_twenty_to_one_thirty: number | null;
  challenger_roll_total: number | null;
  opponent_roll_sixty_to_hundred: number | null;
  opponent_roll_hundred_to_one_twenty: number | null;
  opponent_roll_one_twenty_to_one_thirty: number | null;
  opponent_roll_total: number | null;
  winner_id: string | null;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  user_metadata?: {
    display_name?: string;
  };
}

function GrudgeMatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const matchId = searchParams.get("match");

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingChallenges, setPendingChallenges] = useState<Match[]>([]);
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setCurrentUser(data.user);

        // Fetch matches
        await fetchMatches(data.user.id);

        // If specific match in query
        if (matchId) {
          await fetchMatch(matchId);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [matchId, router]);

  const fetchMatches = async (userId: string) => {
    try {
      const res = await fetch(`/api/forum/grudge/challenge?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPendingChallenges(data.pendingChallenges || []);
        setActiveMatches(data.activeMatches || []);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
  };

  const fetchMatch = async (id: string) => {
    try {
      const res = await fetch(`/api/forum/grudge/match/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMatch(data.match);
      }
    } catch (error) {
      console.error("Error fetching match:", error);
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      const res = await fetch("/api/forum/grudge/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: challengeId }),
      });

      if (res.ok) {
        const data = await res.json();
        setMatch(data.match);
        setPendingChallenges(
          pendingChallenges.filter((m) => m.id !== challengeId)
        );
        setActiveMatches([...activeMatches, data.match]);
      }
    } catch (error) {
      console.error("Error accepting challenge:", error);
    }
  };

  const handleFinishRace = async (timeSlip: TimeSlip) => {
    if (!match || !currentUser) return;

    const isChallenger = currentUser.id === match.challenger_id;

    try {
      const res = await fetch(`/api/forum/grudge/match/${match.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_role: isChallenger ? "challenger" : "opponent",
          time_slip: {
            reaction_time: timeSlip.reactionTime,
            sixty_foot: timeSlip.sixtyFoot,
            eighth_et: timeSlip.eighthET,
            eighth_mph: timeSlip.eighthMPH,
            quarter_et: timeSlip.quarterET,
            quarter_mph: timeSlip.quarterMPH,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMatch(data.match);
        
        if (data.match.status === "completed") {
          alert(
            `Race finished! Winner: ${data.match.winner_id === currentUser.id ? "You" : "Opponent"}`
          );
        } else {
          alert("Results submitted! Waiting for opponent to complete their run.");
        }
      }
    } catch (error) {
      console.error("Error finishing race:", error);
    }
  };

  const handleFinishRollRace = async (timeSlip: RollTimeSlip) => {
    if (!match || !currentUser) return;

    const isChallenger = currentUser.id === match.challenger_id;

    try {
      const res = await fetch(`/api/forum/grudge/match/${match.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_role: isChallenger ? "challenger" : "opponent",
          match_type: "roll-60-130",
          roll_slip: {
            reaction_time: timeSlip.reactionTime,
            sixty_to_hundred: timeSlip.sixtyToHundred,
            hundred_to_one_twenty: timeSlip.hundredToOneTwenty,
            one_twenty_to_one_thirty: timeSlip.oneTwentyToOneThirty,
            total_time: timeSlip.totalTime,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMatch(data.match);
        
        if (data.match.status === "completed") {
          alert(
            `Race finished! Winner: ${data.match.winner_id === currentUser.id ? "You" : "Opponent"}`
          );
        } else {
          alert("Results submitted! Waiting for opponent to complete their run.");
        }
      }
    } catch (error) {
      console.error("Error finishing roll race:", error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  if (!currentUser) return <div>Redirecting to login...</div>;

  // Check if user needs to run their pass
  const isChallenger = match ? currentUser.id === match.challenger_id : false;
  const userHasSubmitted = match ? (
    isChallenger 
      ? (match.match_type === "roll-60-130" ? match.challenger_roll_total !== null : match.challenger_reaction_ms !== null)
      : (match.match_type === "roll-60-130" ? match.opponent_roll_total !== null : match.opponent_reaction_ms !== null)
  ) : false;

  // Active match view - show simulator if match is active and user hasn't submitted yet
  if (match && (match.status === "in_progress" || match.status === "waiting_opponent") && !userHasSubmitted) {
    return (
      <div className="grudge-match-container">
        <h1>{match.match_type === "roll-60-130" ? "🚀 60-130 Roll Race" : "🏎️ Grudge Match"}</h1>

        {match.match_type === "roll-60-130" ? (
          <RollRaceSimulator
            matchId={match.id}
            userRole={isChallenger ? "challenger" : "opponent"}
            challenger={{
              name: "Challenger",
              weight_lbs: match.challenger_weight_lbs || 3500,
              hp: match.challenger_hp || 500,
            }}
            opponent={{
              name: "Opponent",
              weight_lbs: match.opponent_weight_lbs || 3500,
              hp: match.opponent_hp || 500,
            }}
            onFinish={handleFinishRollRace}
          />
        ) : (
          <DragSimulator
            matchId={match.id}
            userRole={isChallenger ? "challenger" : "opponent"}
            challenger={{
              name: "Challenger",
              weight_lbs: match.challenger_weight_lbs || 3500,
              hp: match.challenger_hp || 500,
            }}
            opponent={{
              name: "Opponent",
              weight_lbs: match.opponent_weight_lbs || 3500,
              hp: match.opponent_hp || 500,
            }}
            onFinish={handleFinishRace}
          />
        )}

        <button
          onClick={() => {
            setMatch(null);
            router.push("/forum/grudge");
          }}
          className="btn btn-secondary"
        >
          Back to Challenges
        </button>
      </div>
    );
  }

  // Waiting for opponent view - user has submitted but opponent hasn't
  if (match && match.status === "waiting_opponent" && userHasSubmitted) {
    const isRollRace = match.match_type === "roll-60-130";
    
    return (
      <div className="grudge-match-container">
        <h1>🏎️ Grudge Match</h1>
        <div className="waiting-panel">
          <h2>✅ Results Submitted!</h2>
          <p>Waiting for your opponent to complete their run...</p>
          <div className="your-slip">
            <h3>Your Time Slip</h3>
            {isRollRace ? (
              <div className="slip-data">
                <div className="slip-row">
                  <span>R/T</span>
                  <span>{((isChallenger ? match.challenger_reaction_ms : match.opponent_reaction_ms) / 1000).toFixed(3)}</span>
                </div>
                <div className="slip-row">
                  <span>60-100</span>
                  <span>{(isChallenger ? match.challenger_roll_sixty_to_hundred : match.opponent_roll_sixty_to_hundred)?.toFixed(3) || "---"}</span>
                </div>
                <div className="slip-row">
                  <span>100-120</span>
                  <span>{(isChallenger ? match.challenger_roll_hundred_to_one_twenty : match.opponent_roll_hundred_to_one_twenty)?.toFixed(3) || "---"}</span>
                </div>
                <div className="slip-row">
                  <span>120-130</span>
                  <span>{(isChallenger ? match.challenger_roll_one_twenty_to_one_thirty : match.opponent_roll_one_twenty_to_one_thirty)?.toFixed(3) || "---"}</span>
                </div>
                <div className="slip-row highlight">
                  <span>60-130 Total</span>
                  <span>{(isChallenger ? match.challenger_roll_total : match.opponent_roll_total)?.toFixed(3) || "---"}</span>
                </div>
              </div>
            ) : (
              <div className="slip-data">
                <div className="slip-row">
                  <span>R/T</span>
                  <span>{((isChallenger ? match.challenger_reaction_ms : match.opponent_reaction_ms) / 1000).toFixed(3)}</span>
                </div>
                <div className="slip-row">
                  <span>60&apos;</span>
                  <span>{(isChallenger ? match.challenger_sixty_ft : match.opponent_sixty_ft)?.toFixed(3) || "---"}</span>
                </div>
                <div className="slip-row">
                  <span>1/8 ET</span>
                  <span>{(isChallenger ? match.challenger_eighth_et : match.opponent_eighth_et)?.toFixed(3) || "---"}</span>
                </div>
                <div className="slip-row">
                  <span>1/8 MPH</span>
                  <span>{(isChallenger ? match.challenger_eighth_mph : match.opponent_eighth_mph)?.toFixed(2) || "---"}</span>
                </div>
                <div className="slip-row highlight">
                  <span>1/4 ET</span>
                  <span>{(isChallenger ? match.challenger_quarter_et : match.opponent_quarter_et)?.toFixed(3) || "---"}</span>
                </div>
                <div className="slip-row highlight">
                  <span>1/4 MPH</span>
                  <span>{(isChallenger ? match.challenger_quarter_mph : match.opponent_quarter_mph)?.toFixed(2) || "---"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            setMatch(null);
            router.push("/forum/grudge");
          }}
          className="btn btn-secondary"
        >
          Back to Challenges
        </button>
      </div>
    );
  }

  // Main grudge match hub
  return (
    <div className="grudge-match-hub">
      <h1>🏎️ Grudge Match Central</h1>

      {/* Pending Challenges */}
      <section className="challenges-section">
        <h2>Incoming Challenges ({pendingChallenges.length})</h2>

        {pendingChallenges.length === 0 ? (
          <p className="empty-message">No pending challenges. Challenge someone!</p>
        ) : (
          <div className="challenges-grid">
            {pendingChallenges.map((challenge) => (
              <div key={challenge.id} className="challenge-card">
                <div className="card-header">
                  <span className={`badge ${challenge.match_type}`}>
                    {challenge.match_type === "roll-60-130" ? "60-130 ROLL" : challenge.match_type.toUpperCase()}
                  </span>
                  <span className="time-ago">
                    {new Date(challenge.created_at).toLocaleDateString()}
                  </span>
                </div>

                {(challenge.match_type === "simple" || challenge.match_type === "roll-60-130") && (
                  <div className="vehicle-specs">
                    <div className="spec">
                      <p className="label">Their Vehicle:</p>
                      <p className="value">{challenge.challenger_weight_lbs} lbs</p>
                      <p className="value">{challenge.challenger_hp} hp</p>
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  onClick={() => handleAcceptChallenge(challenge.id)}
                >
                  Accept Challenge
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Matches */}
      <section className="matches-section">
        <h2>Active Matches ({activeMatches.length})</h2>

        {activeMatches.length === 0 ? (
          <p className="empty-message">No active matches. Start racing!</p>
        ) : (
          <div className="matches-grid">
            {activeMatches.map((activeMatch) => (
              <div key={activeMatch.id} className="match-card">
                <div className="match-status">
                  <span className="status-badge">{activeMatch.status.toUpperCase()}</span>
                </div>

                {activeMatch.status === "in_progress" && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setMatch(activeMatch);
                    }}
                  >
                    Join Race
                  </button>
                )}

                {activeMatch.status === "completed" && (
                  <div className="race-results">
                    <p>
                      <strong>Winner:</strong>{" "}
                      {activeMatch.winner_id === currentUser.id ? "You! 🎉" : "Opponent"}
                    </p>
                    <p>
                      Your Reaction: <strong>{activeMatch.challenger_reaction_ms || activeMatch.opponent_reaction_ms}ms</strong>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <style jsx>{`
        .grudge-match-hub {
          max-width: 1000px;
          margin: 0 auto;
          padding: 30px 20px;
        }

        .grudge-match-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 30px 20px;
          text-align: center;
        }

        h1 {
          color: #00f5ff;
          text-align: center;
          margin-bottom: 40px;
          font-size: 2.5rem;
          text-shadow: 0 0 20px rgba(0, 245, 255, 0.5);
        }

        h2 {
          color: #ff3bd4;
          margin-top: 40px;
          margin-bottom: 20px;
          font-size: 1.5rem;
        }

        .challenges-section,
        .matches-section {
          margin-bottom: 50px;
        }

        .empty-message {
          color: #aaa;
          text-align: center;
          padding: 30px;
          font-style: italic;
        }

        .challenges-grid,
        .matches-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .challenge-card,
        .match-card {
          background: linear-gradient(135deg, rgba(10, 10, 20, 0.6), rgba(20, 10, 40, 0.6));
          border: 2px solid rgba(0, 245, 255, 0.3);
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s ease;
        }

        .challenge-card:hover,
        .match-card:hover {
          border-color: rgba(255, 59, 212, 0.6);
          box-shadow: 0 0 20px rgba(0, 245, 255, 0.2);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .badge {
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: bold;
          text-transform: uppercase;
        }

        .badge.simple {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
        }

        .badge.pro {
          background: rgba(255, 59, 212, 0.2);
          color: #ff3bd4;
        }

        .badge.roll-60-130 {
          background: rgba(255, 140, 0, 0.2);
          color: #ff8c00;
        }

        .time-ago {
          color: #aaa;
          font-size: 0.9rem;
        }

        .vehicle-specs {
          margin: 15px 0;
          padding: 15px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
        }

        .spec {
          text-align: left;
        }

        .spec .label {
          color: #00f5ff;
          font-size: 0.9rem;
          margin: 5px 0 0 0;
        }

        .spec .value {
          color: #aaa;
          margin: 3px 0;
        }

        .match-status {
          margin-bottom: 15px;
        }

        .status-badge {
          padding: 8px 15px;
          background: rgba(0, 245, 255, 0.15);
          color: #00f5ff;
          border-radius: 6px;
          font-weight: bold;
          font-size: 0.85rem;
        }

        .race-results {
          background: rgba(0, 0, 0, 0.3);
          padding: 15px;
          border-radius: 8px;
          text-align: left;
        }

        .race-results p {
          color: #aaa;
          margin: 8px 0;
        }

        .race-results strong {
          color: #00ff88;
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
          width: 100%;
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

        .loading {
          text-align: center;
          padding: 40px;
          color: #00f5ff;
          font-size: 1.2rem;
        }

        .waiting-panel {
          background: linear-gradient(135deg, rgba(10, 10, 20, 0.95), rgba(20, 10, 40, 0.95));
          border: 2px solid rgba(34, 197, 94, 0.4);
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          margin: 20px 0;
        }

        .waiting-panel h2 {
          color: #22c55e;
          margin-bottom: 10px;
        }

        .waiting-panel p {
          color: #94a3b8;
          margin-bottom: 20px;
        }

        .your-slip {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 20px;
          max-width: 300px;
          margin: 0 auto;
        }

        .your-slip h3 {
          color: #00f5ff;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 15px;
        }

        .slip-data {
          font-family: 'Courier New', monospace;
        }

        .slip-data .slip-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px dashed #334155;
          color: #e2e8f0;
        }

        .slip-data .slip-row span:first-child {
          color: #94a3b8;
        }

        .slip-data .slip-row.highlight {
          background: rgba(0, 245, 255, 0.1);
          margin: 0 -10px;
          padding: 8px 10px;
          border-radius: 4px;
        }

        .slip-data .slip-row.highlight span:last-child {
          color: #fbbf24;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}

export default function GrudgeMatchPage() {
  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <GrudgeMatchContent />
    </Suspense>
  );
}
