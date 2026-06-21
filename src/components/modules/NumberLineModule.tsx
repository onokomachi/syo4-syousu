/**
 * 数直線・大小くらべ モジュール。
 * - 大小くらべ: 2つの小数を不等号で比べ、数直線で「どちらが右（大きい）か」を視覚的に確認（Megz/Segz/Negz対策）
 * - 数直線: 小数を数直線上の正しい目もりに置く（ベンチマーク 0/0.5/1 で見当をつける）
 * タイマー無し・やさしいフィードバック・読み上げ（資料の低位児最適化）。
 */
import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, RotateCcw, Lightbulb, Ruler, Scale } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppShell } from '../shared/AppShell';
import { SpeakButton } from '../shared/SpeakButton';
import {
  COMPARE_LEVELS, CompareLevel, ComparePair, generateCompare, relation,
  LINE_LEVELS, LineLevel, LineProblem, generateLine, lineTicks,
} from '../../lib/numberLine';
import { useProgressStore } from '../../store/progressStore';
import { playClear, playSoftTry } from '../../lib/sound';
import { useAdaptive } from '../../lib/useAdaptive';
import { AdaptiveBar } from '../shared/AdaptiveBar';
import { Wand2 } from 'lucide-react';

interface Props { onExit: () => void; }
type Activity = 'compare' | 'line';

