/**
 * Панель «Следите за проектом в реальном времени»: у каждой задачи свой набор показателей и виджетов.
 *
 * Что показывает панель для каждой задачи, взято из блока «Для кого» и каталога механик
 * (src/data/landing.ts): те же возможности, те же названия. Все цифры — демо: считаются по зерну
 * (src/lib/demo-data.ts), на странице подписаны «Демо-данные — не результаты реального проекта».
 *
 * Данные зависят от периода: хвост одного и того же длинного ряда, поэтому суммы, графики и плитки
 * всегда согласованы между собой, а при смене периода значения за один день не «прыгают».
 */
import { caseCategories, type Accent } from './landing';
import {
  before,
  mean,
  rng,
  series,
  signedPercent,
  signedPoints,
  split,
  sum,
  tail,
} from '@/lib/demo-data';

export type ScenarioId = 'hr' | 'events' | 'loyalty' | 'external' | 'trade';
export type PeriodId = 7 | 14 | 30;

export const periods = [
  {
    id: 7,
    short: '7 дней',
    label: 'За последние 7 дней',
    vs: 'предыдущим 7 дням',
  },
  { id: 14, short: '14 дней', label: 'За 14 дней', vs: 'предыдущим 14 дням' },
  { id: 30, short: '30 дней', label: 'За 30 дней', vs: 'предыдущим 30 дням' },
] as const satisfies readonly {
  id: PeriodId;
  short: string;
  label: string;
  vs: string;
}[];

export type Capability = { id: string; label: string };
export type ScenarioMeta = {
  id: ScenarioId;
  /** Название вкладки — то же, что в блоке «Для кого». */
  tab: string;
  accent: Accent;
  /** Одна строка: что видит организатор в этой панели. */
  lead: string;
  /** Возможности сценария; каждая подсвечивает свои виджеты. */
  caps: readonly Capability[];
};

const tagsOf = (id: ScenarioId): readonly string[] =>
  caseCategories.find((item) => item.id === id)?.tags ?? [];
const caps = (id: ScenarioId, ids: readonly string[]): Capability[] =>
  tagsOf(id).map((label, i) => ({ id: ids[i], label }));

export const scenarios: readonly ScenarioMeta[] = [
  {
    id: 'hr',
    tab: 'HR и внутриком',
    accent: 'blue',
    lead: 'Кто прошёл онбординг и где застрял, какие офисы лидируют и сколько обучения пройдено.',
    caps: [
      { id: 'onboarding', label: 'Онбординг' },
      { id: 'learning', label: 'Обучение' },
      { id: 'engagement', label: 'Вовлечение' },
      { id: 'teams', label: 'Офисы и города' },
    ],
  },
  {
    id: 'events',
    tab: 'Мероприятия',
    accent: 'cyan',
    lead: 'Эфир, QR на площадке и голосования в одной панели — пока идёт событие.',
    caps: caps('events', ['qr', 'live', 'votes', 'telegram']),
  },
  {
    id: 'loyalty',
    tab: 'Лояльность и клубы',
    accent: 'violet',
    lead: 'Статусы участников, возвраты в платформу и спрос на награды.',
    caps: caps('loyalty', ['clubs', 'levels', 'shop', 'programs']),
  },
  {
    id: 'external',
    tab: 'Спецпроекты',
    accent: 'coral',
    lead: 'Маршрут участника в кампании: сколько дошли до финала и какие игры работают.',
    caps: caps('external', ['promo', 'challenges', 'contests', 'brand']),
  },
  {
    id: 'trade',
    tab: 'Трейд-маркетинг',
    accent: 'amber',
    lead: 'Проверка чеков, призовой фонд и позиции акции — кампания под контролем.',
    caps: caps('trade', ['receipts', 'points', 'fund', 'control']),
  },
];

/* ───────────── Общие типы виджетов ───────────── */

export type Delta = {
  text: string;
  up: boolean;
  /** Рост — это хорошо? От этого зависит цвет, а направление всегда видно по стрелке. */
  good: boolean;
  /** Без изменений: показываем нейтрально, без стрелки. */
  flat?: boolean;
};

