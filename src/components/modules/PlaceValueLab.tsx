/**
 * 位取りラボ（CRA）。
 * - 数をつくる: 色分けディスクをマットに置いて数を構成（3.245 = 1を3こ, 0.1を2こ…）
 * - あつめる: 「0.235 は 0.001 を 何こ」など 単位の個数で数をとらえる
 * - 10倍・1/10: 位が動くことを体感
 */
import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, RotateCcw, Plus, Minus, Lightbulb, LayoutGrid, Boxes, ArrowLeftRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppShell } from '../shared/AppShell';
import { SpeakButton } from '../shared/SpeakButton';
import { AnswerEntry } from '../shared/AnswerEntry';
import {
  PLACE_UNITS, COMPOSE_LEVELS, ComposeLevel, ComposeProblem, generateCompose, fromMilli,
  COLLECT_LEVELS, CollectLevel, CollectProblem, generateCollect,
  SCALE_LEVELS, ScaleLevel, ScaleProblem, generateScale,
} from '../../lib/placeValue';
import { useProgressStore } from '../../store/progressStore';

interface Props { onExit: () => void; }
type Activity = 'compose' | 'collect' | 'scale';

export const PlaceValueLab: React.FC<Props> = ({ onExit }) => {
  const [phase, setPhase] = useState<'SETUP' | 'SIM'>('SETUP');
  const [activity, setActivity] = useState<Activity>('compose');
  const [composeLevel, setComposeLevel] = useState<ComposeLevel>('compose-2');
  const [collectLevel, setCollectLevel] = useState<CollectLevel>('collect-basic');
  const [scaleLevel, setScaleLevel] = useState<ScaleLevel>('scale-10');
  const [compose, setCompose] = useState<ComposeProblem | null>(null);
  const [collect, setCollect] = useState<CollectProblem | null>(null);
  const [scale, setScale] = useState<ScaleProblem | null>(null);

  const startCompose = (lv: ComposeLevel) => { setActivity('compose'); setComposeLevel(lv); setCompose(generateCompose(lv)); setPhase('SIM'); };
  const startCollect = (lv: CollectLevel) => { setActivity('collect'); setCollectLevel(lv); setCollect(generateCollect(lv)); setPhase('SIM'); };
  const startScale = (lv: ScaleLevel) => { setActivity('scale'); setScaleLevel(lv); setScale(generateScale(lv)); setPhase('SIM'); };

  if (phase === 'SETUP') {
    const Group: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 text-rose-600">{icon}<span className="font-black">{title}</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{children}</div>
      </div>
    );
    const Card: React.FC<{ label: string; desc: string; onClick: () => void }> = ({ label, desc, onClick }) => (
      <button onClick={onClick} className="p-5 rounded-3xl bg-white border-2 border-slate-100 hover:border-rose-400 hover:shadow-lg text-left transition-all active:scale-[0.98]">
        <div className="text-lg font-black text-slate-800 mb-1">{label}</div>
        <div className="text-sm text-slate-500 font-medium">{desc}</div>
      </button>
    );
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <button onClick={onExit} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors mb-2">
            <ChevronLeft size={24} /> 小数ランドへ
          </button>
          <h1 className="text-3xl font-black text-slate-800 text-center mb-6">位取りラボ</h1>
          <Group icon={<LayoutGrid size={20} />} title="数をつくる">
            {COMPOSE_LEVELS.map((lv) => <Card key={lv.id} label={lv.label} desc={lv.description} onClick={() => startCompose(lv.id)} />)}
          </Group>
          <Group icon={<Boxes size={20} />} title="あつめた数">
            {COLLECT_LEVELS.map((lv) => <Card key={lv.id} label={lv.label} desc={lv.description} onClick={() => startCollect(lv.id)} />)}
          </Group>
          <Group icon={<ArrowLeftRight size={20} />} title="10倍・10分の1">
            {SCALE_LEVELS.map((lv) => <Card key={lv.id} label={lv.label} desc={lv.description} onClick={() => startScale(lv.id)} />)}
          </Group>
        </div>
      </div>
    );
  }

  const subtitle = activity === 'compose' ? COMPOSE_LEVELS.find((l) => l.id === composeLevel)?.label
    : activity === 'collect' ? COLLECT_LEVELS.find((l) => l.id === collectLevel)?.label
    : SCALE_LEVELS.find((l) => l.id === scaleLevel)?.label;

  return (
    <AppShell title="位取りラボ" subtitle={subtitle} onBack={() => setPhase('SETUP')}>
      {activity === 'compose' && compose && <ComposeActivity key={compose.target} problem={compose} level={composeLevel} onNext={() => setCompose(generateCompose(composeLevel))} />}
      {activity === 'collect' && collect && <CollectActivity key={collect.value + collect.direction + collect.unitLabel} problem={collect} level={collectLevel} onNext={() => setCollect(generateCollect(collectLevel))} />}
      {activity === 'scale' && scale && <ScaleActivity key={scale.value + scale.op} problem={scale} level={scaleLevel} onNext={() => setScale(generateScale(scaleLevel))} />}
    </AppShell>
  );
};

