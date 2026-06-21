/**
 * ガイドキャラクター「テンくん」（小数点モチーフの丸いキャラ）。
 * 表情で励まし・心理的安全性を演出（SDT relatedness / GBL）。装飾は機能的に最小限。
 */
import React from 'react';

export type MascotMood = 'idle' | 'happy' | 'think' | 'cheer';

interface Props {
  mood?: MascotMood;
  size?: number;
  className?: string;
}

export const Mascot: React.FC<Props> = ({ mood = 'idle', size = 72, className = '' }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} role="img" aria-label="テンくん">
      {/* 体（丸） */}
      <circle cx="50" cy="54" r="34" fill="#6366f1" />
      <circle cx="50" cy="54" r="34" fill="url(#tg)" />
      <defs>
        <radialGradient id="tg" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ほっぺ */}
      <circle cx="33" cy="60" r="5" fill="#f9a8d4" opacity="0.8" />
      <circle cx="67" cy="60" r="5" fill="#f9a8d4" opacity="0.8" />

      {/* 目 */}
      {mood === 'cheer' ? (
        <>
          <path d="M36 48 q5 -7 10 0" stroke="#1e1b4b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M54 48 q5 -7 10 0" stroke="#1e1b4b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="40" cy="49" r="4.5" fill="#1e1b4b" />
          <circle cx="60" cy="49" r="4.5" fill="#1e1b4b" />
          <circle cx="41.5" cy="47.5" r="1.5" fill="#fff" />
          <circle cx="61.5" cy="47.5" r="1.5" fill="#fff" />
        </>
      )}

      {/* 口 */}
      {mood === 'happy' && <path d="M40 62 q10 10 20 0" stroke="#1e1b4b" strokeWidth="3.5" fill="none" strokeLinecap="round" />}
      {mood === 'cheer' && <path d="M38 60 q12 14 24 0 z" fill="#1e1b4b" />}
      {mood === 'idle' && <path d="M43 63 q7 6 14 0" stroke="#1e1b4b" strokeWidth="3.5" fill="none" strokeLinecap="round" />}
      {mood === 'think' && <circle cx="50" cy="64" r="3.5" fill="#1e1b4b" />}

      {/* 小数点の「点」を頭の上に */}
      <circle cx="50" cy="14" r="6" fill="#f59e0b" />
    </svg>
  );
};