export type KpiData = {
  id: string;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  delta: Delta;
  /** Значения по дням за период — линия под цифрой. */
  spark: number[];
  /** Возможность, к которой относится плитка. */
  cap?: string;
  /** Живое пополнение: раз в `every` тиков +от…до. */
  live?: { every: number; min: number; max: number };
};

export type FunnelStep = { label: string; share: number; count: number };
export type DayChart = {
  values: number[];
  /** Подписи под осью: 7 дней — Пн…Вс, дальше — относительные. */
  ticks: { index: number; label: string }[];
  /** Метки на графике: старт кампании, пик. */
  marks: { index: number; label: string }[];
};

const FLAT = [1, 1, 1, 1, 1, 1, 1] as const;
/** Недельный ритм: на корпоративной платформе будни активнее выходных, в акциях для покупателей — наоборот. */
const CONSUMER_WEEK = [0.9, 0.93, 0.96, 1.0, 1.1, 1.22, 1.18] as const;
const CLUB_WEEK = [1.0, 1.02, 1.04, 1.04, 1.02, 0.96, 0.92] as const;
const MASTER = 60;

function change(cur: number, prev: number, upIsGood = true): Delta {
  const pct = prev === 0 ? 0 : (cur / prev - 1) * 100;
  if (Math.abs(pct) < 0.05) {
    return { text: '0%', up: true, good: true, flat: true };
  }
  const up = pct >= 0;
  return { text: signedPercent(pct), up, good: up === upIsGood };
}
function changePoints(cur: number, prev: number, upIsGood = true): Delta {
  const diff = cur - prev;
  if (diff === 0) {
    return { text: '0 п.п.', up: true, good: true, flat: true };
  }
  const up = diff >= 0;
  return { text: signedPoints(diff), up, good: up === upIsGood };
}

/** Плитка «сколько»: сумма за период, изменение — к предыдущему такому же периоду. */
function countKpi(
  id: string,
  label: string,
  master: number[],
  n: PeriodId,
  extra: Partial<KpiData> = {},
): KpiData {
  const cur = tail(master, n);
  return {
    id,
    label,
    value: Math.round(sum(cur)),
    delta: change(sum(cur), sum(before(master, n))),
    spark: cur,
    ...extra,
  };
}

/** Плитка «доля»: среднее за период в процентах, изменение — в п.п. */
function rateKpi(
  id: string,
  label: string,
  master: number[],
  n: PeriodId,
  extra: Partial<KpiData> = {},
): KpiData {
  const cur = tail(master, n);
  const value = Math.round(mean(cur));
  return {
    id,
    label,
    value,
    suffix: '%',
    delta: changePoints(value, Math.round(mean(before(master, n)))),
    spark: cur,
    ...extra,
  };
}

/** Подписи оси X для ряда по дням. */
function dayTicks(n: PeriodId): DayChart['ticks'] {
  if (n === 7) {
    return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((label, index) => ({
      index,
      label,
    }));
  }
  return [
    { index: 0, label: `${n} дн. назад` },
    { index: Math.round((n - 1) / 2), label: `${Math.round(n / 2)} дн. назад` },
    { index: n - 1, label: 'сегодня' },
  ];
}

function dayChart(
  master: number[],
  n: PeriodId,
  withStart: { daysAgo: number; label: string } | null = null,
): DayChart {
  const values = tail(master, n).map((value) => Math.round(value));
  const marks: DayChart['marks'] = [];
  let top = 0;
  values.forEach((value, i) => {
    if (value > values[top]) top = i;
  });
  if (n > 7 || values[top] > mean(values) * 1.35) {
    marks.push({ index: top, label: 'Пик' });
  }
  if (withStart && withStart.daysAgo <= n - 1) {
    marks.push({ index: n - 1 - withStart.daysAgo, label: withStart.label });
  }
  return { values, ticks: dayTicks(n), marks };
}

/** Доли ступенек воронки → количество людей. */
function funnel(
  total: number,
  steps: readonly (readonly [string, number])[],
): FunnelStep[] {
  return steps.map(([label, share]) => ({
    label,
    share,
    count: Math.round((total * share) / 100),
  }));
}