/* ---------------- 数をつくる ---------------- */
const ComposeActivity: React.FC<{ problem: ComposeProblem; level: ComposeLevel; onNext: () => void }> = ({ problem, level, onNext }) => {
  const units = PLACE_UNITS.slice(0, problem.decimals + 1);
  const [counts, setCounts] = useState<number[]>(units.map(() => 0));
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState(false);
  const recordResult = useProgressStore((s) => s.recordResult);

  const milli = (units[0] ? counts[0] * 1000 : 0) + (units[1] ? counts[1] * 100 : 0) + (units[2] ? counts[2] * 10 : 0) + (units[3] ? counts[3] : 0);
  const current = fromMilli(milli);

  const set = (i: number, d: number) => {
    if (solved) return;
    setWrong(false);
    setCounts((c) => c.map((v, idx) => (idx === i ? Math.max(0, Math.min(9, v + d)) : v)));
  };

  const check = () => {
    if (Math.abs(current - problem.target) < 1e-9) {
      setSolved(true);
      confetti({ particleCount: 130, spread: 70, origin: { y: 0.6 } });
      recordResult({ moduleId: 'place-value', skillId: `compose-${level}`, label: `${problem.target} をつくる`, correct: true });
    } else { setWrong(true); }
  };

  const decompo = units.map((u, i) => `${u.label}を${problem.digits[i]}こ`).join('、');

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[36px] shadow-2xl border border-slate-100 p-6 md:p-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h2 className="text-xl font-black text-slate-600">この数を つくろう：</h2>
            <span className="text-5xl font-black text-rose-500 tabular-nums">{problem.target}</span>
            <SpeakButton text={`${problem.target} を つくろう`} />
          </div>
          <p className="text-center text-slate-500 font-bold mb-6">いま：<span className="text-slate-800 text-xl tabular-nums">{current}</span></p>

          {/* マット */}
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${units.length}, 1fr)` }}>
            {units.map((u, i) => (
              <div key={u.label} className="rounded-2xl border-2 border-slate-100 p-3 flex flex-col items-center">
                <div className="px-3 py-1 rounded-full text-white font-black mb-3" style={{ backgroundColor: u.color }}>{u.label}</div>
                <div className="flex-1 flex flex-wrap-reverse gap-1.5 justify-center items-end content-start min-h-[140px] mb-3">
                  {Array.from({ length: counts[i] }, (_, k) => (
                    <motion.div key={k} initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-8 h-8 rounded-full shadow" style={{ backgroundColor: u.color }} />
                  ))}
                </div>
                <div className="text-2xl font-black text-slate-700 mb-2 tabular-nums">{counts[i]}</div>
                <div className="flex gap-2">
                  <button onClick={() => set(i, -1)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"><Minus size={20} /></button>
                  <button onClick={() => set(i, +1)} className="w-10 h-10 rounded-xl text-white flex items-center justify-center" style={{ backgroundColor: u.color }}><Plus size={20} /></button>
                </div>
              </div>
            ))}
          </div>

          {solved ? (
            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-black px-5 py-3 rounded-2xl text-left">
                {problem.target} は {decompo} あわせた数だね！<SpeakButton text={`${problem.target} は ${decompo} あわせた数`} />
              </div>
              <div><button onClick={onNext} className="mt-6 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95">つぎの もんだい</button></div>
            </div>
          ) : (
            <div className="text-center mt-8">
              {wrong && <p className="text-amber-600 font-bold mb-3">おしい！ 「いま」の数を 見て、たりない位を ふやそう。</p>}
              <button onClick={check} className="px-10 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95">これで できた！</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------------- あつめた数 ---------------- */
const CollectActivity: React.FC<{ problem: CollectProblem; level: CollectLevel; onNext: () => void }> = ({ problem, level, onNext }) => {
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const recordResult = useProgressStore((s) => s.recordResult);

  const question = problem.direction === 'count'
    ? `${problem.value} は ${problem.unitLabel} を 何こ あつめた数？`
    : `${problem.unitLabel} を ${problem.count}こ あつめた数は？`;

  const submit = (v: string) => {
    if (Number(v) === Number(problem.answer)) {
      setSolved(true);
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      recordResult({ moduleId: 'place-value', skillId: `collect-${level}`, label: question, correct: true });
    } else {
      setHint(problem.direction === 'count'
        ? `${problem.unitLabel} が 10こ あつまると 1つ上の位に なるよ。`
        : `${problem.unitLabel} の ${problem.count}こ分。10こで くり上がるよ。`);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-[36px] shadow-2xl border border-slate-100 p-6 md:p-10">
          <div className="flex items-center justify-center gap-2 mb-6 text-center">
            <h2 className="text-2xl font-black text-slate-700">{question}</h2>
            <SpeakButton text={question} />
          </div>
          {solved ? (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-black px-5 py-3 rounded-2xl">こたえ：{problem.answer}　せいかい！</div>
              <div><button onClick={onNext} className="mt-6 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95">つぎの もんだい</button></div>
            </div>
          ) : (
            <>
              {hint && <div className="mb-4 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-2"><Lightbulb className="text-amber-500 shrink-0" size={20} /><p className="text-slate-600 font-bold">{hint}</p><SpeakButton text={hint} /></div>}
              <AnswerEntry onSubmit={submit} allowDecimal={problem.direction === 'value'} accentText="text-rose-600" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------------- 10倍・1/10 ---------------- */
const ScaleActivity: React.FC<{ problem: ScaleProblem; level: ScaleLevel; onNext: () => void }> = ({ problem, level, onNext }) => {
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const recordResult = useProgressStore((s) => s.recordResult);

  const question = problem.op === '×10' ? `${problem.value} を 10倍すると？` : `${problem.value} の 10分の1は？`;

  const submit = (v: string) => {
    if (Number(v) === Number(problem.answer)) {
      setSolved(true);
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      recordResult({ moduleId: 'place-value', skillId: `scale-${level}`, label: question, correct: true });
    } else {
      setHint(problem.op === '×10' ? '10倍すると 各位が 1つ 左へ（小数点は 右へ）うごくよ。' : '10分の1にすると 各位が 1つ 右へ（小数点は 左へ）うごくよ。');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-[36px] shadow-2xl border border-slate-100 p-6 md:p-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <h2 className="text-3xl font-black text-slate-700 tabular-nums">{question}</h2>
            <SpeakButton text={question} />
          </div>
          {solved ? (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-black px-5 py-3 rounded-2xl">{problem.value} {problem.op} = {problem.answer}</div>
              <div><button onClick={onNext} className="mt-6 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95">つぎの もんだい</button></div>
            </div>
          ) : (
            <>
              {hint && <div className="mb-4 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-2"><Lightbulb className="text-amber-500 shrink-0" size={20} /><p className="text-slate-600 font-bold">{hint}</p><SpeakButton text={hint} /></div>}
              <AnswerEntry onSubmit={submit} allowDecimal accentText="text-rose-600" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
