/**
 * Демо-данные для панели аналитики.
 *
 * Всё считается детерминированно, по зерну: разметка на сервере и в браузере совпадает (иначе гидрация
 * расходится), а цифры не меняются от перезагрузки к перезагрузке. Это иллюстрация, а не статистика —
 * на странице она везде подписана «Демо-данные».
 */

/** Хэш строки в 32-битное зерно (FNV-1a). */
export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Генератор псевдослучайных чисел [0, 1) (mulberry32). */
export function rng(seed: number | string): () => number {
  let a = (typeof seed === 'string' ? hashSeed(seed) : seed) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

/** Во сколько раз день недели активнее среднего (Пн…Вс): в выходные заметно тише. */
export const WEEK_SHAPE = [1.0, 1.08, 1.12, 1.06, 0.98, 0.58, 0.5] as const;

export type SeriesOptions = {
  /** Форма недели; по умолчанию WEEK_SHAPE. Ровная — [1, 1, 1, 1, 1, 1, 1]. */
  week?: readonly number[];
  /** Разброс случайной составляющей, доля от значения. */
  noise?: number;
  /** Общий наклон за весь ряд: 0.3 — к концу на ~15 % выше, чем в середине. */
  growth?: number;
  /** Всплески: [сколько дней назад, во сколько раз выше]. */
  bumps?: readonly (readonly [number, number])[];
};

/**
 * Ряд по дням. Последний элемент — «сегодня» и всегда воскресенье, поэтому последние семь значений
 * подписываются Пн…Вс. Для любого периода берём хвост одного и того же длинного ряда (`tail`),
 * чтобы значения за один и тот же день не менялись при смене периода.
 */
export function series(
  seed: string,
  days: number,
  base: number,
  options: SeriesOptions = {},
): number[] {
  const rand = rng(seed);
  const week = options.week ?? WEEK_SHAPE;
  const noise = options.noise ?? 0.1;
  const growth = options.growth ?? 0;
  const bumps = options.bumps ?? [];
  const out: number[] = [];
  for (let i = 0; i < days; i += 1) {
    const daysAgo = days - 1 - i;
    const weekday = (((6 - daysAgo) % 7) + 7) % 7;
    let value =
      base *
      week[weekday] *
      (1 + growth * (i / (days - 1) - 0.5)) *
      (1 + (rand() - 0.5) * 2 * noise);
    for (const [at, mult] of bumps) {
      const d = daysAgo - at;
      value *= 1 + (mult - 1) * Math.exp(-(d * d) / (2 * 1.1 * 1.1));
    }
    out.push(Math.max(0, value));
  }
  return out;
}

/** Последние `n` значений. */
export const tail = (values: readonly number[], n: number) => values.slice(-n);
/** `n` значений перед последними `n` (предыдущий период для сравнения). */
export const before = (values: readonly number[], n: number) =>
  values.slice(-2 * n, -n);
export const sum = (values: readonly number[]) =>
  values.reduce((total, value) => total + value, 0);
export const mean = (values: readonly number[]) =>
  values.length ? sum(values) / values.length : 0;

/** Сглаженная кривая, не выходящая за точки (монотонная кубическая интерполяция). */
export function monotonePath(points: readonly (readonly [number, number])[]) {
  const n = points.length;
  const r = (v: number) => Math.round(v * 100) / 100;
  if (n === 0) return '';
  if (n === 1) return `M${r(points[0][0])} ${r(points[0][1])}`;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    dx.push(points[i + 1][0] - points[i][0]);
    m.push((points[i + 1][1] - points[i][1]) / dx[i]);
  }
  const t: number[] = new Array(n).fill(0);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i += 1) {
    if (m[i - 1] * m[i] <= 0) {
      t[i] = 0;
    } else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      t[i] = (w1 + w2) / (w1 / m[i - 1] + w2 / m[i]);
    }
  }
  let d = `M${r(points[0][0])} ${r(points[0][1])}`;
  for (let i = 0; i < n - 1; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const h = dx[i];
    d += `C${r(x0 + h / 3)} ${r(y0 + (t[i] * h) / 3)} ${r(x1 - h / 3)} ${r(y1 - (t[i + 1] * h) / 3)} ${r(x1)} ${r(y1)}`;
  }
  return d;
}

/** Рамка графика в условных единицах 0…100: небольшие поля, чтобы линия и точка не липли к краю. */
export function plotPoints(
  values: readonly number[],
  max: number,
  min = 0,
  padY = 6,
): [number, number][] {
  const n = values.length;
  const span = max - min || 1;
  return values.map((value, i) => [
    n === 1 ? 50 : (i / (n - 1)) * 100,
    padY + (1 - (value - min) / span) * (100 - padY * 2),
  ]);
}

/** «Красивый» верх оси: 1 / 2 / 2,5 / 5 × 10ⁿ. */
export function niceMax(value: number) {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = 10 ** exp;
  const f = value / base;
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return step * base;
}

/**
 * Раскладывает целое `total` по долям так, чтобы сумма частей осталась ровно `total`
 * (метод наибольших остатков). Нужно, чтобы части на разных виджетах сходились с итогом на плитке.
 */
export function split(total: number, shares: readonly number[]): number[] {
  const whole = Math.round(total);
  const weight = shares.reduce((acc, value) => acc + value, 0);
  if (weight <= 0 || shares.length === 0) return shares.map(() => 0);
  const raw = shares.map((value) => (whole * value) / weight);
  const out = raw.map((value) => Math.floor(value));
  let rest = whole - out.reduce((acc, value) => acc + value, 0);
  const order = raw
    .map((value, index) => [value - Math.floor(value), index] as const)
    .sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, index] of order) {
    if (rest <= 0) break;
    out[index] += 1;
    rest -= 1;
  }
  return out;
}

const NBSP = ' ';
/** Число с пробелом-разделителем тысяч и запятой; одинаково на сервере и в браузере. */
export function fmt(value: number, decimals = 0) {
  const fixed = Math.abs(value).toFixed(decimals);
  const [int, frac] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const sign = value < 0 ? '−' : '';
  return sign + grouped + (frac ? `,${frac}` : '');
}

/** Короткая подпись для оси: 1 200 → «1,2 тыс.», 1 840 000 → «1,8 млн». */
export function compact(value: number) {
  const abs = Math.abs(value);
  const one = (v: number) =>
    (Math.round(v * 10) / 10).toString().replace('.', ',');
  if (abs >= 1_000_000) return `${one(value / 1_000_000)}${NBSP}млн`;
  if (abs >= 10_000) return `${Math.round(value / 1000)}${NBSP}тыс.`;
  if (abs >= 1000) return `${one(value / 1000)}${NBSP}тыс.`;
  return fmt(value);
}

/** Изменение в процентах со знаком: «+5%», «−0,2%». */
export function signedPercent(value: number) {
  const abs = Math.abs(value);
  const text = abs < 10 ? fmt(abs, 1) : fmt(Math.round(abs));
  return `${value < 0 ? '−' : '+'}${text}%`;
}

/** Изменение в процентных пунктах: «+3 п.п.». */
export function signedPoints(value: number) {
  const abs = Math.abs(value);
  return `${value < 0 ? '−' : '+'}${fmt(abs, abs < 10 ? 1 : 0)}${NBSP}п.п.`;
}
