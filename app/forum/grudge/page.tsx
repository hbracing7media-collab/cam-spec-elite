"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DragSimulator from "@/components/DragSimulator";

interface Match {
  id: string;
  challenger_id: string;
  opponent_id: string;
  match_type: "simple" | "pro";
  status: "pending" | "accepted" | "in_progress" | "completed";
  challenger_weight_lbs: number | null;
  challenger_hp: number | null;
  opponent_weight_lbs: number | null;
  opponent_hp: number | null;
  challenger_reaction_ms: number | null;
  opponent_reaction_ms: number | null;
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

  const handleFinishRace = async (reactionTime: number, raceTime: number) => {
    if (!match || !currentUser) return;

    try {
      const res = await fetch(`/api/forum/grudge/match/${match.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenger_reaction_ms:
            currentUser.id === match.challenger_id ? reactionTime : match.challenger_reaction_ms,
          opponent_reaction_ms:
            currentUser.id === match.opponent_id ? reactionTime : match.opponent_reaction_ms,
          challenger_time_ms: raceTime,
          opponent_time_ms: raceTime,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMatch(data.match);
        alert(
          `Race finished! Winner: ${data.match.winner_id === currentUser.id ? "You" : "Opponent"}`
        );
      }
    } catch (error) {
      console.error("Error finishing race:", error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  if (!currentUser) return <div>Redirecting to login...</div>;

  // Active match view
  if (match && match.status === "in_progress") {
    const isChallenger = currentUser.id === match.challenger_id;

    return (
      <div className="grudge-match-container">
        <h1>🏎️ Grudge Match</h1>

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
                    {challenge.match_type.toUpperCase()}
                  </span>
                  <span className="time-ago">
                    {new Date(challenge.created_at).toLocaleDateString()}
                  </span>
                </div>

                {challenge.match_type === "simple" && (
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
