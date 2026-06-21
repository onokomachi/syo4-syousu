/**
 * エラーハンター（誤り例＝Erroneous Examples）の純粋ロジック。
 * 資料: 事前知識の低い児童ほど、誤答を見つけ→直し→理由を言語化する活動が遅延テストで効く（エビレベルII）。
 * 「正しい/まちがい」を判断 →（まちがいなら）正しい答えを入れる → 理由をえらぶ、の3段階。
 */

export type FixKind = 'number' | 'sign';

export const REASONS = {
  POINT: '小数点を わすれた・いちを まちがえた',
  ALIGN: '位（小数点）を そろえずに 計算した',
  MEGZ: 'けたが長いほうを 大きいと 思った',
  REGROUP: '10こで 1くり上げる「両替」を しなかった',
};

export interface ErrorExample {
  character: string;
  expr: string; // 表示する式（誤りを含む）
  speak: string; // 読み上げ用
  isCorrect: boolean; // この式は正しいか
  fixKind: FixKind;
  correctAnswer: string; // 数 or '>'/'<'/'='
  reasonOptions: string[];
  correctReasonIndex: number;
}

const CHARS = ['りく', 'はな', 'そら', 'みお', 'けん', 'あい'];
function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }
function rnd(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function buildReasons(correct: string): { options: string[]; index: number } {
  const all = [REASONS.POINT, REASONS.ALIGN, REASONS.MEGZ, REASONS.REGROUP];
  const distractors = all.filter((r) => r !== correct).sort(() => Math.random() - 0.5).slice(0, 2);
  const options = [correct, ...distractors].sort(() => Math.random() - 0.5);
  return { options, index: options.indexOf(correct) };
}

type Builder = () => ErrorExample;

// かけ算で小数点を忘れる誤り（1.2 × 4 = 48 → 正 4.8）
const mulPoint: Builder = () => {
  const a = rnd(11, 49) / 10;
  const b = rnd(2, 9);
  const intProduct = Math.round(a * 10) * b; // 小数点なしの積
  const correct = Math.round(a * b * 10) / 10;
  const r = buildReasons(REASONS.POINT);
  return {
    character: pick(CHARS),
    expr: `${a} × ${b} = ${intProduct}`,
    speak: `${a} かける ${b} は ${intProduct}`,
    isCorrect: false,
    fixKind: 'number',
    correctAnswer: String(correct),
    reasonOptions: r.options,
    correctReasonIndex: r.index,
  };
};

// わり算で商の小数点をわすれる誤り（8.4 ÷ 4 = 21 → 正 2.1）
const divPoint: Builder = () => {
  // 割り切れて小数になる例を作る
  const divisor = rnd(2, 4);
  const q = rnd(11, 49) / 10; // 商（小数）
  const dividend = Math.round(q * divisor * 10) / 10;
  const intQuotient = Math.round(q * 10); // 小数点なしの商
  const r = buildReasons(REASONS.POINT);
  return {
    character: pick(CHARS),
    expr: `${dividend} ÷ ${divisor} = ${intQuotient}`,
    speak: `${dividend} わる ${divisor} は ${intQuotient}`,
    isCorrect: false,
    fixKind: 'number',
    correctAnswer: String(q),
    reasonOptions: r.options,
    correctReasonIndex: r.index,
  };
};

// 大小くらべの Megz 誤り（0.5 < 0.36 → 正 >）
const compareMegz: Builder = () => {
  const t = rnd(2, 8); // 0.t（一桁小数）
  const hh = rnd(t + 1, 10 * t - 1); // 0.hh（二桁小数）, 整数として hh>t だが 値は 0.t>0.hh
  // 値: t/10 と hh/100 を比べる → 10t と hh
  const aStr = `0.${t}`;
  const bStr = `0.${hh}`;
  const trueRel = 10 * t > hh ? '>' : 10 * t < hh ? '<' : '=';
  // Megz の児童が書きがちな逆の記号を表示
  const shown = trueRel === '>' ? '<' : '>';
  const r = buildReasons(REASONS.MEGZ);
  return {
    character: pick(CHARS),
    expr: `${aStr} ${shown} ${bStr}`,
    speak: `${aStr} は ${bStr} より ${shown === '>' ? '大きい' : '小さい'}`,
    isCorrect: false,
    fixKind: 'sign',
    correctAnswer: trueRel,
    reasonOptions: r.options,
    correctReasonIndex: r.index,
  };
};

// 両替（くり上げ）忘れ（0.1 を 12こ = 0.12 → 正 1.2）
const collectRegroup: Builder = () => {
  const count = rnd(11, 39);
  const wrong = `0.${count}`;
  const correct = Math.round(count * 100) / 1000; // count×0.1
  const r = buildReasons(REASONS.REGROUP);
  return {
    character: pick(CHARS),
    expr: `0.1 を ${count}こ あつめた数 = ${wrong}`,
    speak: `0.1 を ${count} こ あつめた数は ${wrong}`,
    isCorrect: false,
    fixKind: 'number',
    correctAnswer: String(correct),
    reasonOptions: r.options,
    correctReasonIndex: r.index,
  };
};

// たし算で位をそろえない誤り（2.4 + 1.8 = 3.12 → 正 4.2）
const addAlign: Builder = () => {
  // くり上がりが起きる（小数部の和が10以上）ときだけ、位をそろえない誤りが「見た目に誤り」になる
  const tA = rnd(2, 9);
  const tB = rnd(10 - tA, 9); // tA + tB >= 10 を保証
  const a = rnd(1, 4) + tA / 10;
  const b = rnd(1, 4) + tB / 10;
  const intPart = Math.floor(a) + Math.floor(b);
  const fracSum = tA + tB; // 例: 4+8=12
  const wrong = `${intPart}.${fracSum}`;
  const correct = Math.round((a + b) * 10) / 10;
  const r = buildReasons(REASONS.ALIGN);
  return {
    character: pick(CHARS),
    expr: `${a} + ${b} = ${wrong}`,
    speak: `${a} たす ${b} は ${wrong}`,
    isCorrect: false,
    fixKind: 'number',
    correctAnswer: String(correct),
    reasonOptions: r.options,
    correctReasonIndex: r.index,
  };
};

// 正しい例（混ぜる）
const correctAdd: Builder = () => {
  const a = rnd(11, 49) / 10, b = rnd(11, 49) / 10;
  const sum = Math.round((a + b) * 10) / 10;
  return { character: pick(CHARS), expr: `${a} + ${b} = ${sum}`, speak: `${a} たす ${b} は ${sum}`, isCorrect: true, fixKind: 'number', correctAnswer: String(sum), reasonOptions: [], correctReasonIndex: -1 };
};
const correctCompare: Builder = () => {
  const a = rnd(1, 9), b = rnd(1, 9);
  const x = a, y = b + (a === b ? 1 : 0);
  const rel = x > y ? '>' : x < y ? '<' : '=';
  return { character: pick(CHARS), expr: `0.${x} ${rel} 0.${y}`, speak: `0てん${x} は 0てん${y} より`, isCorrect: true, fixKind: 'sign', correctAnswer: rel, reasonOptions: [], correctReasonIndex: -1 };
};

const ERROR_BUILDERS = [mulPoint, divPoint, compareMegz, collectRegroup, addAlign];
const CORRECT_BUILDERS = [correctAdd, correctCompare];

/** ランダムに誤り例（ときどき正しい例）を生成。 */
export function generateError(): ErrorExample {
  if (Math.random() < 0.25) return pick(CORRECT_BUILDERS)();
  return pick(ERROR_BUILDERS)();
}
