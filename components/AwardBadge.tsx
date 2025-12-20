import React from "react";
import Image from "next/image";

export interface Award {
  id: string;
  earned_at: string;
  submission_id?: string;
  submission_type?: string;
  award_types?: {
    id: string;
    slug: string;
    name: string;
    description?: string;
    icon_emoji?: string;
    icon_path?: string;
    badge_color?: string;
    rarity?: string;
  };
}

export interface AwardBadgeProps {
  award: Award;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onSelect?: (award: Award) => void;
}

export function AwardBadge({
  award,
  size = "md",
  interactive = false,
  onSelect,
}: AwardBadgeProps) {
  const awardType = award.award_types;

  if (!awardType) return null;

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const hasImage = awardType.icon_path && awardType.icon_path.startsWith("/");

  return (
    <div
      className={`flex flex-col items-center gap-2 ${interactive ? "cursor-pointer" : ""}`}
      onClick={() => interactive && onSelect?.(award)}
      title={`${awardType.name}: ${awardType.description}`}
    >
      {hasImage ? (
        <div
          className={`${sizeClasses[size]} relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200`}
        >
          <Image
            src={awardType.icon_path}
            alt={awardType.name}
            fill
            className="object-cover"
            sizes={
              size === "sm"
                ? "48px"
                : size === "md"
                  ? "56px"
                  : "80px"
            }
          />
        </div>
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-lg flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-shadow duration-200`}
          style={{ backgroundColor: awardType.badge_color || "#4CAF50" }}
        >
          <span className="text-center leading-none text-2xl">
            {awardType.icon_emoji}
          </span>
        </div>
      )}

      <div className="text-center">
        <div className={`${textSizes[size]} font-semibold max-w-[80px] line-clamp-2`}>
          {awardType.name}
        </div>
        {awardType.rarity && (
          <div
            className={`${textSizes[size]} capitalize font-bold opacity-75`}
            style={{
              color:
                awardType.rarity === "legendary"
                  ? "#FFD700"
                  : awardType.rarity === "epic"
                    ? "#9C27B0"
                    : awardType.rarity === "rare"
                      ? "#2196F3"
                      : "#4CAF50",
            }}
          >
            {awardType.rarity}
          </div>
        )}
      </div>

      {award.earned_at && (
        <span className="text-xs text-gray-500">
          {new Date(award.earned_at).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}

export interface AwardShowcaseProps {
  awards: Award[];
  userId?: string;
  size?: "sm" | "md" | "lg";
  maxDisplay?: number;
  canEdit?: boolean;
  onAwardSelect?: (award: Award) => void;
}

export function AwardShowcase({
  awards,
  size = "md",
  maxDisplay = 6,
  canEdit = false,
  onAwardSelect,
}: AwardShowcaseProps) {
  const displayAwards = awards.slice(0, maxDisplay);
  const hiddenCount = awards.length - displayAwards.length;

  return (
    <div className="flex flex-wrap gap-4 p-6 bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 rounded-lg border border-purple-500 border-opacity-30">
      {displayAwards.length === 0 ? (
        <p className="text-gray-400 text-sm w-full">No awards yet.</p>
      ) : (
        <>
          {displayAwards.map((award) => (
            <AwardBadge
              key={award.id}
              award={award}
              size={size}
              interactive={canEdit}
              onSelect={onAwardSelect}
            />
          ))}
          {hiddenCount > 0 && (
            <div
              className={`${
                size === "sm" ? "w-12 h-12" : size === "md" ? "w-14 h-14" : "w-20 h-20"
              } rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold shadow-lg`}
            >
              +{hiddenCount}
            </div>
          )}
        </>
      )}
    </div>
  );
}
