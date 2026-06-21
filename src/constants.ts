import { Difficulty } from './types';
import { ModuleId } from './store/progressStore';

/**
 * 「小数ランド」のモジュール一覧。資料の4領域＋ミニゲームに対応。
 * status: 'ready' は実装済み、'soon' は今後のフェーズで追加。
 */
export interface ModuleMeta {
  id: ModuleId;
  title: string;
  description: string;
  /** lucide-react のアイコン名 */
  icon: string;
  /** Tailwind の色トークン（カードのアクセント） */
  accent: string;
  status: 'ready' | 'soon';
}

export const MODULES: ModuleMeta[] = [
  {
    id: 'division',
    title: 'わり算の筆算',
    description: 'たてる・かける・ひく・おろす をマスター',
    icon: 'Divide',
    accent: 'blue',
    status: 'ready',
  },
  {
    id: 'decimal-addsub',
    title: '小数の たし算・ひき算',
    description: '小数点をそろえて 筆算しよう',
    icon: 'PlusSquare',
    accent: 'emerald',
    status: 'ready',
  },
  {
    id: 'decimal-muldiv',
    title: '小数の かけ算・わり算',
    description: '小数点の いちに気をつけて',
    icon: 'X',
    accent: 'violet',
    status: 'ready',
  },
  {
    id: 'number-line',
    title: '数直線・大小くらべ',
    description: 'どちらが 大きいかな？',
    icon: 'Ruler',
    accent: 'amber',
    status: 'ready',
  },
  {
    id: 'place-value',
    title: '位取りラボ',
    description: '0.1 や 0.01 を あつめてみよう',
    icon: 'LayoutGrid',
    accent: 'rose',
    status: 'soon',
  },
  {
    id: 'error-hunter',
    title: 'エラーハンター',
    description: 'まちがいを 見つけて なおそう',
    icon: 'Search',
    accent: 'cyan',
    status: 'soon',
  },
];

export const LEVEL_CONFIG: Record<Difficulty, { label: string; description: string }> = {
  '2-1': {
    label: '2けた ÷ 1けた',
    description: 'まずはここから！基本の筆算。'
  },
  '3-1': {
    label: '3けた ÷ 1けた',
    description: '少し長くなります。丁寧にやりましょう。'
  },
  '2-2': {
    label: '2けた ÷ 2けた',
    description: '「たてる」数の見当をつけよう。'
  },
  '3-2': {
    label: '3けた ÷ 2けた',
    description: '4年生のクライマックス！'
  }
};
