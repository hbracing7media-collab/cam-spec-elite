import { useEffect, useState } from "react";
import { Award } from "@/components/AwardBadge";

interface UseUserAwardsOptions {
  userId: string;
  autoFetch?: boolean;
}

interface UseUserAwardsReturn {
  awards: Award[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  awardCount: number;
  camshaftCount: number;
  cylinderHeadCount: number;
}

/**
 * Hook for fetching and managing user awards
 * 
 * @example
 * const { awards, loading, error } = useUserAwards({ userId: "user-id-123" });
 * 
 * if (loading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 * 
 * return <AwardShowcase awards={awards} />;
 */
export function useUserAwards({
  userId,
  autoFetch = true,
}: UseUserAwardsOptions): UseUserAwardsReturn {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAwards = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/profile/awards?user_id=${userId}`);
      const data = await response.json();

      if (data.ok && data.awards) {
        setAwards(data.awards);
      } else {
        setError(data.message || "Failed to fetch awards");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch awards");
      console.error("useUserAwards error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && userId) {
      fetchAwards();
    }
  }, [userId, autoFetch]);

  const awardCount = awards.length;
  const camshaftCount = awards.filter(
    (a) => a.submission_type === "camshaft"
  ).length;
  const cylinderHeadCount = awards.filter(
    (a) => a.submission_type === "cylinder_head"
  ).length;

  return {
    awards,
    loading,
    error,
    refetch: fetchAwards,
    awardCount,
    camshaftCount,
    cylinderHeadCount,
  };
}

/**
 * Hook for managing award selection in forum posts
 * 
 * @example
 * const { selected, toggle, clear } = useAwardSelection();
 * 
 * return (
 *   <>
 *     <AwardTags userId={userId} selectedAwards={selected} onAwardsChange={setSelected} />
 *     <button onClick={clear}>Clear All</button>
 *   </>
 * );
 */
export function useAwardSelection(initialAwards: string[] = []) {
  const [selected, setSelected] = useState<string[]>(initialAwards);

  const toggle = (awardId: string) => {
    setSelected((prev) =>
      prev.includes(awardId)
        ? prev.filter((id) => id !== awardId)
        : [...prev, awardId]
    );
  };

  const clear = () => setSelected([]);

  const add = (awardId: string) => {
    setSelected((prev) =>
      prev.includes(awardId) ? prev : [...prev, awardId]
    );
  };

  const remove = (awardId: string) => {
    setSelected((prev) => prev.filter((id) => id !== awardId));
  };

  return {
    selected,
    setSelected,
    toggle,
    clear,
    add,
    remove,
    count: selected.length,
    isEmpty: selected.length === 0,
  };
}
