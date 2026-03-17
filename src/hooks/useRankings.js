import { useMemo } from 'react';

/**
 * Calcule le classement des membres d'un tournoi.
 * Utilise des Maps pour des lookups O(1) au lieu de O(n²).
 */
export function useRankings(members, profiles, bets) {
  const profileMap = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles]
  );

  const pointsByUser = useMemo(() => {
    const map = new Map();
    for (const b of bets) {
      map.set(b.user_id, (map.get(b.user_id) || 0) + (parseFloat(b.points_won) || 0));
    }
    return map;
  }, [bets]);

  return useMemo(
    () =>
      members
        .map((m) => {
          const profile = profileMap.get(m.user_id);
          return {
            userId: m.user_id,
            username: profile?.username || '?',
            avatar: profile?.avatar || null,
            points: pointsByUser.get(m.user_id) || 0,
          };
        })
        .sort((a, b) => b.points - a.points),
    [members, profileMap, pointsByUser]
  );
}
