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
import { ChevronLeft, RotateCcw, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppShell } from '../shared/AppShell';
import { Keypad } from '../shared/Keypad';
import { SpeakButton } from '../shared/SpeakButton';
import {
  ADDSUB_LEVELS, AddSubLevel, AddSubProblem, buildColumns, generateAddSub, placeName,
} from '../../lib/decimal';
import { useProgressStore } from '../../store/progressStore';
import { useSettingsStore } from '../../store/settingsStore';
import { speak } from '../../lib/speech';

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
  const [problem, setProblem] = useState<AddSubProblem | null>(null);

  const start = (lv: AddSubLevel) => {
    setLevel(lv);
    setProblem(generateAddSub(lv));
    setPhase('SIM');
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
          <h1 className="text-3xl font-black text-slate-800 text-center mb-1">小数の たし算・ひき算</h1>
          <p className="text-slate-500 text-center font-medium mb-6">小数点を そろえて 計算しよう</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ADDSUB_LEVELS.map((lv) => (
              <button
                key={lv.id}
                onClick={() => start(lv.id)}
                className="p-6 rounded-3xl bg-white border-2 border-slate-100 hover:border-emerald-400 hover:shadow-lg text-left transition-all active:scale-[0.98]"
              >
                <div className="text-xl font-black text-slate-800 mb-1">{lv.label}</div>
                <div className="text-sm text-slate-500 font-medium">{lv.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      title="小数の たし算・ひき算"
      subtitle={ADDSUB_LEVELS.find((l) => l.id === level)?.label}
      onBack={() => setPhase('SETUP')}
    >
      {problem && (
        <AddSubSimulator
          key={`${problem.a}-${problem.b}-${problem.op}`}
          problem={problem}
          level={level}
          onNext={() => setProblem(generateAddSub(level))}
        />
      )}
    </AppShell>
  );
};

interface SimProps {
  problem: AddSubProblem;
  level: AddSubLevel;
  onNext: () => void;
}

const AddSubSimulator: React.FC<SimProps> = ({ problem, level, onNext }) => {
  const model = useMemo(() => buildColumns(problem), [problem]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [shakePlace, setShakePlace] = useState<number | null>(null);

  const recordResult = useProgressStore((s) => s.recordResult);
  const ttsEnabled = useSettingsStore((s) => s.ttsEnabled);

  const intPlaces = model.places.filter((p) => p >= 0);
  const decPlaces = model.places.filter((p) => p < 0);
  const gridWidth = OP_W + intPlaces.length * CELL_W + DOT_W + decPlaces.length * CELL_W;
  const dotLeft = OP_W + intPlaces.length * CELL_W + DOT_W / 2;

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
    if (finished || activePlace === null || !activeCell || d === '.') return;
    if (d === activeCell.expected) {
      const next = { ...answers, [activePlace]: d };
      setAnswers(next);
      setHint(null);
      // 完答判定
      const allDone = model.answer.filter((a) => a.active).every((a) => next[a.place] !== undefined);
      if (allDone) finish();
    } else {
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
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    recordResult({
      moduleId: 'decimal-addsub',
      skillId: `addsub-${level}`,
      label: `${problem.a} ${problem.op} ${problem.b}`,
      correct: mistakes === 0,
    });
  };

  const reset = () => {
    setAnswers({});
    setFinished(false);
    setMistakes(0);
    setHint(null);
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
          <span className="text-slate-300">{digit}</span>
        ) : kind === 'digit' ? (
          <span className="text-slate-800">{digit}</span>
        ) : null}
      </div>
    );
  };

  const renderRow = (cells: { place: number; kind: string; digit?: string }[], op?: string) => (
    <div className="flex items-center" style={{ width: gridWidth, height: ROW_H }}>
      <div style={{ width: OP_W, height: ROW_H }} className="flex items-center justify-center text-3xl font-black text-slate-500">
        {op ?? ''}
      </div>
      {intPlaces.map((p) => {
        const c = cells.find((x) => x.place === p)!;
        return <Cell key={p} kind={c.kind} digit={c.digit} />;
      })}
      <Cell kind="dot" isDot />
      {decPlaces.map((p) => {
        const c = cells.find((x) => x.place === p)!;
        return <Cell key={p} kind={c.kind} digit={c.digit} />;
      })}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* 計算ワークスペース */}
      <div className="flex-1 overflow-auto p-4 md:p-10 flex justify-center items-start">
        <div className="bg-white p-8 md:p-12 rounded-[36px] shadow-2xl border border-slate-100 relative">
          {/* 問題式 */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <h2 className="text-2xl font-black text-slate-700 tabular-nums">
              {problem.a} {problem.op} {problem.b}
            </h2>
            <SpeakButton text={`${problem.a} ${opWord} ${problem.b}`} />
          </div>

          <div className="relative font-mono" style={{ width: gridWidth }}>
            {/* 小数点をそろえる 太い縦ガイド線 */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-amber-300/70 rounded-full z-0"
              style={{ left: dotLeft - 2 }}
            />
            <div className="relative z-10">
              {renderRow(model.rowA)}
              {renderRow(model.rowB, problem.op)}
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
                        a.active && activePlace === p && !finished
                          ? 'bg-emerald-50 ring-4 ring-emerald-400 ring-inset rounded-xl'
                          : ''
                      }`}
                    >
                      {answers[p] !== undefined ? (
                        <span className="text-emerald-600">{answers[p]}</span>
                      ) : a.active && activePlace === p && !finished ? (
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
                        a.active && activePlace === p && !finished
                          ? 'bg-emerald-50 ring-4 ring-emerald-400 ring-inset rounded-xl'
                          : ''
                      }`}
                    >
                      {answers[p] !== undefined ? (
                        <span className="text-emerald-600">{answers[p]}</span>
                      ) : a.active && activePlace === p && !finished ? (
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
      <div className="w-full md:w-[400px] bg-white border-l border-slate-100 p-6 md:p-8 flex flex-col gap-5 overflow-y-auto">
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
        ) : (
          <>
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-emerald-700 font-black text-lg flex items-center gap-2">
                  <Lightbulb size={20} /> ヒント
                </h3>
                {activeCell && (
                  <SpeakButton
                    text={
                      hint ??
                      `${placeName(activePlace!)}から 計算しよう。右の位から じゅんばんに もとめてね。`
                    }
                  />
                )}
              </div>
              <p className="text-slate-600 font-bold leading-relaxed">
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
          onClick={() => {
            if (ttsEnabled) speak('さいしょから');
            reset();
          }}
          className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 py-4 font-bold border-t border-slate-100 shrink-0"
        >
          <RotateCcw size={20} /> さいしょから
        </button>
      </div>
    </div>
  );
};
