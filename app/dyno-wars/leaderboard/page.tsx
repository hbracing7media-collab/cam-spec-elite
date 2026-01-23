"use client";

import { useEffect, useState } from "react";
import { getSupabaseInstance } from "@/lib/supabaseSingleton";

interface DynoEntry {
  id: string;
  user_id: string;
  engine_name: string;
  engine_make: string;
  engine_family: string;
  horsepower: number;
  torque: number;
  username: string;
  rank: number;
  created_at: string;
}

export default function DynoLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<DynoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const supabase = getSupabaseInstance();

        const { data, error } = await supabase
          .from("dyno_leaderboard")
          .select("*")
          .order("rank", { ascending: true });

        if (error) {
          setError(error.message);
          return;
        }

        setLeaderboard(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Dyno Wars Leaderboard</h1>
          <div className="text-center text-gray-400">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Dyno Wars Leaderboard</h1>
          <div className="text-center text-red-400">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Dyno Wars Leaderboard</h1>
          <div className="text-center text-gray-400">
            No dyno submissions yet. Be the first to submit!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Dyno Wars Leaderboard</h1>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-700 text-white border-b-2 border-cyan-400">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Engine Name</th>
                <th className="px-4 py-3">Make / Family</th>
                <th className="px-4 py-3">Horsepower</th>
                <th className="px-4 py-3">Torque</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={`border-b border-gray-700 hover:bg-gray-700/50 transition ${
                    index === 0 ? "bg-yellow-900/20" : index === 1 ? "bg-gray-500/20" : index === 2 ? "bg-orange-900/20" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-bold">
                    {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                  </td>
                  <td className="px-4 py-3">{entry.username || "Anonymous"}</td>
                  <td className="px-4 py-3 font-semibold text-cyan-400">{entry.engine_name}</td>
                  <td className="px-4 py-3">
                    {entry.engine_make} {entry.engine_family}
                  </td>
                  <td className="px-4 py-3 font-bold text-green-400">{entry.horsepower} HP</td>
                  <td className="px-4 py-3">{entry.torque} lb-ft</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
