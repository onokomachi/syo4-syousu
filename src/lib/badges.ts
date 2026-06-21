/**
 * ごほうびバッジ。進捗データから「獲得済み/未獲得」を計算する純粋関数。
 * 資料: バッジ等の報酬で学習意欲・自信を持続させ、算数不安を下げる（GBLE）。
 */
import { MODULES } from '../constants';

export interface BadgeData {
  totalCorrect: number;
  maxStreak: number;
  moduleCounts: Record<string, number>;
}

export interface Badge {
  id: string;
  title: string;
  desc: string;
  icon: string; // lucide アイコン名
  earned: boolean;
}

export function computeBadges(d: BadgeData): Badge[] {
  const list: Badge[] = [
    { id: 'first', title: 'はじめの一歩', desc: '1問 クリア', icon: 'Star', earned: d.totalCorrect >= 1 },
    { id: 't20', title: 'がんばり20', desc: '累計20問 クリア', icon: 'Sparkles', earned: d.totalCorrect >= 20 },
    { id: 't50', title: 'がんばり50', desc: '累計50問 クリア', icon: 'Award', earned: d.totalCorrect >= 50 },
    { id: 't100', title: 'がんばり100', desc: '累計100問 クリア', icon: 'Trophy', earned: d.totalCorrect >= 100 },
    { id: 's5', title: 'ノーミス5', desc: '5問連続 ノーミス', icon: 'Flame', earned: d.maxStreak >= 5 },
    { id: 's10', title: 'ノーミス10', desc: '10問連続 ノーミス', icon: 'Crown', earned: d.maxStreak >= 10 },
  ];
  MODULES.forEach((m) =>
    list.push({
      id: `m-${m.id}`,
      title: `${m.title} デビュー`,
      desc: 'はじめて クリア',
      icon: m.icon,
      earned: (d.moduleCounts[m.id] || 0) >= 1,
    })
  );
  return list;
}
