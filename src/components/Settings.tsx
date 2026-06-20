/**
 * ひょうじ設定パネル（モーダル）。
 * 資料: 背景色/コントラスト・大きいフォント・読み上げを児童自身が切り替えられるようにする。
 */
import React from 'react';
import { motion } from 'motion/react';
import { X, Sun, Coffee, Moon, Volume2, VolumeX } from 'lucide-react';
import { useSettingsStore, Theme, FontScale } from '../store/settingsStore';

interface Props {
  onClose: () => void;
}

const THEMES: { id: Theme; label: string; icon: React.ReactNode; swatch: string }[] = [
  { id: 'light', label: 'ふつう', icon: <Sun size={22} />, swatch: 'bg-white border-slate-300' },
  { id: 'cream', label: 'クリーム', icon: <Coffee size={22} />, swatch: 'bg-[#f6efdc] border-amber-300' },
  { id: 'dark', label: 'ダーク', icon: <Moon size={22} />, swatch: 'bg-slate-800 border-slate-600' },
];

const FONTS: { id: FontScale; label: string; sample: string }[] = [
  { id: 'normal', label: 'ふつう', sample: 'text-base' },
  { id: 'large', label: 'おおきい', sample: 'text-xl' },
  { id: 'xlarge', label: 'とてもおおきい', sample: 'text-2xl' },
];

export const Settings: React.FC<Props> = ({ onClose }) => {
  const { theme, fontScale, ttsEnabled, setTheme, setFontScale, toggleTts } = useSettingsStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-800">ひょうじの せってい</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
            aria-label="とじる"
          >
            <X size={24} />
          </button>
        </div>

        {/* 背景・コントラスト */}
        <div className="mb-6">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">
            はいけいの いろ
          </label>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                  theme === t.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <span className={`w-10 h-10 rounded-full border-2 ${t.swatch}`} />
                <span className="flex items-center gap-1 text-sm font-bold text-slate-700">
                  {t.icon}
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 文字サイズ */}
        <div className="mb-6">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">
            もじの おおきさ
          </label>
          <div className="grid grid-cols-3 gap-3">
            {FONTS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFontScale(f.id)}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  fontScale === f.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <span className={`block font-black text-slate-700 ${f.sample}`}>あ</span>
                <span className="text-xs font-bold text-slate-500">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 読み上げ */}
        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3">
            {ttsEnabled ? <Volume2 className="text-blue-500" /> : <VolumeX className="text-slate-400" />}
            <div>
              <div className="font-bold text-slate-800">よみあげ</div>
              <div className="text-sm text-slate-500">もんだいや ことばを 音声でよみます。</div>
            </div>
          </div>
          <button
            onClick={toggleTts}
            className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${
              ttsEnabled ? 'bg-blue-500' : 'bg-slate-300'
            }`}
            aria-label="よみあげの オン・オフ"
          >
            <motion.div animate={{ x: ttsEnabled ? 24 : 0 }} className="w-6 h-6 bg-white rounded-full shadow-sm" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