/** Небольшой стабильный разброс долей между периодами. */
const wobble = (seed: string, spread: number) =>
  (rng(seed)() - 0.5) * 2 * spread;

/* ───────────── HR и внутриком ───────────── */

export type HrData = {
  kpis: KpiData[];
  onboarding: { steps: FunnelStep[]; worst: { label: string; drop: number } };
  modules: { label: string; share: number; count: number }[];
  activity: DayChart;
  offices: { name: string; points: number; was: number }[];
};

const OFFICES = [
  'Москва',
  'Санкт-Петербург',
  'Казань',
  'Екатеринбург',
  'Новосибирск',
  'Краснодар',
] as const;
/** Первые два и следующие два офиса идут «ноздря в ноздрю» — на живом рейтинге видны обгоны. */
const OFFICE_WEIGHTS = [24.6, 24.1, 16.6, 16.3, 11.5, 6.9] as const;

export function buildHr(n: PeriodId): HrData {
  const starts = series('hr-starts', MASTER, 18, { growth: 0.15 });
  const pass = series('hr-pass', MASTER, 86, {
    week: FLAT,
    noise: 0.018,
    growth: 0.08,
  });
  const modules = series('hr-modules', MASTER, 490, { growth: 0.2 });
  const active = series('hr-active', MASTER, 74, {
    week: FLAT,
    noise: 0.02,
    growth: 0.06,
  });
  const dau = series('hr-dau', MASTER, 3200, { growth: 0.1 });

  const kpis: KpiData[] = [
    countKpi('hr-new', 'Новичков в программе', starts, n, {
      cap: 'onboarding',
    }),
    rateKpi('hr-pass', 'Прошли онбординг', pass, n, { cap: 'onboarding' }),
    countKpi('hr-modules', 'Пройдено модулей', modules, n, {
      cap: 'learning',
      live: { every: 2, min: 2, max: 7 },
    }),
    rateKpi('hr-active', 'Активны за неделю', active, n, { cap: 'engagement' }),
  ];

  /** Последний шаг воронки — ровно та доля, что на плитке «Прошли онбординг»; шаги между ними убывают. */
  const passValue = kpis[1].value;
  const testShare = Math.max(passValue + 4, 91);
  const steps = funnel(kpis[0].value, [
    ['Регистрация', 100],
    ['Знакомство с компанией', 97],
    ['Тест по продукту', testShare],
    ['Первое задание', Math.round(testShare + passValue) / 2],
    ['Финал программы', passValue],
  ]);
  let worst = { label: steps[1].label, drop: 0 };
  for (let i = 1; i < steps.length; i += 1) {
    const drop = steps[i - 1].share - steps[i].share;
    if (drop > worst.drop) worst = { label: steps[i].label, drop };
  }

  const done = [96, 92, 86, 81, 77, 72].map((base, i) =>
    Math.round(base + wobble(`hr-mod-${n}-${i}`, 1.4)),
  );
  const totalPoints = Math.round(sum(tail(modules, n)) * 5.2);
  const offices = OFFICES.map((name, i) => ({
    name,
    points: Math.round(
      (totalPoints * OFFICE_WEIGHTS[i]) / 100 +
        wobble(`hr-office-${n}-${i}`, 0.03) * totalPoints * 0.1,
    ),
    was: Math.round(
      (totalPoints * OFFICE_WEIGHTS[i]) / 100 +
        wobble(`hr-office-prev-${n}-${i}`, 0.25) * totalPoints * 0.1,
    ),
  }));

  return {
    kpis,
    onboarding: { steps, worst },
    modules: done.map((share, i) => ({
      label: `${i + 1}`,
      share,
      count: Math.round((kpis[0].value * share) / 100),
    })),
    activity: dayChart(dau, n),
    offices,
  };
}

/* ───────────── Мероприятия ───────────── */