export const NumberLineModule: React.FC<Props> = ({ onExit }) => {
  const [phase, setPhase] = useState<'SETUP' | 'SIM'>('SETUP');
  const [activity, setActivity] = useState<Activity>('compare');
  const [mode, setMode] = useState<'fixed' | 'adaptive'>('fixed');
  const [compareLevel, setCompareLevel] = useState<CompareLevel>('compare-tenths');
  const [lineLevel, setLineLevel] = useState<LineLevel>('line-tenths');
  const [pair, setPair] = useState<ComparePair | null>(null);
  const [lineProblem, setLineProblem] = useState<LineProblem | null>(null);
  const compareAdaptive = useAdaptive(COMPARE_LEVELS.map((l) => l.id), 'compare');
  const lineAdaptive = useAdaptive(LINE_LEVELS.map((l) => l.id), 'line');
  const effCompareLevel = mode === 'adaptive' ? compareAdaptive.level : compareLevel;
  const effLineLevel = mode === 'adaptive' ? lineAdaptive.level : lineLevel;

  const startCompare = (lv: CompareLevel) => { setActivity('compare'); setMode('fixed'); setCompareLevel(lv); setPair(generateCompare(lv)); setPhase('SIM'); };
  const startLine = (lv: LineLevel) => { setActivity('line'); setMode('fixed'); setLineLevel(lv); setLineProblem(generateLine(lv)); setPhase('SIM'); };
  const startCompareAdaptive = () => { setActivity('compare'); setMode('adaptive'); setPair(generateCompare(compareAdaptive.level)); setPhase('SIM'); };
  const startLineAdaptive = () => { setActivity('line'); setMode('adaptive'); setLineProblem(generateLine(lineAdaptive.level)); setPhase('SIM'); };

  if (phase === 'SETUP') {
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <button onClick={onExit} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors mb-2">
            <ChevronLeft size={24} /> 小数ランドへ
          </button>
          <h1 className="text-3xl font-black text-slate-800 text-center mb-6">数直線・大小くらべ</h1>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-amber-600"><Scale size={20} /><span className="font-black">大小くらべ</span></div>
            <button onClick={startCompareAdaptive} className="w-full mb-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-amber-500 text-white shadow hover:shadow-lg text-left transition-all active:scale-[0.98] flex items-center gap-3">
              <Wand2 size={24} /><div><div className="font-black">おまかせ（じどうレベル）</div><div className="text-sm text-white/80">むずかしさが かわるよ</div></div>
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {COMPARE_LEVELS.map((lv) => (
                <button key={lv.id} onClick={() => startCompare(lv.id)} className="p-5 rounded-3xl bg-white border-2 border-slate-100 hover:border-amber-400 hover:shadow-lg text-left transition-all active:scale-[0.98]">
                  <div className="text-lg font-black text-slate-800 mb-1">{lv.label}</div>
                  <div className="text-sm text-slate-500 font-medium">{lv.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3 text-amber-600"><Ruler size={20} /><span className="font-black">数直線におく</span></div>
            <button onClick={startLineAdaptive} className="w-full mb-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-amber-500 text-white shadow hover:shadow-lg text-left transition-all active:scale-[0.98] flex items-center gap-3">
              <Wand2 size={24} /><div><div className="font-black">おまかせ（じどうレベル）</div><div className="text-sm text-white/80">むずかしさが かわるよ</div></div>
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {LINE_LEVELS.map((lv) => (
                <button key={lv.id} onClick={() => startLine(lv.id)} className="p-5 rounded-3xl bg-white border-2 border-slate-100 hover:border-amber-400 hover:shadow-lg text-left transition-all active:scale-[0.98]">
                  <div className="text-lg font-black text-slate-800 mb-1">{lv.label}</div>
                  <div className="text-sm text-slate-500 font-medium">{lv.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const adaptiveState = activity === 'compare' ? compareAdaptive : lineAdaptive;
  const subtitle = mode === 'adaptive' ? 'おまかせ'
    : activity === 'compare' ? COMPARE_LEVELS.find((l) => l.id === compareLevel)?.label
      : LINE_LEVELS.find((l) => l.id === lineLevel)?.label;

  return (
    <AppShell title="数直線・大小くらべ" subtitle={subtitle} onBack={() => setPhase('SETUP')}>
      <div className="flex flex-col h-full">
        {mode === 'adaptive' && (
          <AdaptiveBar index={adaptiveState.index} total={adaptiveState.total} leveledUp={adaptiveState.leveledUp} onClearLevelUp={adaptiveState.clearLevelUp} />
        )}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {activity === 'compare' && pair && (
            <CompareActivity key={`${pair.aStr}-${pair.bStr}`} pair={pair} level={effCompareLevel} onNext={() => setPair(generateCompare(effCompareLevel))} onResult={mode === 'adaptive' ? compareAdaptive.onResult : undefined} />
          )}
          {activity === 'line' && lineProblem && (
            <LineActivity key={lineProblem.targetStr + lineProblem.max} problem={lineProblem} level={effLineLevel} onNext={() => setLineProblem(generateLine(effLineLevel))} onResult={mode === 'adaptive' ? lineAdaptive.onResult : undefined} />
          )}
        </div>
      </div>
    </AppShell>
  );
};

/* ===================== 共通: 数直線の描画 ===================== */

interface Mark { value: number; label: string; color: string; }
interface NumberLineProps {
  min: number; max: number; step: number; majorEvery: number;
  marks?: Mark[];
  interactive?: boolean;
  onPick?: (v: number) => void;
  pickedValue?: number | null;
  correctValue?: number | null; // 採点後に正解を強調
}

const NumberLine: React.FC<NumberLineProps> = ({ min, max, step, majorEvery, marks = [], interactive, onPick, pickedValue, correctValue }) => {
  const ticks = useMemo(() => lineTicks(min, max, step), [min, max, step]);
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const isMajor = (i: number) => i % majorEvery === 0;

  return (
    <div className="relative w-full" style={{ height: 150 }}>
      {/* マーク（ピン） */}
      {marks.map((m, i) => (
        <div key={i} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: `${pct(m.value)}%`, top: 8 }}>
          <span className="px-2 py-0.5 rounded-lg text-white font-black text-lg shadow" style={{ backgroundColor: m.color }}>{m.label}</span>
          <div className="w-0.5 h-6" style={{ backgroundColor: m.color }} />
        </div>
      ))}

      {/* 軸線 */}
      <div className="absolute left-0 right-0 h-1 bg-slate-700 rounded-full" style={{ top: 70 }} />

      {/* 目もり */}
      {ticks.map((t, i) => {
        const picked = pickedValue != null && Math.abs(pickedValue - t) < 1e-9;
        const correct = correctValue != null && Math.abs(correctValue - t) < 1e-9;
        return (
          <div key={i} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: `${pct(t)}%`, top: 70 }}>
            <div className={`${isMajor(i) ? 'h-5 w-1' : 'h-3 w-0.5'} ${correct ? 'bg-emerald-500' : 'bg-slate-500'}`} />
            {interactive && (
              <button
                onClick={() => onPick?.(t)}
                aria-label={`${t}`}
                className={`mt-1 rounded-full transition-all active:scale-90 ${
                  correct ? 'bg-emerald-500 ring-4 ring-emerald-200' :
                  picked ? 'bg-rose-400 ring-4 ring-rose-200' : 'bg-amber-400 hover:bg-amber-500'
                }`}
                style={{ width: 26, height: 26 }}
              />
            )}
            {isMajor(i) && (
              <span className={`mt-1 text-sm font-black ${t === (min + max) / 2 ? 'text-amber-600' : 'text-slate-500'}`}>{Number(t.toFixed(1))}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ===================== 大小くらべ ===================== */

const REL_LABEL: Record<string, string> = { '>': 'A は B より 大きい', '<': 'A は B より 小さい', '=': 'A と B は 等しい' };

const CompareActivity: React.FC<{ pair: ComparePair; level: CompareLevel; onNext: () => void; onResult?: (perfect: boolean) => void }> = ({ pair, level, onNext, onResult }) => {
  const correct = relation(pair.aStr, pair.bStr);
  const a = Number(pair.aStr), b = Number(pair.bStr);
  const [picked, setPicked] = useState<'>' | '<' | '=' | null>(null);
  const [solved, setSolved] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const recordResult = useProgressStore((s) => s.recordResult);

  const maxVal = Math.max(a, b);
  const lineCfg = maxVal <= 1
    ? { min: 0, max: 1, step: 0.1, majorEvery: 5 }
    : { min: 0, max: Math.max(3, Math.ceil(maxVal)), step: 0.5, majorEvery: 2 };

  const verdict = correct === '='
    ? `${pair.aStr} と ${pair.bStr} は 同じ大きさだね。`
    : `${(correct === '>' ? pair.aStr : pair.bStr)} の ほうが 右にあるね。だから ${pair.aStr} ${correct} ${pair.bStr}。`;

  const choose = (r: '>' | '<' | '=') => {
    if (solved) return;
    setPicked(r);
    if (r === correct) {
      setSolved(true);
      playClear();
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      recordResult({ moduleId: 'number-line', skillId: `compare-${level}`, label: `${pair.aStr} ${correct} ${pair.bStr}`, correct: mistakes === 0 });
      onResult?.(mistakes === 0);
    } else {
      playSoftTry();
      setMistakes((m) => m + 1);
    }
  };

  const btn = (r: '>' | '<' | '=') => {
    const isCorrect = solved && r === correct;
    const isWrong = picked === r && r !== correct;
    return (
      <button key={r} onClick={() => choose(r)} disabled={solved}
        className={`w-24 h-24 rounded-3xl text-5xl font-black shadow-md transition-all active:scale-95 ${
          isCorrect ? 'bg-emerald-500 text-white' : isWrong ? 'bg-rose-100 text-rose-400' : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-amber-400'
        }`}>{r}</button>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-[36px] shadow-2xl border border-slate-100 p-8 md:p-12">
          {/* 式 */}
          <div className="flex items-center justify-center gap-4 md:gap-8 mb-8">
            <span className="text-5xl md:text-6xl font-black text-blue-600 tabular-nums">{pair.aStr}</span>
            <span className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-4xl font-black text-slate-400">
              {solved ? correct : '?'}
            </span>
            <span className="text-5xl md:text-6xl font-black text-rose-500 tabular-nums">{pair.bStr}</span>
            <SpeakButton text={`${pair.aStr} と ${pair.bStr} を くらべよう`} />
          </div>

          {!solved && (
            <>
              <p className="text-center text-slate-500 font-bold mb-4">あてはまる しるしを えらぼう</p>
              <div className="flex justify-center gap-4 mb-2">{(['>', '=', '<'] as const).map(btn)}</div>
              {picked && picked !== correct && (
                <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-2">
                  <Lightbulb className="text-amber-500 shrink-0" size={20} />
                  <p className="text-slate-600 font-bold">数直線で たしかめよう。右にあるほうが 大きいよ。</p>
                </div>
              )}
            </>
          )}

          {/* 数直線（まちがえた後・正解後に表示） */}
          {(solved || (picked && picked !== correct)) && (
            <div className="mt-6">
              <NumberLine {...lineCfg} marks={[
                { value: a, label: pair.aStr, color: '#2563eb' },
                { value: b, label: pair.bStr, color: '#f43f5e' },
              ]} />
            </div>
          )}

          {solved && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-black px-5 py-3 rounded-2xl">
                {verdict}<SpeakButton text={verdict} />
              </div>
              <div>
                <button onClick={onNext} className="mt-6 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95">つぎの もんだい</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ===================== 数直線におく ===================== */

const LineActivity: React.FC<{ problem: LineProblem; level: LineLevel; onNext: () => void; onResult?: (perfect: boolean) => void }> = ({ problem, level, onNext, onResult }) => {
  const { target, targetStr, min, max, step, majorEvery } = problem;
  const [picked, setPicked] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const recordResult = useProgressStore((s) => s.recordResult);

  const pick = (v: number) => {
    if (solved) return;
    setPicked(v);
    if (Math.abs(v - target) < 1e-9) {
      setSolved(true);
      playClear();
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      recordResult({ moduleId: 'number-line', skillId: `line-${level}`, label: `${targetStr} を数直線に`, correct: mistakes === 0 });
      onResult?.(mistakes === 0);
    } else {
      playSoftTry();
      setMistakes((m) => m + 1);
      const mid = (min + max) / 2;
      setHint(target < mid ? `まんなか(${Number(mid.toFixed(1))})より 左をさがそう。` : `まんなか(${Number(mid.toFixed(1))})より 右をさがそう。`);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[36px] shadow-2xl border border-slate-100 p-8 md:p-12">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h2 className="text-2xl font-black text-slate-700">
              <span className="text-amber-600 text-4xl tabular-nums">{targetStr}</span> は どこかな？
            </h2>
            <SpeakButton text={`${targetStr} は どこかな。正しい 目もりを タップしよう`} />
          </div>
          <p className="text-center text-slate-500 font-bold mb-8">正しい 目もりの ●を タップしよう</p>

          <div className="px-2 md:px-6 py-4">
            <NumberLine min={min} max={max} step={step} majorEvery={majorEvery}
              interactive={!solved} onPick={pick} pickedValue={picked}
              correctValue={solved ? target : null}
              marks={solved ? [{ value: target, label: targetStr, color: '#10b981' }] : []}
            />
          </div>

          {!solved && hint && (
            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-2 justify-center">
              <Lightbulb className="text-amber-500 shrink-0" size={20} />
              <p className="text-slate-600 font-bold">{hint}</p>
              <SpeakButton text={hint} />
            </div>
          )}

          {solved && (
            <div className="text-center mt-4">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-black px-5 py-3 rounded-2xl">
                せいかい！ {targetStr} は ここだね。
              </div>
              <div>
                <button onClick={onNext} className="mt-6 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95">つぎの もんだい</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
