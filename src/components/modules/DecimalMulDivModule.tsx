/**
 * 小数の かけ算・わり算（筆算）モジュール。
 * - かけ算: 整数として積を立て、最後に「小数点をうつ」（積の小数点の位置決定＝核心スキル, Mugz対策）
 * - わり算: 商の小数点を被除数の真上にそろえる・割り進み・空位0・あまり（Dugz対策）
 * 既存 DivisionSimulator の見た目／グリッド配置・採点演出のパターンと共通部品を再利用する。
 */
import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, RotateCcw, Lightbulb, X as XIcon, Divide } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppShell } from '../shared/AppShell';
import { Keypad } from '../shared/Keypad';
import { SpeakButton } from '../shared/SpeakButton';
import {
  MUL_LEVELS, MulLevel, MulProblem, buildMul, generateMul,
  DIV_LEVELS, DivLevel, DivProblem, buildDiv, generateDiv,
} from '../../lib/decimalMulDiv';
import { useProgressStore } from '../../store/progressStore';
import { playClear, playCorrect, playSoftTry } from '../../lib/sound';
import { useAdaptive } from '../../lib/useAdaptive';
import { AdaptiveBar } from '../shared/AdaptiveBar';
import { Wand2 } from 'lucide-react';

interface Props {
  onExit: () => void;
}

type Op = 'mul' | 'div';

