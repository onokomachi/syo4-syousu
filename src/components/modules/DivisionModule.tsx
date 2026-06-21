/**
 * 整数のわり算の筆算モジュール（既存シミュレーターを「小数ランド」に統合）。
 * 設定（レベル選択）→ シミュレーター の流れを内包し、結果を進捗ストアにも記録する。
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { ProblemSelector } from '../ProblemSelector';
import { DivisionSimulator } from '../DivisionSimulator';
import { generateProblem } from '../ProblemGenerator';
import { Difficulty, Problem } from '../../types';
import { progressService } from '../../services/progressService';
import { useProgressStore } from '../../store/progressStore';

interface Props {
  onExit: () => void;
}

export const DivisionModule: React.FC<Props> = ({ onExit }) => {
  const [phase, setPhase] = useState<'SETUP' | 'SIM'>('SETUP');
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [lastSettings, setLastSettings] = useState<{ diff: Difficulty; allowRemainder: boolean; masterMode: boolean } | null>(null);
  const [todayStats, setTodayStats] = useState<Record<string, number>>({});
  const recordResult = useProgressStore((s) => s.recordResult);

  useEffect(() => {
    setTodayStats(progressService.getTodayStats());
  }, [phase]);

  const handleStart = (diff: Difficulty, allowRemainder: boolean, masterMode: boolean) => {
    setCurrentProblem(generateProblem(diff, allowRemainder));
    setLastSettings({ diff, allowRemainder, masterMode });
    setPhase('SIM');
  };

  const handleFinish = (results: { isPerfect: boolean; dividend: number; divisor: number }) => {
    if (!lastSettings) return;
    progressService.recordWin(
      lastSettings.diff,
      lastSettings.allowRemainder,
      results.dividend,
      results.divisor,
      results.isPerfect,
      lastSettings.masterMode
    );
    // 「小数ランド」ハブのクリア数・連続記録用にも記録
    recordResult({
      moduleId: 'division',
      skillId: `division-${lastSettings.diff}`,
      label: `${results.dividend} ÷ ${results.divisor}`,
      correct: results.isPerfect,
    });
  };

  return (
    <div className="w-full h-full">
      <AnimatePresence mode="wait">
        {phase === 'SETUP' ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full overflow-y-auto"
          >
            <div className="max-w-3xl mx-auto px-4 py-6">
              <button
                onClick={onExit}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors mb-2"
              >
                <ChevronLeft size={24} /> 小数ランドへ
              </button>
              <h1 className="text-3xl font-black text-slate-800 text-center mb-6">わり算の筆算</h1>
              <ProblemSelector
                onStart={handleStart}
                stats={todayStats}
                initialDifficulty={lastSettings?.diff}
                initialAllowRemainder={lastSettings?.allowRemainder}
                initialMasterMode={lastSettings?.masterMode}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div key="sim" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
            {currentProblem && (
              <DivisionSimulator
                problem={currentProblem}
                onBack={() => setPhase('SETUP')}
                onFinish={handleFinish}
                isMasterMode={lastSettings?.masterMode}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