export type EventsData = {
  kpis: KpiData[];
  /** Онлайн «сейчас»: опорное значение, остальное считает живой виджет. */
  live: { online: number; peak: number; viewers: number; reactions: number };
  qr: { label: string; value: number }[];
  vote: { question: string; options: { label: string; votes: number }[] };
  channels: { label: string; share: number; cap: string }[];
};

export function buildEvents(n: PeriodId): EventsData {
  const reg = series('ev-reg', MASTER, 1330, {
    growth: 0.2,
    week: CONSUMER_WEEK,
  });
  const qr = series('ev-qr', MASTER, 940, { growth: 0.2, week: CONSUMER_WEEK });
  const quiz = series('ev-quiz', MASTER, 3850, {
    growth: 0.12,
    week: CONSUMER_WEEK,
  });
  const kpis: KpiData[] = [
    countKpi('ev-reg', 'Новых регистраций', reg, n, { cap: 'telegram' }),
    countKpi('ev-qr', 'Отсканировано QR', qr, n, {
      cap: 'qr',
      live: { every: 1, min: 1, max: 4 },
    }),
    countKpi('ev-quiz', 'Ответов в квизах', quiz, n, {
      cap: 'votes',
      live: { every: 1, min: 3, max: 11 },
    }),
  ];
  const qrTotal = kpis[1].value;
  const points: [string, number][] = [
    ['Регистрация', 30],
    ['Зона квизов', 23],
    ['Стойка партнёра', 18],
    ['Фотозона', 15],
    ['Мерч-стойка', 14],
  ];
  const qrCounts = split(
    qrTotal,
    points.map(([, share]) => share),
  );
  /** Голосование идёт «сейчас» и от периода не зависит. */
  const votesBase = [850, 608, 384];
  return {
    kpis,
    live: { online: 1284, peak: 1912, viewers: 6420, reactions: 8214 },
    qr: points.map(([label], i) => ({ label, value: qrCounts[i] })),
    vote: {
      question: 'Какой конкурс запускаем следующим?',
      options: [
        { label: 'Квиз по продукту', votes: votesBase[0] },
        { label: 'Командный челлендж', votes: votesBase[1] },
        { label: 'Колесо фортуны', votes: votesBase[2] },
      ],
    },
    channels: [
      { label: 'Telegram web app', share: 58, cap: 'telegram' },
      { label: 'QR на площадке', share: 29, cap: 'qr' },
      { label: 'Онлайн-трансляция', share: 13, cap: 'live' },
    ],
  };
}

/* ───────────── Лояльность и клубы ───────────── */

export type LoyaltyData = {
  kpis: KpiData[];
  members: number;
  levels: { label: string; share: number; count: number }[];
  levelUps: number;
  retention: number[];
  /** `weight` — доля спроса: по ней новые выдачи делятся между наградами. */
  rewards: { label: string; issued: number; stock: number; weight: number }[];
};

export function buildLoyalty(n: PeriodId): LoyaltyData {
  const joined = series('lo-new', MASTER, 140, {
    growth: 0.2,
    week: CLUB_WEEK,
  });
  const back = series('lo-back', MASTER, 71, {
    week: FLAT,
    noise: 0.02,
    growth: 0.08,
  });
  const points = series('lo-points', MASTER, 41000, {
    growth: 0.15,
    week: CLUB_WEEK,
  });
  const issued = series('lo-issued', MASTER, 40, {
    growth: 0.12,
    week: CLUB_WEEK,
  });
  const ups = series('lo-ups', MASTER, 9, { growth: 0.1, week: CLUB_WEEK });
  const kpis: KpiData[] = [
    countKpi('lo-new', 'Новых участников клуба', joined, n, { cap: 'clubs' }),
    rateKpi('lo-back', 'Возвращаются каждую неделю', back, n, {
      cap: 'programs',
    }),
    countKpi('lo-points', 'Баллов начислено', points, n, {
      cap: 'programs',
      live: { every: 2, min: 120, max: 460 },
    }),
    countKpi('lo-issued', 'Наград выдано', issued, n, {
      cap: 'shop',
      live: { every: 3, min: 1, max: 2 },
    }),
  ];
  const members = 6238;
  const shares = [38, 34, 20, 8];
  const names = ['Новичок', 'Участник', 'Эксперт', 'Легенда'];
  const retention = [100, 64, 52, 47, 44, 42, 41, 40, 39].map((v, i) =>
    i === 0 ? v : Math.round(v + wobble(`lo-ret-${n}-${i}`, 1.6)),
  );
  const rewardsBase: [string, number, number][] = [
    ['Мерч', 96, 64],
    ['Сертификаты', 71, 41],
    ['Скидки партнёров', 54, 88],
    ['Закрытые события', 33, 12],
    ['Именные призы', 19, 27],
  ];
  const issuedBy = split(
    kpis[3].value,
    rewardsBase.map(([, count]) => count),
  );
  return {
    kpis,
    members,
    levels: names.map((label, i) => ({
      label,
      share: shares[i],
      count: Math.round((members * shares[i]) / 100),
    })),
    levelUps: Math.round(sum(tail(ups, n))),
    retention,
    rewards: rewardsBase.map(([label, count, stock], i) => ({
      label,
      issued: issuedBy[i],
      stock,
      weight: count,
    })),
  };
}

