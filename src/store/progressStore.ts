/**
 * モジュール横断の学習進捗。スキル別の習熟度（正答率）を保持し、
 * 適応難易度（資料: BKT の簡易版, エビレベルI）や「がくしゅうのきろく」に使う。
 * 保存先は progressRepository 経由で差し替え可能。
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getProgressStorage } from '../services/progressRepository';

export type ModuleId =
  | 'decimal-addsub'
  | 'decimal-muldiv'
  | 'error-hunter'
  | 'number-line'
  | 'place-value'
  | 'word-problem';

export interface ResultRecord {
  id: string;
  ts: number;
  moduleId: ModuleId;
  skillId: string; // 例: 'addsub-diff-digits', 'compare', 'muldiv-remainder'
  label: string; // 履歴表示用（例: "3.5 + 4.18"）
  correct: boolean; // ノーミスで完答できたか
}

export interface SkillMastery {
  attempts: number;
  corrects: number;
}

interface ProgressState {
  logs: ResultRecord[];
  mastery: Record<string, SkillMastery>;
  currentStreak: number;
  maxStreak: number;
  dailyGoal: number;
  recordResult: (rec: Omit<ResultRecord, 'id' | 'ts'>) => void;
  getMastery: (skillId: string) => number; // 0..1（試行なしは 0）
  getModuleCount: (moduleId: ModuleId) => number;
  getTodayCount: () => number; // きょう 正解した数
  setDailyGoal: (n: number) => void;
  reset: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      logs: [],
      mastery: {},
      currentStreak: 0,
      maxStreak: 0,
      dailyGoal: 10,

      recordResult: (rec) => {
        set((state) => {
          const entry: ResultRecord = {
            ...rec,
            id: crypto.randomUUID(),
            ts: Date.now(),
          };
          const logs = [entry, ...state.logs].slice(0, 200);

          const prev = state.mastery[rec.skillId] ?? { attempts: 0, corrects: 0 };
          const mastery = {
            ...state.mastery,
            [rec.skillId]: {
              attempts: prev.attempts + 1,
              corrects: prev.corrects + (rec.correct ? 1 : 0),
            },
          };

          const currentStreak = rec.correct ? state.currentStreak + 1 : 0;
          const maxStreak = Math.max(state.maxStreak, currentStreak);

          return { logs, mastery, currentStreak, maxStreak };
        });
      },

      getMastery: (skillId) => {
        const m = get().mastery[skillId];
        if (!m || m.attempts === 0) return 0;
        return m.corrects / m.attempts;
      },

      getModuleCount: (moduleId) =>
        get().logs.filter((l) => l.moduleId === moduleId && l.correct).length,

      getTodayCount: () => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const t = start.getTime();
        return get().logs.filter((l) => l.ts >= t && l.correct).length;
      },

      setDailyGoal: (n) => set({ dailyGoal: n }),

      reset: () => set({ logs: [], mastery: {}, currentStreak: 0, maxStreak: 0 }),
    }),
    {
      name: 'syousu_progress_v1',
      storage: createJSONStorage(() => getProgressStorage()),
    }
  )
);
