import React, { useState, useEffect } from "react";
import { Award } from "./AwardBadge";

export interface AwardTagsProps {
  userId: string;
  selectedAwards: string[]; // array of user_award IDs
  onAwardsChange: (awardIds: string[]) => void;
  disabled?: boolean;
}

export function AwardTags({
  userId,
  selectedAwards,
  onAwardsChange,
  disabled = false,
}: AwardTagsProps) {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchAwards = async () => {
      try {
        const response = await fetch(`/api/profile/awards?user_id=${userId}`);
        const data = await response.json();

        if (data.ok && data.awards) {
          setAwards(data.awards);
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

  const toggleAward = (awardId: string) => {
    if (selectedAwards.includes(awardId)) {
      onAwardsChange(selectedAwards.filter((id) => id !== awardId));
    } else {
      onAwardsChange([...selectedAwards, awardId]);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading awards...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  if (awards.length === 0) {
    return <div className="text-sm text-gray-500">No awards earned yet.</div>;
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        disabled={disabled}
        className="mb-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
      >
        {expanded ? "Hide Awards" : "Tag Awards"} ({selectedAwards.length})
      </button>

      {expanded && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {awards.map((award) => {
            const awardType = award.award_types;
            if (!awardType) return null;

            const isSelected = selectedAwards.includes(award.id);

            return (
              <button
                key={award.id}
                type="button"
                onClick={() => toggleAward(award.id)}
                disabled={disabled}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                } disabled:opacity-50`}
              >
                <div className="text-2xl mb-1">{awardType.icon_emoji}</div>
                <div className="text-xs font-semibold text-center line-clamp-2">
                  {awardType.name}
                </div>
                {isSelected && (
                  <div className="mt-1 text-xs text-blue-600 font-bold">✓</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selectedAwards.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedAwards
            .map((awardId) => awards.find((a) => a.id === awardId))
            .filter(Boolean)
            .map((award) => {
              const awardType = award!.award_types;
              if (!awardType) return null;

              return (
                <div
                  key={award!.id}
                  className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{awardType.icon_emoji}</span>
                  <span>{awardType.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleAward(award!.id)}
                    disabled={disabled}
                    className="ml-1 hover:text-blue-600 disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
