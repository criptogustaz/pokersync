// src/constants/ranks.js
// Sistema de rank tiers do Hub de Evolução.
// Curva de XP: cada nível N exige round(100 * N^1.5) XP acumulado desde o início do nível.
// Teto: nível 25.

export const RANK_TIERS = [
  { id: 'recreativo', label: 'Recreativo', minLevel: 1,  maxLevel: 3,  color: '#9CA3AF', icon: 'sprout'    },
  { id: 'amador',     label: 'Amador',     minLevel: 4,  maxLevel: 7,  color: '#3BE0D8', icon: 'user'      },
  { id: 'regular',    label: 'Regular',    minLevel: 8,  maxLevel: 11, color: '#A5FF3B', icon: 'chart-bar' },
  { id: 'grinder',    label: 'Grinder',    minLevel: 12, maxLevel: 15, color: '#FF8A3B', icon: 'flame'     },
  { id: 'tubarao',    label: 'Tubarão',    minLevel: 16, maxLevel: 19, color: '#E24B4A', icon: 'fish'      },
  { id: 'elite',      label: 'Elite',      minLevel: 20, maxLevel: 22, color: '#A855F7', icon: 'diamond'   },
  { id: 'lenda',      label: 'Lenda',      minLevel: 23, maxLevel: 25, color: '#E6C674', icon: 'crown'     },
];

export const MAX_LEVEL = 25;

export function getRankByLevel(level) {
  const lvl = Math.max(1, Math.min(MAX_LEVEL, level ?? 1));
  return RANK_TIERS.find(t => lvl >= t.minLevel && lvl <= t.maxLevel) ?? RANK_TIERS[0];
}
