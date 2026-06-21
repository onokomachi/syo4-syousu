/**
 * ホーム＝「小数ランド」。モジュールをカードで選ぶ。
 * 視覚的混沌を避けるため、余白を広く・1カード1テーマに。
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Divide, PlusSquare, X, Ruler, LayoutGrid, Search, BookOpen,
  History, Settings as SettingsIcon, Lock, Volume2,
} from 'lucide-react';
import { MODULES, ModuleMeta } from '../constants';
import { ModuleId, useProgressStore } from '../store/progressStore';
import { Settings } from './Settings';
import { speak } from '../lib/speech';
import { useSettingsStore } from '../store/settingsStore';
import { Mascot } from './ui/Mascot';
import { GoalRing } from './ui/GoalRing';

interface Props {
  onSelectModule: (id: ModuleId) => void;
  onOpenLog: () => void;
}

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Divide, PlusSquare, X, Ruler, LayoutGrid, Search, BookOpen,
};

// Tailwind がパージしないよう静的に定義
const ACCENT: Record<string, { bg: string; text: string; ring: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'group-hover:ring-blue-300' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'group-hover:ring-emerald-300' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'group-hover:ring-violet-300' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'group-hover:ring-amber-300' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'group-hover:ring-rose-300' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', ring: 'group-hover:ring-cyan-300' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', ring: 'group-hover:ring-teal-300' },
};

const ModuleCard: React.FC<{ m: ModuleMeta; onClick: () => void; cleared: number }> = ({ m, onClick, cleared }) => {
  const ttsEnabled = useSettingsStore((s) => s.ttsEnabled);
  const Icon = ICONS[m.icon] ?? Divide;
  const accent = ACCENT[m.accent] ?? ACCENT.blue;
  const isReady = m.status === 'ready';

  return (
    <motion.button
      whileHover={isReady ? { y: -4 } : undefined}
      whileTap={isReady ? { scale: 0.98 } : undefined}
      onClick={() => {
        if (!isReady) return;
        if (ttsEnabled) speak(m.title);
        onClick();
      }}
      className={`group relative text-left p-6 rounded-[28px] bg-surface border border-line shadow-sm ring-2 ring-transparent transition-all ${
        isReady ? `hover:shadow-lg ${accent.ring} cursor-pointer` : 'opacity-60 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-16 h-16 rounded-2xl ${accent.bg} ${accent.text} flex items-center justify-center`}>
          <Icon size={32} />
        </div>
        {!isReady && (
          <span className="flex items-center gap-1 bg-surface-3 text-faint px-3 py-1 rounded-full text-xs font-black">
            <Lock size={14} /> じゅんびちゅう
          </span>
        )}
        {isReady && cleared > 0 && (
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black ring-1 ring-amber-200">
            クリア {cleared}
          </span>
        )}
      </div>
      <h3 className="text-xl font-black text-content mb-1">{m.title}</h3>
      <p className="text-sm text-muted font-medium">{m.description}</p>
    </motion.button>
  );
};

export const Hub: React.FC<Props> = ({ onSelectModule, onOpenLog }) => {
  const [showSettings, setShowSettings] = useState(false);
  const getModuleCount = useProgressStore((s) => s.getModuleCount);

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* トップバー */}
        <div className="flex justify-between items-center gap-3 mb-2">
          <GoalRing />
          <div className="flex gap-3">
          <button
            onClick={onOpenLog}
            className="flex items-center gap-2 bg-surface px-5 py-2.5 rounded-full shadow-sm border border-line text-muted font-bold hover:bg-surface-2 transition-all"
          >
            <History size={20} />
            <span>がくしゅうのきろく</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 bg-surface px-5 py-2.5 rounded-full shadow-sm border border-line text-muted font-bold hover:bg-surface-2 transition-all"
          >
            <SettingsIcon size={20} />
            <span>せってい</span>
          </button>
          </div>
        </div>

        {/* タイトル */}
        <div className="text-center pt-2 pb-8 flex flex-col items-center">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} className="mb-1">
            <Mascot mood="happy" size={88} />
          </motion.div>
          <div className="mb-3">
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-blue-200">
              4年生のさんすう
            </span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black text-content tracking-tight">
              小数<span className="text-blue-600">ランド</span>
            </h1>
            <button
              onClick={() => speak('しょうすうランド。すきなところから はじめよう')}
              className="p-2.5 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 transition-all"
              aria-label="よみあげる"
            >
              <Volume2 size={24} />
            </button>
          </div>
          <p className="text-muted font-medium mt-2">すきなところから はじめよう！</p>
        </div>

        {/* モジュール */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((m) => (
            <ModuleCard
              key={m.id}
              m={m}
              cleared={getModuleCount(m.id)}
              onClick={() => onSelectModule(m.id)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </div>
  );
};