/* ───────────── Спецпроекты ───────────── */

export type ExternalData = {
  kpis: KpiData[];
  route: FunnelStep[];
  reach: DayChart;
  games: { label: string; share: number; sessions: number }[];
  challenge: {
    goal: number;
    reached: number;
    teams: { label: string; points: number }[];
  };
  contest: { name: string; score: number }[];
};

export function buildExternal(n: PeriodId): ExternalData {
  const bumps = [
    [3, 1.55],
    [19, 1.4],
  ] as const;
  const users = series('ex-users', MASTER, 2300, {
    growth: 0.1,
    week: CONSUMER_WEEK,
    bumps,
  });
  const sessions = series('ex-sessions', MASTER, 7600, {
    growth: 0.1,
    week: CONSUMER_WEEK,
    bumps,
  });
  const finish = series('ex-finish', MASTER, 31, {
    week: FLAT,
    noise: 0.03,
    growth: 0.08,
  });
  const minutes = series('ex-time', MASTER, 3.8, { week: FLAT, noise: 0.04 });
  const curMin = mean(tail(minutes, n));
  const prevMin = mean(before(minutes, n));
  const kpis: KpiData[] = [
    countKpi('ex-users', 'Участников', users, n, { cap: 'brand' }),
    rateKpi('ex-finish', 'Дошли до финала', finish, n, { cap: 'promo' }),
    countKpi('ex-sessions', 'Игровых сессий', sessions, n, { cap: 'promo' }),
    {
      id: 'ex-time',
      label: 'Время в игре',
      value: Math.round(curMin * 10) / 10,
      decimals: 1,
      suffix: ' мин',
      delta: change(curMin, prevMin),
      spark: tail(minutes, n),
      cap: 'promo',
    },
  ];
  const visitors = Math.round(kpis[0].value / 0.46);
  const route = funnel(visitors, [
    ['Зашли на страницу', 100],
    ['Зарегистрировались', 46],
    ['Начали игру', 38],
    ['Дошли до финала', Math.min(kpis[1].value, 37)],
    ['Получили приз', Math.min(kpis[1].value, 37) - 7],
  ]);
  const games: [string, number][] = [
    ['Квиз', 38],
    ['Колесо фортуны', 24],
    ['Memory', 17],
    ['Кликер', 11],
    ['Ловля объектов', 7],
    ['Bingo', 3],
  ];
  const gameSessions = split(
    kpis[2].value,
    games.map(([, share]) => share),
  );
  const goal = 50000;
  const reached = Math.round(goal * (n === 7 ? 0.54 : n === 14 ? 0.75 : 0.93));
  const teamShare = [0.38, 0.33, 0.29];
  return {
    kpis,
    route,
    reach: dayChart(users, n, { daysAgo: 29, label: 'Старт кампании' }),
    games: games.map(([label, share], i) => ({
      label,
      share,
      sessions: gameSessions[i],
    })),
    challenge: {
      goal,
      reached,
      teams: ['Команда 1', 'Команда 2', 'Команда 3'].map((label, i) => ({
        label,
        points: Math.round(reached * teamShare[i]),
      })),
    },
    contest: [
      ['Участник 0412', 9840],
      ['Участник 1873', 9310],
      ['Участник 0097', 8760],
      ['Участник 2250', 8120],
      ['Участник 1536', 7690],
    ].map(([name, score]) => ({
      name: name as string,
      score: Math.round(
        (score as number) * (n === 7 ? 0.42 : n === 14 ? 0.7 : 1),
      ),
    })),
  };
}

