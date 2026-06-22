/**
 * 小数のたし算・ひき算の筆算モジュール。
 * 資料の足場かけを実装:
 *  - 小数点を太い縦線でそろえる（右そろえ誤り=Pegz 対策）
 *  - 空位の「0」をうすく補助表示（6 − 2.45 など）
 *  - 位の名前（算数語彙）＋読み上げで言語負荷を下げる
 *  - 1桁ずつ右から確認するやさしいフィードバック（タイマー無し）
 */
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, RotateCcw, Lightbulb, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppShell } from '../shared/AppShell';
import { Keypad } from '../shared/Keypad';
import {
  ADDSUB_LEVELS, AddSubLevel, AddSubProblem, buildColumns, generateAddSub, placeName,
} from '../../lib/decimal';
import { useProgressStore } from '../../store/progressStore';
import { LevelCard } from '../ui/primitives';
import { playClear, playCorrect, playSoftTry } from '../../lib/sound';
import { useAdaptive } from '../../lib/useAdaptive';
import { AdaptiveBar } from '../shared/AdaptiveBar';
import { Wand2 } from 'lucide-react';

const OP_W = 44;
const CELL_W = 52;
const DOT_W = 22;
const ROW_H = 64;

interface Props {
  onExit: () => void;
}

export const DecimalAddSubModule: React.FC<Props> = ({ onExit }) => {
  const [phase, setPhase] = useState<'SETUP' | 'SIM'>('SETUP');
  const [level, setLevel] = useState<AddSubLevel>('add-basic');
  const [mode, setMode] = useState<'fixed' | 'adaptive'>('fixed');
  const [build, setBuild] = useState(false);
  const [master, setMaster] = useState(false); // SETUP の「マスターモード」トグル
  const [runMaster, setRunMaster] = useState(false); // SIM がマスター自由配置か
  const [problem, setProblem] = useState<AddSubProblem | null>(null);
  const adaptive = useAdaptive(ADDSUB_LEVELS.map((l) => l.id), 'addsub');
  const effectiveLevel = mode === 'adaptive' ? adaptive.level : level;
  const getMasteryStreak = useProgressStore((s) => s.getMasteryStreak);
  const getTodaySkillCount = useProgressStore((s) => s.getTodaySkillCount);

  const start = (lv: AddSubLevel) => {
    setMode('fixed');
    setBuild(false);
    setRunMaster(false);
    setLevel(lv);
    setProblem(generateAddSub(lv));
    setPhase('SIM');
  };
  const startBuild = (lv: AddSubLevel) => {
    setMode('fixed');
    setBuild(true);
    setRunMaster(false);
    setLevel(lv);
    setProblem(generateAddSub(lv));
    setPhase('SIM');
  };
  const startMaster = (lv: AddSubLevel) => {
    setMode('fixed');
    setBuild(false);
    setRunMaster(true);
    setLevel(lv);
    setProblem(generateAddSub(lv));
    setPhase('SIM');
  };
  const startAdaptive = () => {
    setMode('adaptive');
    setBuild(false);
    setRunMaster(false);
    setProblem(generateAddSub(adaptive.level));
    setPhase('SIM');
  };

  if (phase === 'SETUP') {
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-muted hover:text-content font-bold px-3 py-2 rounded-xl hover:bg-surface-3 transition-colors mb-2"
          >
            <ChevronLeft size={24} /> 小数ランドへ
          </button>
          <h1 className="text-3xl font-black text-content text-center mb-1">小数の たし算・ひき算</h1>
          <p className="text-muted text-center font-medium mb-6">小数点を そろえて 計算しよう</p>

          <button onClick={startAdaptive} className="w-full mb-4 p-5 rounded-3xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg hover:shadow-xl text-left transition-all active:scale-[0.98] flex items-center gap-3">
            <Wand2 size={28} />
            <div>
              <div className="text-xl font-black">おまかせ（じどうレベル）</div>
              <div className="text-sm text-white/80 font-medium">きみに 合わせて むずかしさが かわるよ</div>
            </div>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ADDSUB_LEVELS.map((lv) => (
              <LevelCard
                key={lv.id}
                label={lv.label}
                desc={lv.description}
                mastery={getMasteryStreak(`addsub-${lv.id}`)}
                todayCount={getTodaySkillCount(`addsub-${lv.id}`)}
                onClick={() => start(lv.id)}
                accentBorder="hover:border-emerald-400"
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 mt-8 mb-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <Lightbulb size={20} /><span className="font-black">筆算を 組み立てる（位を そろえる）</span>
            </div>
            {/* マスターモード切替 */}
            <button
              onClick={() => setMaster((m) => !m)}
              className="flex items-center gap-2 shrink-0"
              aria-label="マスターモードの オン・オフ"
            >
              <span className={`text-sm font-black ${master ? 'text-emerald-700' : 'text-faint'}`}>マスターモード</span>
              <span className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${master ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <motion.span animate={{ x: master ? 20 : 0 }} className="w-5 h-5 bg-surface rounded-full shadow-sm" />
              </span>
            </button>
          </div>
          <p className="text-muted font-medium mb-3 text-sm">
            {master
              ? 'うすい目もり線を めやすに、上の数・下の数・答えを ぜんぶ 自分で ならべて、さいごに「答え合わせ」をするよ。'
              : '数字を 正しい 位の ますに 自分で ならべてから 計算するよ。'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ADDSUB_LEVELS.map((lv) => (
              <LevelCard
                key={lv.id}
                label={`${master ? 'マスター' : '組み立て'}・${lv.label}`}
                desc={lv.description}
                mastery={getMasteryStreak(`${master ? 'addsub-master' : 'addsub-build'}-${lv.id}`)}
                todayCount={getTodaySkillCount(`${master ? 'addsub-master' : 'addsub-build'}-${lv.id}`)}
                onClick={() => (master ? startMaster(lv.id) : startBuild(lv.id))}
                accentBorder="hover:border-emerald-400"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      title="小数の たし算・ひき算"
      subtitle={mode === 'adaptive' ? 'おまかせ' : `${runMaster ? 'マスター・' : build ? '組み立て・' : ''}${ADDSUB_LEVELS.find((l) => l.id === level)?.label ?? ''}`}
      onBack={() => setPhase('SETUP')}
    >
      <div className="flex flex-col h-full">
        {mode === 'adaptive' && (
          <AdaptiveBar index={adaptive.index} total={adaptive.total} leveledUp={adaptive.leveledUp} onClearLevelUp={adaptive.clearLevelUp} />
        )}
        <div className="flex-1 min-h-0">
          {problem && (runMaster ? (
            <AddSubMasterSimulator
              key={`${problem.a}-${problem.b}-${problem.op}-master`}
              problem={problem}
              level={effectiveLevel}
              onNext={() => setProblem(generateAddSub(effectiveLevel))}
            />
          ) : (
            <AddSubSimulator
              key={`${problem.a}-${problem.b}-${problem.op}-${build}`}
              problem={problem}
              level={effectiveLevel}
              buildMode={build}
              onNext={() => setProblem(generateAddSub(effectiveLevel))}
              onResult={mode === 'adaptive' ? adaptive.onResult : undefined}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
};

interface SimProps {
  problem: AddSubProblem;
  level: AddSubLevel;
  buildMode?: boolean;
  onNext: () => void;
  onResult?: (perfect: boolean) => void;
}

export const AddSubSimulator: React.FC<SimProps> = ({ problem, level, buildMode = false, onNext, onResult }) => {
  const model = useMemo(() => buildColumns(problem), [problem]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [shakePlace, setShakePlace] = useState<number | null>(null);

  // 組み立てモード：A・B の桁を正しい位に置いてから計算する
  const [stage, setStage] = useState<'A' | 'B' | 'COMPUTE'>(buildMode ? 'A' : 'COMPUTE');
  const [placedA, setPlacedA] = useState<Record<number, string>>({});
  const [placedB, setPlacedB] = useState<Record<number, string>>({});

  const recordResult = useProgressStore((s) => s.recordResult);

  // 置くべき桁（高い位→低い位）
  const digitsA = useMemo(() => model.rowA.filter((c) => c.kind === 'digit').sort((x, y) => y.place - x.place), [model]);
  const digitsB = useMemo(() => model.rowB.filter((c) => c.kind === 'digit').sort((x, y) => y.place - x.place), [model]);
  const nextDigitA = digitsA[Object.keys(placedA).length];
  const nextDigitB = digitsB[Object.keys(placedB).length];

  const intPlaces = model.places.filter((p) => p >= 0);
  const decPlaces = model.places.filter((p) => p < 0);
  const gridWidth = OP_W + intPlaces.length * CELL_W + DOT_W + decPlaces.length * CELL_W;
  const dotLeft = OP_W + intPlaces.length * CELL_W + DOT_W / 2;

  // 組み立てモードで、ある位のセルをタップして桁を置く
  const placeOperand = (place: number) => {
    if (finished) return;
    if (stage === 'A') {
      if (!nextDigitA) return;
      if (place === nextDigitA.place) {
        const next = { ...placedA, [place]: nextDigitA.digit! };
        setPlacedA(next); setHint(null);
        if (Object.keys(next).length === digitsA.length) { setStage('B'); }
        else playCorrect();
      } else {
        placeError();
      }
    } else if (stage === 'B') {
      if (!nextDigitB) return;
      if (place === nextDigitB.place) {
        const next = { ...placedB, [place]: nextDigitB.digit! };
        setPlacedB(next); setHint(null);
        if (Object.keys(next).length === digitsB.length) { setStage('COMPUTE'); }
        else playCorrect();
      } else {
        placeError();
      }
    }
  };
  const placeError = () => {
    playSoftTry();
    setMistakes((m) => m + 1);
    setShakePlace(stage === 'A' ? (nextDigitA?.place ?? null) : (nextDigitB?.place ?? null));
    setTimeout(() => setShakePlace(null), 450);
    setHint('小数点を そろえて、同じ位どうしを たてに そろえよう。一の位は 小数点の すぐ左だよ。');
  };

  // 入力対象（右端＝最も低い位から）
  const activePlace = useMemo(() => {
    for (let i = model.places.length - 1; i >= 0; i--) {
      const p = model.places[i];
      const cell = model.answer.find((a) => a.place === p);
      if (cell?.active && answers[p] === undefined) return p;
    }
    return null;
  }, [model, answers]);

  const activeCell = model.answer.find((a) => a.place === activePlace);

  const opWord = problem.op === '+' ? 'たす' : 'ひく';

  const handleInput = (d: string) => {
    if (stage !== 'COMPUTE') return;
    if (finished || activePlace === null || !activeCell || d === '.') return;
    if (d === activeCell.expected) {
      const next = { ...answers, [activePlace]: d };
      setAnswers(next);
      setHint(null);
      // 完答判定
      const allDone = model.answer.filter((a) => a.active).every((a) => next[a.place] !== undefined);
      if (allDone) finish();
      else playCorrect();
    } else {
      playSoftTry();
      setMistakes((m) => m + 1);
      setShakePlace(activePlace);
      setTimeout(() => setShakePlace(null), 450);
      const aCell = model.rowA.find((c) => c.place === activePlace);
      const bCell = model.rowB.find((c) => c.place === activePlace);
      const ad = aCell?.digit ?? '0';
      const bd = bCell?.digit ?? '0';
      setHint(`${placeName(activePlace)}を 見てみよう。${ad} を ${opWord} ${bd} は いくつかな？くり上がり・くり下がりに 気をつけてね。`);
    }
  };

  const handleBackspace = () => {
    if (finished) return;
    // 直近に入力した（最も高い位の）答えを消す
    const filled = model.answer.filter((a) => a.active && answers[a.place] !== undefined);
    if (filled.length === 0) return;
    const target = filled.reduce((hi, c) => (c.place > hi.place ? c : hi), filled[0]);
    const next = { ...answers };
    delete next[target.place];
    setAnswers(next);
    setHint(null);
  };

  const finish = () => {
    setFinished(true);
    playClear();
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    recordResult({
      moduleId: 'decimal-addsub',
      skillId: buildMode ? `addsub-build-${level}` : `addsub-${level}`,
      label: `${problem.a} ${problem.op} ${problem.b}`,
      correct: mistakes === 0,
    });
    onResult?.(mistakes === 0);
  };

  const reset = () => {
    setAnswers({});
    setFinished(false);
    setMistakes(0);
    setHint(null);
    setStage(buildMode ? 'A' : 'COMPUTE');
    setPlacedA({});
    setPlacedB({});
  };

  const Cell: React.FC<{ kind: string; digit?: string; isDot?: boolean; highlight?: boolean }> = ({
    kind, digit, isDot, highlight,
  }) => {
    if (isDot) {
      return (
        <div style={{ width: DOT_W, height: ROW_H }} className="flex items-end justify-center pb-2">
          <span className="text-amber-500 font-black text-4xl leading-none">.</span>
        </div>
      );
    }
    return (
      <div
        style={{ width: CELL_W, height: ROW_H }}
        className={`flex items-center justify-center text-4xl font-black ${
          highlight ? 'bg-emerald-50 ring-4 ring-emerald-400 ring-inset rounded-xl' : ''
        }`}
      >
        {kind === 'helperZero' ? (
          <span className="text-faint">{digit}</span>
        ) : kind === 'digit' ? (
          <span className="text-content">{digit}</span>
        ) : null}
      </div>
    );
  };

  const renderOperandCell = (cells: { place: number; kind: string; digit?: string }[], p: number, rowKey: 'A' | 'B') => {
    const c = cells.find((x) => x.place === p)!;
    if (!buildMode) return <Cell key={p} kind={c.kind} digit={c.digit} />;
    const placedMap = rowKey === 'A' ? placedA : placedB;
    const isTappable = !finished && stage === rowKey;
    const placedDigit = placedMap[p];
    return (
      <button
        key={p}
        onClick={() => isTappable && placeOperand(p)}
        disabled={!isTappable}
        style={{ width: CELL_W, height: ROW_H }}
        className={`flex items-center justify-center text-4xl font-black rounded-xl ${
          isTappable ? 'cursor-pointer ring-2 ring-emerald-200 ring-inset bg-emerald-50/40 hover:bg-emerald-100' : ''
        }`}
      >
        {placedDigit !== undefined ? <span className="text-content">{placedDigit}</span>
          : c.kind === 'helperZero' ? <span className="text-faint">0</span> : null}
      </button>
    );
  };

  const renderRow = (cells: { place: number; kind: string; digit?: string }[], opts: { op?: string; rowKey: 'A' | 'B' }) => (
    <div className="flex items-center" style={{ width: gridWidth, height: ROW_H }}>
      <div style={{ width: OP_W, height: ROW_H }} className="flex items-center justify-center text-3xl font-black text-muted">
        {opts.op ?? ''}
      </div>
      {intPlaces.map((p) => renderOperandCell(cells, p, opts.rowKey))}
      <Cell kind="dot" isDot />
      {decPlaces.map((p) => renderOperandCell(cells, p, opts.rowKey))}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* 計算ワークスペース */}
      <div className="flex-1 overflow-auto p-4 md:p-10 flex justify-center items-start">
        <div className="bg-surface p-8 md:p-12 rounded-[36px] shadow-2xl border border-line relative">
          {/* 問題式 */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <h2 className="text-2xl font-black text-content tabular-nums">
              {problem.a} {problem.op} {problem.b}
            </h2>
          </div>

          <div className="relative font-mono" style={{ width: gridWidth }}>
            {/* 小数点をそろえる 太い縦ガイド線 */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-amber-300/70 rounded-full z-0"
              style={{ left: dotLeft - 2 }}
            />
            <div className="relative z-10">
              {renderRow(model.rowA, { rowKey: 'A' })}
              {renderRow(model.rowB, { op: problem.op, rowKey: 'B' })}
              {/* 横線 */}
              <div className="border-b-4 border-slate-800 rounded-full" style={{ width: gridWidth }} />
              {/* 答えの行 */}
              <div className="flex items-center" style={{ width: gridWidth, height: ROW_H }}>
                <div style={{ width: OP_W, height: ROW_H }} />
                {intPlaces.map((p) => {
                  const a = model.answer.find((x) => x.place === p)!;
                  return (
                    <motion.div
                      key={p}
                      animate={shakePlace === p ? { x: [0, -8, 8, -8, 0] } : { x: 0 }}
                      transition={{ duration: 0.4 }}
                      style={{ width: CELL_W, height: ROW_H }}
                      className={`flex items-center justify-center text-4xl font-black ${
                        a.active && activePlace === p && !finished && stage === 'COMPUTE'
                          ? 'bg-emerald-50 ring-4 ring-emerald-400 ring-inset rounded-xl'
                          : ''
                      }`}
                    >
                      {answers[p] !== undefined ? (
                        <span className="text-emerald-600">{answers[p]}</span>
                      ) : a.active && activePlace === p && !finished && stage === 'COMPUTE' ? (
                        <span className="text-emerald-300 animate-pulse">？</span>
                      ) : null}
                    </motion.div>
                  );
                })}
                <Cell kind="dot" isDot />
                {decPlaces.map((p) => {
                  const a = model.answer.find((x) => x.place === p)!;
                  return (
                    <motion.div
                      key={p}
                      animate={shakePlace === p ? { x: [0, -8, 8, -8, 0] } : { x: 0 }}
                      transition={{ duration: 0.4 }}
                      style={{ width: CELL_W, height: ROW_H }}
                      className={`flex items-center justify-center text-4xl font-black ${
                        a.active && activePlace === p && !finished && stage === 'COMPUTE'
                          ? 'bg-emerald-50 ring-4 ring-emerald-400 ring-inset rounded-xl'
                          : ''
                      }`}
                    >
                      {answers[p] !== undefined ? (
                        <span className="text-emerald-600">{answers[p]}</span>
                      ) : a.active && activePlace === p && !finished && stage === 'COMPUTE' ? (
                        <span className="text-emerald-300 animate-pulse">？</span>
                      ) : null}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* サイドパネル */}
      <div className="w-full md:w-[400px] bg-surface border-l border-line p-6 md:p-8 flex flex-col gap-5 overflow-y-auto">
        {finished ? (
          <div className="flex-1 flex flex-col justify-center items-center p-6 bg-emerald-50 border border-emerald-100 rounded-3xl text-center">
            <span className="text-6xl mb-4">{mistakes === 0 ? '🏆' : '🎉'}</span>
            <h3 className="text-2xl font-black text-emerald-800 mb-2">
              {mistakes === 0 ? 'パーフェクト！' : 'できたね！'}
            </h3>
            <p className="text-emerald-600 font-bold mb-2">
              {problem.a} {problem.op} {problem.b} = {model.result}
            </p>
            <button
              onClick={onNext}
              className="w-full py-4 mt-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95"
            >
              つぎの もんだい
            </button>
          </div>
        ) : stage !== 'COMPUTE' ? (
          <>
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-emerald-700 font-black text-lg flex items-center gap-2">
                  <Lightbulb size={20} /> {stage === 'A' ? '上の数を ならべよう' : '下の数を ならべよう'}
                </h3>
              </div>
              <p className="text-muted font-bold leading-relaxed">
                {hint ?? `${stage === 'A' ? problem.a : problem.b} を 位ごとに 上から じゅんに おくよ。小数点に そろえてね。`}
              </p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <p className="text-muted font-bold">つぎに おく 数字</p>
              <div className="w-24 h-24 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-6xl font-black shadow-lg">
                {(stage === 'A' ? nextDigitA : nextDigitB)?.digit ?? '✓'}
              </div>
              <p className="text-faint font-bold text-sm">↑ 上の 筆算の 正しい 位の ますを タップ</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-emerald-700 font-black text-lg flex items-center gap-2">
                  <Lightbulb size={20} /> ヒント
                </h3>
              </div>
              <p className="text-muted font-bold leading-relaxed">
                {hint ??
                  (activePlace !== null
                    ? `${placeName(activePlace)}から 計算しよう。右の位から じゅんばんに もとめてね。`
                    : 'よくできました！')}
              </p>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <Keypad
                onInput={handleInput}
                onBackspace={handleBackspace}
                allowDecimal={false}
              />
            </div>
          </>
        )}

        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 text-faint hover:text-muted py-4 font-bold border-t border-line shrink-0"
        >
          <RotateCcw size={20} /> さいしょから
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
 * マスターモード：自由配置の筆算（うすい目安線だけ・全部 自分で組み立て）
 * 上の数・下の数・答えを 好きな位に置き、最後に「答え合わせ」で正誤判定する。
 * ======================================================================= */
interface MasterProps {
  problem: AddSubProblem;
  level: AddSubLevel;
  onNext: () => void;
}

type RowKey = 'A' | 'B' | 'ANS';

export const AddSubMasterSimulator: React.FC<MasterProps> = ({ problem, level, onNext }) => {
  const model = useMemo(() => buildColumns(problem), [problem]);
  const recordResult = useProgressStore((s) => s.recordResult);

  // キャンバスの列：必要な位の左右に 2 列ずつ余白を足し、わざと ずらせるようにする
  const minP = Math.min(...model.places);
  const maxP = Math.max(...model.places);
  const canvasMin = minP - 2;
  const canvasMax = maxP + 2;
  const canvasPlaces = useMemo(() => {
    const ps: number[] = [];
    for (let p = canvasMax; p >= canvasMin; p--) ps.push(p);
    return ps;
  }, [canvasMin, canvasMax]);
  const intPlaces = canvasPlaces.filter((p) => p >= 0);
  const decPlaces = canvasPlaces.filter((p) => p < 0);
  const gridWidth = OP_W + intPlaces.length * CELL_W + DOT_W + decPlaces.length * CELL_W;
  const dotLeft = OP_W + intPlaces.length * CELL_W + DOT_W / 2;

  const [cellsA, setCellsA] = useState<Record<number, string>>({});
  const [cellsB, setCellsB] = useState<Record<number, string>>({});
  const [cellsAns, setCellsAns] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<{ row: RowKey; place: number } | null>(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const cellsOf = (row: RowKey) => (row === 'A' ? cellsA : row === 'B' ? cellsB : cellsAns);
  const setterOf = (row: RowKey) =>
    row === 'A' ? setCellsA : row === 'B' ? setCellsB : setCellsAns;

  // 整数スケールで値を比較（小数点は目安線=固定基準）。空の余白列は 0 寄与で自然に無視される。
  const SCALE = Math.round(10 ** -canvasMin);
  const toInt = (cells: Record<number, string>) =>
    Object.entries(cells).reduce((s, [p, d]) => s + Number(d) * Math.round(10 ** (Number(p) - canvasMin)), 0);
  const targetInt = (x: number) => Math.round(x * SCALE);

  const select = (row: RowKey, place: number) => {
    if (checked) return;
    setSelected({ row, place });
  };
  const handleInput = (d: string) => {
    if (checked || !selected || d === '.') return;
    const setter = setterOf(selected.row);
    setter((prev) => ({ ...prev, [selected.place]: d }));
    playCorrect();
  };
  const handleBackspace = () => {
    if (checked || !selected) return;
    const setter = setterOf(selected.row);
    setter((prev) => {
      const next = { ...prev };
      delete next[selected.place];
      return next;
    });
  };

  const check = () => {
    const alignOK = toInt(cellsA) === targetInt(problem.a) && toInt(cellsB) === targetInt(problem.b);
    const ansOK = toInt(cellsAns) === targetInt(model.result);
    const ok = alignOK && ansOK;
    setCorrect(ok);
    setChecked(true);
    setSelected(null);
    if (ok) {
      playClear();
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } else {
      playSoftTry();
    }
    if (!recorded) {
      recordResult({
        moduleId: 'decimal-addsub',
        skillId: `addsub-master-${level}`,
        label: `${problem.a} ${problem.op} ${problem.b}`,
        correct: ok,
      });
      setRecorded(true);
    }
  };

  const retry = () => {
    setCellsA({});
    setCellsB({});
    setCellsAns({});
    setSelected(null);
    setChecked(false);
    setCorrect(false);
  };

  const alignOK = toInt(cellsA) === targetInt(problem.a) && toInt(cellsB) === targetInt(problem.b);

  const MasterCell: React.FC<{ row: RowKey; place: number; op?: string }> = ({ row, place }) => {
    const isSel = selected?.row === row && selected.place === place;
    const digit = cellsOf(row)[place];
    const color = row === 'ANS' ? 'text-emerald-600' : 'text-content';
    return (
      <button
        onClick={() => select(row, place)}
        disabled={checked}
        style={{ width: CELL_W, height: ROW_H }}
        className={`flex items-center justify-center text-4xl font-black rounded-xl transition-colors ${
          isSel ? 'bg-emerald-50 ring-4 ring-emerald-400 ring-inset'
            : !checked ? 'ring-1 ring-line ring-inset hover:bg-surface-2' : ''
        }`}
      >
        {digit !== undefined ? <span className={color}>{digit}</span>
          : isSel ? <span className="text-emerald-300 animate-pulse">？</span> : null}
      </button>
    );
  };

  const renderRow = (row: RowKey, op?: string) => (
    <div className="flex items-center" style={{ width: gridWidth, height: ROW_H }}>
      <div style={{ width: OP_W, height: ROW_H }} className="flex items-center justify-center text-3xl font-black text-muted">
        {op ?? ''}
      </div>
      {intPlaces.map((p) => <MasterCell key={p} row={row} place={p} />)}
      <div style={{ width: DOT_W, height: ROW_H }} />
      {decPlaces.map((p) => <MasterCell key={p} row={row} place={p} />)}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* 計算ワークスペース */}
      <div className="flex-1 overflow-auto p-4 md:p-10 flex justify-center items-start">
        <div className="bg-surface p-8 md:p-12 rounded-[36px] shadow-2xl border border-line relative">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h2 className="text-2xl font-black text-content tabular-nums">{problem.a} {problem.op} {problem.b}</h2>
          </div>

          <div className="relative font-mono" style={{ width: gridWidth }}>
            {/* 小数点の うすい目安線（位をそろえる基準） */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-amber-300/40 rounded-full z-0" style={{ left: dotLeft - 1 }} />
            <div className="relative z-10">
              {renderRow('A')}
              {renderRow('B', problem.op)}
              <div className="border-b-4 border-slate-800 rounded-full" style={{ width: gridWidth }} />
              {renderRow('ANS')}
            </div>
          </div>
        </div>
      </div>

      {/* サイドパネル */}
      <div className="w-full md:w-[400px] bg-surface border-l border-line p-6 md:p-8 flex flex-col gap-5 overflow-y-auto">
        {checked ? (
          <div className={`flex-1 flex flex-col justify-center items-center p-6 rounded-3xl text-center border ${correct ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
            <span className="text-6xl mb-4">{correct ? '🏆' : '🤔'}</span>
            <h3 className={`text-2xl font-black mb-2 ${correct ? 'text-emerald-800' : 'text-amber-700'}`}>
              {correct ? 'せいかい！' : 'もう一歩！'}
            </h3>
            <p className={`font-bold mb-2 ${correct ? 'text-emerald-600' : 'text-amber-700'}`}>
              {correct
                ? `${problem.a} ${problem.op} ${problem.b} = ${model.result}`
                : !alignOK
                  ? '数の 位が ずれていないかな？小数点の 線に そろえて たしかめよう。'
                  : '位は そろっているよ。もう一度 計算を たしかめよう。'}
            </p>
            {!correct && (
              <p className="text-faint font-bold text-sm mb-2">正しい 答え：{problem.a} {problem.op} {problem.b} = {model.result}</p>
            )}
            <div className="flex flex-col gap-2 w-full mt-4">
              <button onClick={retry} className="w-full py-3 bg-surface border-2 border-emerald-300 text-emerald-700 rounded-2xl font-black text-lg hover:bg-emerald-50 transition-all active:scale-95">
                もう一度 やってみる
              </button>
              <button onClick={onNext} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95">
                つぎの もんだい
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
              <h3 className="text-emerald-700 font-black text-lg flex items-center gap-2 mb-2">
                <Lightbulb size={20} /> マスターモード
              </h3>
              <p className="text-muted font-bold leading-relaxed">
                ますを タップ → 数字キーで 上の数・下の数・答えを 自分で ならべよう。うすい線が 小数点の めやすだよ。できたら「答え合わせ」！
              </p>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <Keypad onInput={handleInput} onBackspace={handleBackspace} allowDecimal={false} />
            </div>

            <button
              onClick={check}
              className="flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95 shrink-0"
            >
              <CheckCircle2 size={22} /> 答え合わせを する
            </button>
          </>
        )}
      </div>
    </div>
  );
};
