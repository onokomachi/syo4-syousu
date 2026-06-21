/**
 * 位取りラボ の純粋ロジック（CRA）。
 * 数構成（3.245 = 1を3こ, 0.1を2こ, 0.01を4こ, 0.001を5こ）、
 * 「0.001 を全部で何こ」、10倍・1/10 を扱う。整数スケールで誤差回避。
 */

export const PLACE_UNITS = [
  { place: 0, value: 1, label: '1', color: '#0ea5e9' },
  { place: -1, value: 0.1, label: '0.1', color: '#10b981' },
  { place: -2, value: 0.01, label: '0.01', color: '#f59e0b' },
  { place: -3, value: 0.001, label: '0.001', color: '#ef4444' },
];

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** total(=value×1000) を 0.001 単位の整数で持ち、表示用に数値へ。 */
export function fromMilli(milli: number): number {
  return Math.round(milli) / 1000;
}

/* ---------- 数をつくる（ディスク構成） ---------- */
export type ComposeLevel = 'compose-2' | 'compose-3';

export const COMPOSE_LEVELS: { id: ComposeLevel; label: string; description: string }[] = [
  { id: 'compose-2', label: 'つくる ①', description: '0.01 の位まで（2.13）' },
  { id: 'compose-3', label: 'つくる ②', description: '0.001 の位まで（3.245）' },
];

export interface ComposeProblem {
  decimals: number; // 2 or 3
  digits: number[]; // [ones, tenths, hundredths, (thousandths)]
  target: number;
}

export function generateCompose(level: ComposeLevel): ComposeProblem {
  const decimals = level === 'compose-2' ? 2 : 3;
  const digits = [rnd(1, 9)];
  for (let i = 1; i <= decimals; i++) digits.push(rnd(0, 9));
  // 末尾は 0 でない方が「その位まで」が明確
  if (digits[decimals] === 0) digits[decimals] = rnd(1, 9);
  let milli = digits[0] * 1000;
  if (decimals >= 1) milli += digits[1] * 100;
  if (decimals >= 2) milli += digits[2] * 10;
  if (decimals >= 3) milli += digits[3];
  return { decimals, digits, target: fromMilli(milli) };
}

/* ---------- あつめた数（単位の個数） ---------- */
export type CollectLevel = 'collect-basic' | 'collect-regroup';

export const COLLECT_LEVELS: { id: CollectLevel; label: string; description: string }[] = [
  { id: 'collect-basic', label: 'あつめる ①', description: '0.235 は 0.001 を 何こ？' },
  { id: 'collect-regroup', label: 'あつめる ②', description: '0.1 を 14こ あつめると？' },
];

export interface CollectProblem {
  direction: 'count' | 'value'; // count: 値→個数, value: 個数→値
  unitLabel: string;
  unitValue: number;
  count: number;
  value: number;
  answer: string; // 入力させる正答（文字列）
}

export function generateCollect(level: CollectLevel): CollectProblem {
  const units = [
    { label: '0.1', value: 0.1, milli: 100 },
    { label: '0.01', value: 0.01, milli: 10 },
    { label: '0.001', value: 0.001, milli: 1 },
  ];
  const u = units[rnd(0, level === 'collect-basic' ? 1 : 2)];
  let count: number;
  if (level === 'collect-basic') {
    count = rnd(2, 9);
  } else {
    count = rnd(11, u.label === '0.1' ? 39 : 250); // くり上がる量
  }
  const value = fromMilli(count * u.milli);
  const direction: 'count' | 'value' = Math.random() < 0.5 ? 'count' : 'value';
  return {
    direction,
    unitLabel: u.label,
    unitValue: u.value,
    count,
    value,
    answer: direction === 'count' ? String(count) : String(value),
  };
}

/* ---------- 10倍・1/10 ---------- */
export type ScaleLevel = 'scale-10' | 'scale-tenth' | 'scale-mix';

export const SCALE_LEVELS: { id: ScaleLevel; label: string; description: string }[] = [
  { id: 'scale-10', label: '10倍', description: '2.45 を 10倍すると？' },
  { id: 'scale-tenth', label: '10分の1', description: '2.45 の 1/10 は？' },
  { id: 'scale-mix', label: 'ミックス', description: '10倍・1/10 がまざる' },
];

export interface ScaleProblem {
  value: number;
  op: '×10' | '÷10';
  answer: string;
}

export function generateScale(level: ScaleLevel): ScaleProblem {
  const decimals = rnd(1, 2);
  const milli = decimals === 1 ? rnd(11, 98) * 100 : rnd(105, 989) * 10;
  const value = fromMilli(milli);
  let op: '×10' | '÷10';
  if (level === 'scale-10') op = '×10';
  else if (level === 'scale-tenth') op = '÷10';
  else op = Math.random() < 0.5 ? '×10' : '÷10';
  const ansMilli = op === '×10' ? milli * 10 : milli / 10;
  return { value, op, answer: String(fromMilli(ansMilli)) };
}
