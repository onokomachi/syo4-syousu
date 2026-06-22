/**
 * 本番テストモード。実際の単元テスト「5.小数のしくみ」を同じ大問順・同じ問題数で通しで解く。
 * 既存の各アクティビティを「1問だけ出す」形で再利用し、ノーミス完答を採点する。
 * 表=知識技能100点 / 裏=思考判断表現50点 / 参考=評価のみ。
 */
import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ClipboardCheck, Home, RotateCcw, Trophy } from 'lucide-react';
import { TEST_STEPS, TestProblem, OMOTE_MAX, URA_MAX, TOTAL_MAX } from '../../lib/testConfig';
import { useProgressStore } from '../../store/progressStore';
import {
  ComposeActivity, CollectActivity, ScaleActivity, UnitActivity, PlaceIdActivity, DecomposeActivity,
} from './PlaceValueLab';
import { CompareActivity, LineReadActivity, OrderActivity } from './NumberLineModule';
import { AddSubSimulator } from './DecimalAddSubModule';
import { Round as WordRound } from './WordProblemModule';
import { ErrorRound } from './ErrorHunterModule';

interface Props { onExit: () => void; }

type Phase = 'INTRO' | 'RUN' | 'RESULT';

export const MockTestModule: React.FC<Props> = ({ onExit }) => {
  const [phase, setPhase] = useState<Phase>('INTRO');
  const [seed, setSeed] = useState(0); // 「もう一度」で問題を作り直す
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<number, boolean>>({}); // index -> ノーミス
  const recordResult = useProgressStore((s) => s.recordResult);
  const [recorded, setRecorded] = useState(false);

  // マウント（または もう一度）時に全問を一度だけ生成して固定
  const problems = useMemo<TestProblem[]>(() => TEST_STEPS.map((s) => s.gen()), [seed]);

  const start = () => {
    setIndex(0);
    setResults({});
    setRecorded(false);
    setPhase('RUN');
  };

  const onResult = (perfect: boolean) => {
    setResults((r) => ({ ...r, [index]: perfect }));
  };

  const advance = () => {
    if (index < TEST_STEPS.length - 1) setIndex((i) => i + 1);
    else setPhase('RESULT');
  };

  // 採点
  const earnedAt = (i: number) => (results[i] ? TEST_STEPS[i].points : 0);
  const omoteScore = TEST_STEPS.reduce((a, s, i) => a + (s.section === '表' ? earnedAt(i) : 0), 0);
  const uraScore = TEST_STEPS.reduce((a, s, i) => a + (s.section === '裏' ? earnedAt(i) : 0), 0);
  const totalScore = omoteScore + uraScore;
  const refIndex = TEST_STEPS.findIndex((s) => s.section === '参考');
  const refPerfect = refIndex >= 0 && results[refIndex];

  // 結果画面に入ったら1回だけ記録
  if (phase === 'RESULT' && !recorded) {
    recordResult({ moduleId: 'mock-test', skillId: 'mock-test', label: `本番テスト ${totalScore}点`, correct: totalScore === TOTAL_MAX });
    setRecorded(true);
  }

  /* ---------------- INTRO ---------------- */
  if (phase === 'INTRO') {
    const scored = TEST_STEPS.filter((s) => s.section !== '参考').length;
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button onClick={onExit} className="flex items-center gap-2 text-muted hover:text-content font-bold px-3 py-2 rounded-xl hover:bg-surface-3 transition-colors mb-2">
            <ChevronLeft size={24} /> 小数ランドへ
          </button>
          <div className="bg-surface rounded-[36px] shadow-2xl border border-line p-8 md:p-12 text-center mt-4">
            <div className="w-24 h-24 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-6"><ClipboardCheck size={44} /></div>
            <h1 className="text-3xl font-black text-content mb-2">本番テストモード</h1>
            <p className="text-muted font-bold leading-relaxed mb-6">
              「5. 小数のしくみ」の テストに ちょうせん！<br />
              大問1から じゅんばんに ぜんぶで <span className="text-content">{scored}問</span>。<br />
              表（知識・ぎのう）<span className="text-content">{OMOTE_MAX}点</span> ＋ 裏（考える力）<span className="text-content">{URA_MAX}点</span> ＝ <span className="text-content">{TOTAL_MAX}点</span>。
            </p>
            <p className="text-faint font-bold text-sm mb-8">まちがえても 正しい こたえまで すすめるよ。一発で 正解できると 点が もらえるよ。</p>
            <button onClick={start} className="px-10 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95">スタート！</button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- RESULT ---------------- */
  if (phase === 'RESULT') {
    const omoteSteps = TEST_STEPS.map((s, i) => ({ s, i })).filter((x) => x.s.section === '表');
    const uraSteps = TEST_STEPS.map((s, i) => ({ s, i })).filter((x) => x.s.section === '裏');
    const Row: React.FC<{ s: typeof TEST_STEPS[number]; i: number }> = ({ s, i }) => (
      <div className="flex items-center justify-between gap-2 py-1.5 border-b border-line/60 last:border-0">
        <span className="font-bold text-content text-sm">大問{s.daimon}{s.sub ?? ''}　{s.title}</span>
        <span className={`font-black tabular-nums shrink-0 ${results[i] ? 'text-emerald-600' : 'text-rose-400'}`}>
          {results[i] ? '○' : '×'} {earnedAt(i)}/{s.points}
        </span>
      </div>
    );
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-surface rounded-[36px] shadow-2xl border border-line p-6 md:p-10 mt-4">
            <div className="text-center mb-6">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 mb-3"><Trophy size={40} /></motion.div>
              <h1 className="text-2xl font-black text-content">テスト けっか</h1>
              <div className="text-5xl font-black text-blue-600 tabular-nums mt-2">{totalScore}<span className="text-2xl text-muted"> / {TOTAL_MAX}点</span></div>
              <div className="flex justify-center gap-3 mt-3">
                <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 font-black text-sm">表 {omoteScore}/{OMOTE_MAX}</span>
                <span className="px-4 py-1.5 rounded-full bg-rose-50 text-rose-600 font-black text-sm">裏 {uraScore}/{URA_MAX}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-line p-4 mb-3">
              <p className="text-xs font-black text-blue-600 mb-2">表・知識ぎのう</p>
              {omoteSteps.map(({ s, i }) => <Row key={i} s={s} i={i} />)}
            </div>
            <div className="rounded-2xl border border-line p-4 mb-3">
              <p className="text-xs font-black text-rose-500 mb-2">裏・思考はんだん表現</p>
              {uraSteps.map(({ s, i }) => <Row key={i} s={s} i={i} />)}
            </div>
            {refIndex >= 0 && (
              <div className="rounded-2xl border border-line p-4 mb-6">
                <p className="text-xs font-black text-faint mb-1">参考（点数なし・評価）</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-content text-sm">いかそう算数（100m走の ならべかえ）</span>
                  <span className={`font-black ${refPerfect ? 'text-emerald-600' : 'text-amber-500'}`}>{refPerfect ? 'A' : 'がんばろう'}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setSeed((s) => s + 1); start(); }} className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95">
                <RotateCcw size={20} /> もう一度
              </button>
              <button onClick={onExit} className="flex-1 flex items-center justify-center gap-2 py-4 bg-surface border-2 border-line text-content rounded-2xl font-black text-lg hover:bg-surface-2 transition-all active:scale-95">
                <Home size={20} /> ホームへ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- RUN ---------------- */
  const step = TEST_STEPS[index];
  const tp = problems[index];
  const scoredSteps = TEST_STEPS.filter((s) => s.section !== '参考').length;
  const scoredDone = TEST_STEPS.slice(0, index).filter((s) => s.section !== '参考').length;
  const progress = ((index) / TEST_STEPS.length) * 100;

  const renderActivity = () => {
    const common = { onNext: advance, onResult };
    switch (tp.kind) {
      case 'decompose': return <DecomposeActivity {...common} problem={tp.p} />;
      case 'placeid': return <PlaceIdActivity {...common} problem={tp.p} level={tp.level} />;
      case 'unit': return <UnitActivity {...common} problem={tp.p} level={tp.level} />;
      case 'compose': return <ComposeActivity {...common} problem={tp.p} level={tp.level} />;
      case 'collect': return <CollectActivity {...common} problem={tp.p} level={tp.level} />;
      case 'lineRead': return <LineReadActivity {...common} problem={tp.p} level={tp.level} />;
      case 'compare': return <CompareActivity {...common} pair={tp.p} level={tp.level} />;
      case 'scale': return <ScaleActivity {...common} problem={tp.p} level={tp.level} />;
      case 'addsub': return <AddSubSimulator {...common} problem={tp.p} level={tp.level} buildMode={tp.build} />;
      case 'word': return <WordRound {...common} problem={tp.p} />;
      case 'error': return <ErrorRound ex={tp.p} startStage="fix" onNext={advance} onResult={onResult} />;
      case 'order': return <OrderActivity {...common} problem={tp.p} level={tp.level} />;
    }
  };

  const sectionColor = step.section === '表' ? 'bg-blue-100 text-blue-700' : step.section === '裏' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700';

  return (
    <div className="w-full h-full flex flex-col bg-bg">
      {/* テスト用ヘッダ（得点は隠す） */}
      <div className="shrink-0 border-b border-line bg-surface/80 backdrop-blur px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={onExit} className="flex items-center gap-1 text-muted hover:text-content font-bold px-2 py-1.5 rounded-lg hover:bg-surface-3 transition-colors shrink-0">
            <ChevronLeft size={20} /> やめる
          </button>
          <span className={`px-3 py-1 rounded-full text-xs font-black shrink-0 ${sectionColor}`}>{step.section}</span>
          <div className="font-black text-content truncate">大問{step.daimon}{step.sub ?? ''}　<span className="text-muted font-bold">{step.title}</span></div>
          <div className="ml-auto text-sm font-black text-muted tabular-nums shrink-0">
            {step.section === '参考' ? '参考もんだい' : `${scoredDone + 1} / ${scoredSteps}問`}
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-2 h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* 本体（ステップごとに remount して内部状態をリセット） */}
      <div className="flex-1 min-h-0" key={`${seed}-${index}`}>
        {renderActivity()}
      </div>
    </div>
  );
};
