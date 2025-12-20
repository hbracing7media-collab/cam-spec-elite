import React, { useState, useEffect } from "react";
import { AwardShowcase, Award } from "./AwardBadge";

export interface UserAwardsProfileProps {
  userId: string;
  isOwnProfile?: boolean;
}

export function UserAwardsProfile({
  userId,
  isOwnProfile = false,
}: UserAwardsProfileProps) {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total_awards: 0,
    by_type: {} as Record<string, number>,
    by_rarity: {} as Record<string, number>,
  });

  useEffect(() => {
    const fetchAwards = async () => {
      try {
        const response = await fetch(`/api/profile/awards?user_id=${userId}`);
        const data = await response.json();

        if (data.ok && data.awards) {
          setAwards(data.awards);

          // Calculate stats
          const byType: Record<string, number> = {};
          const byRarity: Record<string, number> = {};

          data.awards.forEach((award: Award) => {
            const type = award.submission_type || award.award_types?.rarity || "achievement";
            const rarity = award.award_types?.rarity || "common";

            byType[type] = (byType[type] || 0) + 1;
            byRarity[rarity] = (byRarity[rarity] || 0) + 1;
          });

          setStats({
            total_awards: data.awards.length,
            by_type: byType,
            by_rarity: byRarity,
          });
        } else {
          setError(data.message || "Failed to fetch awards");
        }
      } catch (err) {
        setError("Failed to fetch awards");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAwards();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-r from-gray-900 to-black rounded-lg border border-purple-500 border-opacity-30">
        <div className="text-center text-gray-400">Loading awards...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 rounded-lg border border-purple-500 border-opacity-50 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 px-6 py-8 text-white">
        <h2 className="text-3xl font-bold mb-2">🏆 Achievement Tokens</h2>
        <p className="text-sm opacity-90">
          Recognition for your contributions to the HB Racing community
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-black bg-opacity-40 border-b border-purple-500 border-opacity-30">
        <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-4 rounded-lg border border-purple-500 border-opacity-50">
          <div className="text-3xl font-bold text-purple-300">{stats.total_awards}</div>
          <div className="text-sm text-gray-300">Total Awards</div>
        </div>

        {Object.entries(stats.by_type).map(([type, count]) => (
          <div
            key={type}
            className="bg-gradient-to-br from-pink-900 to-pink-800 p-4 rounded-lg border border-pink-500 border-opacity-50"
          >
            <div className="text-3xl font-bold text-pink-300">{count}</div>
            <div className="text-sm text-gray-300 capitalize">{type} Submissions</div>
          </div>
        ))}

        {Object.entries(stats.by_rarity).map(([rarity, count]) => {
          const rarityColors: Record<string, string> = {
            common: "text-green-300",
            rare: "text-blue-300",
            epic: "text-purple-300",
            legendary: "text-yellow-300",
          };
          return (
            <div
              key={rarity}
              className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-4 rounded-lg border border-indigo-500 border-opacity-50"
            >
              <div className={`text-3xl font-bold ${rarityColors[rarity] || "text-white"}`}>
                {count}
              </div>
              <div className="text-sm text-gray-300 capitalize">{rarity} Tokens</div>
            </div>
          );
        })}
      </div>

      {/* Awards Display */}
      <div className="p-6">
        {error && <div className="text-sm text-red-400 mb-4">{error}</div>}

        {awards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">No achievement tokens yet!</p>
            <p className="text-gray-500 text-sm">
              Submit a camshaft or cylinder head specification to earn your first token.
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold mb-4 text-purple-300">
              ✨ Your Achievement Tokens
            </h3>
            <AwardShowcase awards={awards} size="lg" maxDisplay={12} />
          </>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 border-t border-purple-500 border-opacity-30 px-6 py-4">
        <h4 className="font-bold text-sm text-purple-200 mb-3">💡 How to Earn Tokens</h4>
        <ul className="text-sm text-gray-300 space-y-2">
          <li>✓ Submit camshaft data → 🏎️ Cam Contributor</li>
          <li>✓ Submit cylinder head data → 🔧 Head Contributor</li>
          <li>✓ Excel at dyno submissions → 🏆 Dyno King</li>
          <li>✓ Build a streak → 🔥 Submission Streak</li>
          <li>✓ Forum engagement → 🧠 Car Guru</li>
          <li>✓ Special recognition → 👑 Admin Award (manual)</li>
        </ul>
      </div>
    </div>
  );
}