/* ───────────── Трейд-маркетинг ───────────── */

export type TradeData = {
  kpis: KpiData[];
  statuses: {
    id: 'ok' | 'wait' | 'bad';
    label: string;
    share: number;
    count: number;
  }[];
  fund: {
    total: number;
    issued: number;
    tiers: { label: string; issued: number; total: number }[];
  };
  sku: { label: string; share: number; value: number }[];
  /** Почему отклоняют чеки: доли от отклонённых. */
  reasons: { label: string; share: number }[];
  daily: DayChart;
};

export function buildTrade(n: PeriodId): TradeData {
  const receipts = series('tr-receipts', MASTER, 2900, {
    growth: 0.25,
    week: CONSUMER_WEEK,
    bumps: [[4, 1.45]],
  });
  const ok = series('tr-ok', MASTER, 78, {
    week: FLAT,
    noise: 0.015,
    growth: 0.06,
  });
  const points = series('tr-points', MASTER, 61000, {
    growth: 0.25,
    week: CONSUMER_WEEK,
  });
  const prizes = series('tr-prizes', MASTER, 49, {
    growth: 0.2,
    week: CONSUMER_WEEK,
  });
  const kpis: KpiData[] = [
    countKpi('tr-receipts', 'Чеков загружено', receipts, n, {
      cap: 'receipts',
      live: { every: 1, min: 1, max: 5 },
    }),
    rateKpi('tr-ok', 'Чеков принято', ok, n, { cap: 'receipts' }),
    countKpi('tr-points', 'Баллов начислено', points, n, {
      cap: 'points',
      live: { every: 1, min: 80, max: 480 },
    }),
    countKpi('tr-prizes', 'Призов выдано', prizes, n, { cap: 'points' }),
  ];
  const accepted = kpis[1].value;
  const wait = 14;
  const bad = 100 - accepted - wait;
  const total = kpis[0].value;
  const statusCount = split(total, [accepted, wait, bad]);
  const tiers: [string, number, number][] = [
    ['Главные призы', 11, 20],
    ['Подарочные карты', 1640, 2800],
    ['Мерч', 3129, 5180],
  ];
  const skuShares: [string, number][] = [
    ['SKU A', 32],
    ['SKU B', 26],
    ['SKU C', 19],
    ['SKU D', 13],
    ['Прочие', 10],
  ];
  const skuCount = split(
    statusCount[0],
    skuShares.map(([, share]) => share),
  );
  return {
    kpis,
    statuses: [
      { id: 'ok', label: 'Принято', share: accepted, count: statusCount[0] },
      { id: 'wait', label: 'На проверке', share: wait, count: statusCount[1] },
      { id: 'bad', label: 'Отклонено', share: bad, count: statusCount[2] },
    ],
    fund: {
      total: tiers.reduce((acc, [, , t]) => acc + t, 0),
      issued: tiers.reduce((acc, [, i]) => acc + i, 0),
      tiers: tiers.map(([label, issued, tot]) => ({
        label,
        issued,
        total: tot,
      })),
    },
    reasons: [
      { label: 'Нет акционной позиции', share: 46 },
      { label: 'Чек вне периода акции', share: 31 },
      { label: 'Повторная загрузка чека', share: 23 },
    ],
    sku: skuShares.map(([label, share], i) => ({
      label,
      share,
      value: skuCount[i],
    })),
    daily: dayChart(receipts, n, { daysAgo: 29, label: 'Старт акции' }),
  };
}
