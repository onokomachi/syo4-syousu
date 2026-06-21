/**
 * 読み上げボタン。TTS が ON のときだけ機能する小さな丸ボタン。
 * 語彙・問題文・ヒントの横に置いて、言語読解の負荷を下げる。
 */
import React from 'react';
import { Volume2 } from 'lucide-react';
import { speak } from '../../lib/speech';
import { useSettingsStore } from '../../store/settingsStore';

interface Props {
  text: string;
  size?: number;
  className?: string;
}

export const SpeakButton: React.FC<Props> = ({ text, size = 20, className = '' }) => {
  const ttsEnabled = useSettingsStore((s) => s.ttsEnabled);
  if (!ttsEnabled) return null;
  return (
    <button
      onClick={() => speak(text)}
      aria-label="よみあげる"
      className={`inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 active:scale-90 transition-all p-2 shrink-0 ${className}`}
    >
      <Volume2 size={size} />
    </button>
  );
};