export const DecimalMulDivModule: React.FC<Props> = ({ onExit }) => {
  const [phase, setPhase] = useState<'SETUP' | 'SIM'>('SETUP');
  const [op, setOp] = useState<Op>('mul');
  const [mode, setMode] = useState<'fixed' | 'adaptive'>('fixed');
  const [mulLevel, setMulLevel] = useState<MulLevel>('mul-tenths');
  const [divLevel, setDivLevel] = useState<DivLevel>('div-basic');
  const [mulProblem, setMulProblem] = useState<MulProblem | null>(null);
  const [divProblem, setDivProblem] = useState<DivProblem | null>(null);
  const mulAdaptive = useAdaptive(MUL_LEVELS.map((l) => l.id), 'mul');
  const divAdaptive = useAdaptive(DIV_LEVELS.map((l) => l.id), 'div');

  const effMulLevel = mode === 'adaptive' ? mulAdaptive.level : mulLevel;
  const effDivLevel = mode === 'adaptive' ? divAdaptive.level : divLevel;

  const startMul = (lv: MulLevel) => {
    setOp('mul'); setMode('fixed'); setMulLevel(lv); setMulProblem(generateMul(lv)); setPhase('SIM');
  };
  const startDiv = (lv: DivLevel) => {
    setOp('div'); setMode('fixed'); setDivLevel(lv); setDivProblem(generateDiv(lv)); setPhase('SIM');
  };
  const startMulAdaptive = () => {
    setOp('mul'); setMode('adaptive'); setMulProblem(generateMul(mulAdaptive.level)); setPhase('SIM');
  };
  const startDivAdaptive = () => {
    setOp('div'); setMode('adaptive'); setDivProblem(generateDiv(divAdaptive.level)); setPhase('SIM');
  };

  if (phase === 'SETUP') {
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors mb-2"
          >
            <ChevronLeft size={24} /> 小数ランドへ
          </button>
          <h1 className="text-3xl font-black text-slate-800 text-center mb-6">小数の かけ算・わり算</h1>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-violet-600">
              <XIcon size={20} /><span className="font-black">かけ算（小数 × 整数）</span>
            </div>
            <button onClick={startMulAdaptive} className="w-full mb-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow hover:shadow-lg text-left transition-all active:scale-[0.98] flex items-center gap-3">
              <Wand2 size={24} /><div><div className="font-black">おまかせ（じどうレベル）</div><div className="text-sm text-white/80">むずかしさが かわるよ</div></div>
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MUL_LEVELS.map((lv) => (
                <button key={lv.id} onClick={() => startMul(lv.id)}
                  className="p-5 rounded-3xl bg-white border-2 border-slate-100 hover:border-violet-400 hover:shadow-lg text-left transition-all active:scale-[0.98]">
                  <div className="text-lg font-black text-slate-800 mb-1">{lv.label}</div>
                  <div className="text-sm text-slate-500 font-medium">{lv.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3 text-blue-600">
              <Divide size={20} /><span className="font-black">わり算（小数 ÷ 整数）</span>
            </div>
            <button onClick={startDivAdaptive} className="w-full mb-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow hover:shadow-lg text-left transition-all active:scale-[0.98] flex items-center gap-3">
              <Wand2 size={24} /><div><div className="font-black">おまかせ（じどうレベル）</div><div className="text-sm text-white/80">むずかしさが かわるよ</div></div>
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DIV_LEVELS.map((lv) => (
                <button key={lv.id} onClick={() => startDiv(lv.id)}
                  className="p-5 rounded-3xl bg-white border-2 border-slate-100 hover:border-blue-400 hover:shadow-lg text-left transition-all active:scale-[0.98]">
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

  const title = op === 'mul' ? '小数の かけ算' : '小数の わり算';
  const adaptiveState = op === 'mul' ? mulAdaptive : divAdaptive;
  const subtitle = mode === 'adaptive' ? 'おまかせ'
    : op === 'mul' ? MUL_LEVELS.find((l) => l.id === mulLevel)?.label
      : DIV_LEVELS.find((l) => l.id === divLevel)?.label;

  return (
    <AppShell title={title} subtitle={subtitle} onBack={() => setPhase('SETUP')}>
      <div className="flex flex-col h-full">
        {mode === 'adaptive' && (
          <AdaptiveBar index={adaptiveState.index} total={adaptiveState.total} leveledUp={adaptiveState.leveledUp} onClearLevelUp={adaptiveState.clearLevelUp} />
        )}
        <div className="flex-1 min-h-0">
          {op === 'mul' && mulProblem && (
            <MulSimulator
              key={`${mulProblem.a}x${mulProblem.b}`}
              problem={mulProblem} level={effMulLevel}
              onNext={() => setMulProblem(generateMul(effMulLevel))}
              onResult={mode === 'adaptive' ? mulAdaptive.onResult : undefined}
            />
          )}
          {op === 'div' && divProblem && (
            <DivSimulator
              key={`${divProblem.dividend}/${divProblem.divisor}`}
              problem={divProblem} level={effDivLevel}
              onNext={() => setDivProblem(generateDiv(effDivLevel))}
              onResult={mode === 'adaptive' ? divAdaptive.onResult : undefined}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
};

/* ============================ かけ算 ============================ */

const MCELL = 50;
const MGAP = 18;

const MulSimulator: React.FC<{ problem: MulProblem; level: MulLevel; onNext: () => void; onResult?: (perfect: boolean) => void }> = ({ problem, level, onNext, onResult }) => {
  const model = useMemo(() => buildMul(problem.a, problem.b), [problem]);
  const { productIntDigits, decimals, product, b } = model;
  const aScaled = Math.round(problem.a * 10 ** decimals).toString();
  const totalCols = Math.max(productIntDigits.length, aScaled.length);

  const [stage, setStage] = useState<'DIGITS' | 'POINT' | 'DONE'>('DIGITS');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [shakeCol, setShakeCol] = useState<number | null>(null);
  const recordResult = useProgressStore((s) => s.recordResult);

  const rightAlign = (str: string): string[] => {
    const arr = Array(totalCols).fill('');
    for (let i = 0; i < str.length; i++) arr[totalCols - str.length + i] = str[i];
    return arr;
  };
  const aCells = rightAlign(aScaled);
  const prodCells = rightAlign(productIntDigits);
  const dotGap = totalCols - 1 - decimals; // この cell の右のすきまに小数点
  const expectedPointGap = dotGap;

  const activeCol = useMemo(() => {
    for (let c = totalCols - 1; c >= 0; c--) {
      if (prodCells[c] !== '' && answers[c] === undefined) return c;
    }
    return null;
  }, [answers, prodCells, totalCols]);

  const finish = () => {
    setStage('DONE');
    playClear();
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    recordResult({ moduleId: 'decimal-muldiv', skillId: `mul-${level}`, label: `${problem.a} × ${problem.b}`, correct: mistakes === 0 });
    onResult?.(mistakes === 0);
  };

  const handleInput = (d: string) => {
    if (stage !== 'DIGITS' || activeCol === null || d === '.') return;
    if (d === prodCells[activeCol]) {
      const next = { ...answers, [activeCol]: d };
      setAnswers(next); setHint(null);
      const allDone = prodCells.every((c, i) => c === '' || next[i] !== undefined);
      if (allDone) { setStage('POINT'); setHint(`小数点より下の数字は ${decimals}こ。だから 右から ${decimals}こ 数えて 小数点をうとう。`); }
      else playCorrect();
    } else {
      playSoftTry();
      setMistakes((m) => m + 1);
      setShakeCol(activeCol); setTimeout(() => setShakeCol(null), 450);
      setHint('整数の かけ算と同じように、一の位から くり上がりに気をつけて 計算しよう。');
    }
  };
  const handleBackspace = () => {
    if (stage !== 'DIGITS') return;
    const filled = Object.keys(answers).map(Number);
    if (filled.length === 0) return;
    const target = Math.max(...filled);
    const next = { ...answers }; delete next[target]; setAnswers(next);
  };
  const placePoint = (gap: number) => {
    if (stage !== 'POINT') return;
    if (gap === expectedPointGap) { finish(); }
    else { setMistakes((m) => m + 1); setHint(`小数点より下の数字は ${decimals}こだよ。右から ${decimals}こ 数えてみよう。`); }
  };
  const reset = () => { setAnswers({}); setStage('DIGITS'); setMistakes(0); setHint(null); };

  // 行の描画（cell と gap を交互に）
  const renderRow = (
    cells: string[],
    opts: { showDotAtGap?: number; interactive?: boolean; isProduct?: boolean } = {}
  ) => (
    <div className="flex items-center justify-end">
      {cells.map((ch, c) => (
        <React.Fragment key={c}>
          {c > 0 && (
            <div style={{ width: MGAP, height: 60 }} className="flex items-end justify-center pb-2 relative">
              {opts.showDotAtGap === c - 1 && <span className="text-amber-500 font-black text-3xl leading-none">.</span>}
              {opts.interactive && c - 1 <= totalCols - 2 && (
                <button
                  onClick={() => placePoint(c - 1)}
                  className="absolute inset-x-[-6px] bottom-0 h-10 rounded-md bg-amber-100 hover:bg-amber-300 border border-amber-300 text-amber-600 text-xl font-black"
                  aria-label="ここに小数点"
                >∙</button>
              )}
            </div>
          )}
          <motion.div
            animate={shakeCol === c ? { x: [0, -6, 6, -6, 0] } : { x: 0 }}
            style={{ width: MCELL, height: 60 }}
            className={`flex items-center justify-center text-4xl font-black ${
              opts.isProduct && activeCol === c && stage === 'DIGITS'
                ? 'bg-violet-50 ring-4 ring-violet-400 ring-inset rounded-xl' : ''
            }`}
          >
            {opts.isProduct ? (
              answers[c] !== undefined ? <span className="text-violet-600">{answers[c]}</span>
                : activeCol === c && stage === 'DIGITS' ? <span className="text-violet-300 animate-pulse">？</span>
                : prodCells[c] !== '' && (stage === 'POINT' || stage === 'DONE') ? <span className="text-violet-600">{prodCells[c]}</span>
                : null
            ) : (
              ch !== '' ? <span className="text-slate-800">{ch}</span> : null
            )}
          </motion.div>
        </React.Fragment>
      ))}
    </div>
  );

  const lineW = totalCols * MCELL + (totalCols - 1) * MGAP;

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="flex-1 overflow-auto p-4 md:p-10 flex justify-center items-start">
        <div className="bg-white p-8 md:p-12 rounded-[36px] shadow-2xl border border-slate-100">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h2 className="text-2xl font-black text-slate-700 tabular-nums">{problem.a} × {problem.b}</h2>
            <SpeakButton text={`${problem.a} かける ${problem.b}`} />
          </div>
          <div className="font-mono">
            {renderRow(aCells, { showDotAtGap: dotGap })}
            {/* ×b 行 */}
            <div className="flex items-center justify-end relative">
              <span className="absolute left-[-40px] text-3xl font-black text-slate-500">×</span>
              {renderRow(rightAlign(b.toString()))}
            </div>
            <div className="border-b-4 border-slate-800 rounded-full my-1 ml-auto" style={{ width: lineW }} />
            {renderRow(prodCells, {
              isProduct: true,
              interactive: stage === 'POINT',
              showDotAtGap: stage === 'DONE' ? dotGap : undefined,
            })}
          </div>
        </div>
      </div>

      <div className="w-full md:w-[400px] bg-white border-l border-slate-100 p-6 md:p-8 flex flex-col gap-5 overflow-y-auto">
        {stage === 'DONE' ? (
          <div className="flex-1 flex flex-col justify-center items-center p-6 bg-violet-50 border border-violet-100 rounded-3xl text-center">
            <span className="text-6xl mb-4">{mistakes === 0 ? '🏆' : '🎉'}</span>
            <h3 className="text-2xl font-black text-violet-800 mb-2">{mistakes === 0 ? 'パーフェクト！' : 'できたね！'}</h3>
            <p className="text-violet-600 font-bold mb-2">{problem.a} × {problem.b} = {product}</p>
            <button onClick={onNext} className="w-full py-4 mt-4 bg-violet-500 hover:bg-violet-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95">つぎの もんだい</button>
          </div>
        ) : (
          <>
            <div className="bg-violet-50 p-6 rounded-3xl border border-violet-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-violet-700 font-black text-lg flex items-center gap-2"><Lightbulb size={20} /> ヒント</h3>
                <SpeakButton text={hint ?? (stage === 'DIGITS' ? '整数のかけ算と同じように 計算しよう' : `右から ${decimals}こ 数えて 小数点をうとう`)} />
              </div>
              <p className="text-slate-600 font-bold leading-relaxed">
                {hint ?? (stage === 'DIGITS'
                  ? 'まず 小数点を 考えずに、整数の かけ算として 一の位から 計算しよう。'
                  : `小数点より下の数字は ${decimals}こ。右から ${decimals}こ 数えて、すきまの ボタンを おそう。`)}
              </p>
            </div>
            {stage === 'DIGITS' && (
              <div className="flex-1 flex flex-col justify-center">
                <Keypad onInput={handleInput} onBackspace={handleBackspace} />
              </div>
            )}
          </>
        )}
        <button onClick={reset} className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 py-4 font-bold border-t border-slate-100 shrink-0">
          <RotateCcw size={20} /> さいしょから
        </button>
      </div>
    </div>
  );
};

/* ============================ わり算 ============================ */

const DLEAD = 52;
const DCELL = 50;
const DH = 56;

const DivSimulator: React.FC<{ problem: DivProblem; level: DivLevel; onNext: () => void; onResult?: (perfect: boolean) => void }> = ({ problem, level, onNext, onResult }) => {
  const model = useMemo(() => buildDiv(problem), [problem]);
  const { divisor, steps, intLen, baseLen, quotientStartIndex, quotientPointIndex, quotientValue, remainderValue, mode } = model;

  const displayDigits = mode === 'remainder' ? model.digits + model.fracStr : model.digits;
  const n = displayDigits.length;

  // 先頭の桁（商の先頭0で「書かない」桁）は手続きから除外する。
  // 例: 13÷4 は「1÷4=0」を書かず、いきなり「13÷4=3」とする。
  const activeSteps = useMemo(
    () => steps.filter((s) => s.index >= quotientStartIndex),
    [steps, quotientStartIndex]
  );

  const [stepIdx, setStepIdx] = useState(0);
  const [enteredQ, setEnteredQ] = useState<Record<number, number>>({});
  const [revealedStep, setRevealedStep] = useState(-1); // ここまでの step の筆算（かける・ひく）を表示
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const recordResult = useProgressStore((s) => s.recordResult);

  const current = activeSteps[stepIdx];

  const finish = (miss: number) => {
    setFinished(true);
    playClear();
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    recordResult({
      moduleId: 'decimal-muldiv', skillId: `div-${level}`,
      label: `${problem.dividend} ÷ ${problem.divisor}`, correct: miss === 0,
    });
    onResult?.(miss === 0);
  };

  const handleInput = (d: string) => {
    if (finished || !current || d === '.') return;
    if (Number(d) === current.quotient) {
      setEnteredQ((prev) => ({ ...prev, [current.index]: current.quotient }));
      setRevealedStep(stepIdx);
      setHint(null);
      if (stepIdx < activeSteps.length - 1) {
        setStepIdx(stepIdx + 1);
        // 小数点に差し掛かるときの足場かけ
        if (activeSteps[stepIdx + 1].index === quotientPointIndex) {
          setHint('ここからは 小数点より下だね。商の小数点は 被除数の小数点の 真上にうつよ。');
        }
      } else {
        finish(mistakes);
      }
      if (stepIdx < activeSteps.length - 1) playCorrect();
    } else {
      playSoftTry();
      setMistakes((m) => m + 1);
      setShake(true); setTimeout(() => setShake(false), 450);
      setHint(`${current.dividendPart} の中に ${divisor} は いくつ入るかな？大きすぎても 小さすぎても いけないよ。`);
    }
  };

  const reset = () => {
    setStepIdx(0); setEnteredQ({}); setRevealedStep(-1); setFinished(false); setMistakes(0); setHint(null);
  };

  // 値を endCol で終わるように n 列へ配置
  const cellsForValue = (value: string, endCol: number): string[] => {
    const start = endCol - value.length + 1;
    return Array.from({ length: n }, (_, c) => (c >= start && c <= endCol ? value[c - start] : ''));
  };

  // 筆算の作業行（かける・ひく）を step ごとに事前生成し、revealedStep まで表示
  const workRows = useMemo(() => {
    const rows: { kind: 'mul' | 'sub'; cells: string[]; stepRef: number; showLine: boolean }[] = [];
    activeSteps.forEach((s, idx) => {
      rows.push({ kind: 'mul', cells: cellsForValue(s.multiply.toString(), s.index), stepRef: idx, showLine: true });
      if (idx < activeSteps.length - 1) {
        const nxt = activeSteps[idx + 1];
        rows.push({ kind: 'sub', cells: cellsForValue(nxt.dividendPart.toString(), nxt.index), stepRef: idx, showLine: false });
      } else {
        rows.push({ kind: 'sub', cells: cellsForValue(s.remainder.toString(), s.index), stepRef: idx, showLine: false });
      }
    });
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  const gridStyle = { gridTemplateColumns: `${DLEAD}px repeat(${n}, ${DCELL}px)` } as React.CSSProperties;

  // 小数点ドット（数字セルの右端）
  const Dot = () => (
    <span className="absolute right-[-3px] bottom-2 text-amber-500 font-black text-3xl leading-none z-20">.</span>
  );

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="flex-1 overflow-auto p-4 md:p-10 flex justify-center items-start">
        <div className="bg-white p-8 md:p-12 rounded-[36px] shadow-2xl border border-slate-100">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h2 className="text-2xl font-black text-slate-700 tabular-nums">{problem.dividend} ÷ {problem.divisor}</h2>
            <SpeakButton text={`${problem.dividend} わる ${problem.divisor}`} />
          </div>

          <div className="font-mono text-slate-800">
            {/* 商の行 */}
            <div className="grid items-center text-center" style={gridStyle}>
              <div />
              {Array.from({ length: n }, (_, c) => {
                const showPoint = quotientPointIndex > 0 && c === quotientPointIndex - 1;
                const q = c >= quotientStartIndex ? enteredQ[c] : undefined;
                const isActive = !finished && current?.index === c;
                return (
                  <div key={c} className={`relative flex items-center justify-center text-4xl font-black ${isActive ? 'bg-blue-50 ring-4 ring-blue-400 ring-inset rounded-xl' : ''}`} style={{ height: DH }}>
                    {q !== undefined ? <span className="text-blue-600">{q}</span>
                      : isActive ? <span className="text-blue-300 animate-pulse">？</span> : null}
                    {showPoint && (enteredQ[c] !== undefined || (current && current.index > c)) && <Dot />}
                  </div>
                );
              })}
            </div>

            {/* わくの行（divisor ) dividend） */}
            <div className="grid items-center text-center relative" style={{ ...gridStyle, height: DH }}>
              <div className="flex items-center justify-end pr-2 font-black border-r-4 border-slate-800 h-full z-20">{divisor}</div>
              <div className="absolute left-[52px] right-0 top-0 border-t-4 border-slate-800 z-10" />
              {Array.from({ length: n }, (_, c) => {
                const appended = c >= baseLen && mode !== 'remainder';
                const isFrac = c >= intLen; // remainder モードの小数部など
                const showPoint = c === intLen - 1;
                return (
                  <div key={c} className="relative flex items-center justify-center text-4xl font-black" style={{ height: DH }}>
                    <span className={appended ? 'text-slate-300' : isFrac && mode === 'remainder' ? 'text-slate-400' : ''}>{displayDigits[c]}</span>
                    {showPoint && <Dot />}
                  </div>
                );
              })}
            </div>

            {/* 作業行（かける・ひく） */}
            {workRows.map((row, i) => {
              if (row.stepRef > revealedStep) return null;
              return (
                <div key={i} className="grid items-center text-center relative" style={{ ...gridStyle, height: DH }}>
                  <div className="flex items-center justify-end pr-2 text-slate-400 font-bold text-2xl">
                    {row.kind === 'mul' ? '' : '−'}
                  </div>
                  {row.kind === 'mul' && (
                    <div className="absolute left-[52px] right-0 bottom-0 border-b-2 border-slate-300" />
                  )}
                  {row.cells.map((ch, c) => (
                    <div key={c} className="flex items-center justify-center text-3xl font-medium text-slate-600" style={{ height: DH }}>
                      {ch}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-full md:w-[400px] bg-white border-l border-slate-100 p-6 md:p-8 flex flex-col gap-5 overflow-y-auto">
        {finished ? (
          <div className="flex-1 flex flex-col justify-center items-center p-6 bg-blue-50 border border-blue-100 rounded-3xl text-center">
            <span className="text-6xl mb-4">{mistakes === 0 ? '🏆' : '🎉'}</span>
            <h3 className="text-2xl font-black text-blue-800 mb-2">{mistakes === 0 ? 'パーフェクト！' : 'できたね！'}</h3>
            <p className="text-blue-600 font-bold mb-2">
              {problem.dividend} ÷ {problem.divisor} = {quotientValue}
              {mode === 'remainder' && ` あまり ${remainderValue}`}
            </p>
            <button onClick={onNext} className="w-full py-4 mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95">つぎの もんだい</button>
          </div>
        ) : (
          <>
            <motion.div animate={shake ? { x: [0, -6, 6, -6, 0] } : { x: 0 }} className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-blue-700 font-black text-lg flex items-center gap-2"><Lightbulb size={20} /> たてる</h3>
                <SpeakButton text={hint ?? (current ? `${current.dividendPart} わる ${divisor} は いくつ` : '')} />
              </div>
              <p className="text-slate-600 font-bold leading-relaxed">
                {hint ?? (current ? `${current.dividendPart} の中に ${divisor} は いくつ 入るかな？ 商を 1けた たてよう。` : '')}
              </p>
            </motion.div>
            <div className="flex-1 flex flex-col justify-center">
              <Keypad onInput={handleInput} onBackspace={() => { /* たてる は1桁ずつ確定 */ }} />
            </div>
          </>
        )}
        <button onClick={reset} className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 py-4 font-bold border-t border-slate-100 shrink-0">
          <RotateCcw size={20} /> さいしょから
        </button>
      </div>
    </div>
  );
};
