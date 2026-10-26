import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { cssVars } from '@/lib/css-vars';
import {
  compact,
  fmt,
  monotonePath,
  niceMax,
  plotPoints,
  rng,
  split,
} from '@/lib/demo-data';
import type { DayChart, FunnelStep, KpiData } from '@/data/analytics';

/* ───────────── Живой пульс ─────────────
   Один общий тик раз в 1,2 с для всех «живых» виджетов вкладки. Тикает только пока блок на экране,
   страница открыта и анимации не выключены в системе. Без этого (и при SSR) тик = 0, и виджеты
   показывают опорные значения. Значения «сейчас» — чистые функции тика, поэтому детерминированы. */

const LiveContext = createContext(0);
export const useTick = () => useContext(LiveContext);
const MAX_TICK = 900;

export function LiveProvider({
  rootRef,
  paused = false,
  children,
}: {
  rootRef: RefObject<HTMLElement | null>;
  /** Пауза по кнопке: значения замирают, но не сбрасываются. */
  paused?: boolean;
  children: ReactNode;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const root = rootRef.current;
    if (
      paused ||
      !root ||
      !document.documentElement.classList.contains('motion-ok')
    ) {
      return;
    }
    let visible = false;
    let timer = 0;
    const sync = () => {
      window.clearInterval(timer);
      if (visible && !document.hidden) {
        timer = window.setInterval(
          () => setTick((value) => Math.min(MAX_TICK, value + 1)),
          1200,
        );
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.2 },
    );
    observer.observe(root);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.clearInterval(timer);
    };
  }, [rootRef, paused]);
  return <LiveContext.Provider value={tick}>{children}</LiveContext.Provider>;
}

/** Накопленная прибавка к счётчику за `tick` тиков: раз в `every` тиков +от…до. */
export function liveBonus(
  seed: string,
  spec: { every: number; min: number; max: number },
  tick: number,
) {
  const rand = rng(`bonus-${seed}`);
  let bonus = 0;
  for (let i = 1; i <= Math.min(tick, MAX_TICK); i += 1) {
    const roll = rand();
    if (i % spec.every === 0) {
      bonus += spec.min + Math.floor(roll * (spec.max - spec.min + 1));
    }
  }
  return bonus;
}

/** Счётчики, которые растут с тиками: каждый тик добавляется несколько единиц, распределённых по весам. */
export function liveCounts(
  base: readonly number[],
  weights: readonly number[],
  tick: number,
  seed: string,
  perTick: readonly [number, number],
) {
  const rand = rng(`counts-${seed}`);
  const total = weights.reduce((acc, w) => acc + w, 0);
  const out = [...base];
  for (let t = 1; t <= Math.min(tick, MAX_TICK); t += 1) {
    const n = perTick[0] + Math.floor(rand() * (perTick[1] - perTick[0] + 1));
    for (let k = 0; k < n; k += 1) {
      let pick = rand() * total;
      let index = 0;
      while (index < weights.length - 1 && pick >= weights[index]) {
        pick -= weights[index];
        index += 1;
      }
      out[index] += 1;
    }
  }
  return out;
}

/* ───────────── Мелкие иконки ───────────── */

type IconProps = { size?: number };
const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 16 16',
  'aria-hidden': true as const,
  focusable: false as const,
});
export const IconUp = ({ size = 10 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M8 3l5.5 9h-11z" fill="currentColor" />
  </svg>
);
export const IconDown = ({ size = 10 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M8 13L2.5 4h11z" fill="currentColor" />
  </svg>
);
export const IconCheck = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <path
      d="M3.5 8.5l3 3 6-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export const IconClock = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <circle
      cx="8"
      cy="8"
      r="5.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <path
      d="M8 5v3.2l2 1.3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export const IconCross = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <path
      d="M4 4l8 8M12 4l-8 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
export const IconWarn = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <path
      d="M8 2.2l6.3 11H1.7z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M8 6.4v3.4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle cx="8" cy="11.7" r="0.9" fill="currentColor" />
  </svg>
);

export const IconInfo = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <circle
      cx="8"
      cy="8"
      r="5.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M8 7.2v3.6"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <circle cx="8" cy="5.1" r="0.95" fill="currentColor" />
  </svg>
);
export const IconFlat = ({ size = 10 }: IconProps) => (
  <svg {...base(size)}>
    <path
      d="M3 8h10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/* ───────────── Подсказка ───────────── */

type TipContent = { title?: string; value: string; label?: string };
type TipState = TipContent & { x: number | string; y: number | string };

/** Подсказка при наведении и с клавиатуры. Позиция — в пикселях рамки или в процентах графика. */
export function useTip() {
  const frame = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  return {
    frame,
    tip,
    atPointer(
      event: { clientX: number; clientY: number },
      content: TipContent,
    ) {
      const rect = frame.current?.getBoundingClientRect();
      if (rect) {
        setTip({
          ...content,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }
    },
    /** Подсказка над элементом; `lift` — на сколько выше (над подписью значения). */
    atElement(element: Element, content: TipContent, lift = 0) {
      const rect = frame.current?.getBoundingClientRect();
      const box = element.getBoundingClientRect();
      if (rect) {
        setTip({
          ...content,
          x: box.left + box.width / 2 - rect.left,
          y: box.top - rect.top - lift,
        });
      }
    },
    atPercent(x: number, y: number, content: TipContent) {
      setTip({ ...content, x: `${x}%`, y: `${y}%` });
    },
    hide: () => setTip(null),
  };
}

export function Tip({
  tip,
  edge,
}: {
  tip: TipState | null;
  edge?: 'start' | 'end';
}) {
  if (!tip) return null;
  const px = (value: number | string) =>
    typeof value === 'number' ? `${value}px` : value;
  return (
    <div
      className="dash-tip"
      role="tooltip"
      data-edge={edge}
      style={{ left: px(tip.x), top: px(tip.y) }}
    >
      {tip.title && <small>{tip.title}</small>}
      <span>
        <b>{tip.value}</b>
        {tip.label && <em>{tip.label}</em>}
      </span>
    </div>
  );
}

/** Таблица для скринридеров: все значения графика доступны без наведения. */
export function DataTable({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: [string, string];
  rows: [string, string][];
}) {
  return (
    <table className="visually-hidden">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{head[0]}</th>
          <th scope="col">{head[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, value]) => (
          <tr key={name}>
            <th scope="row">{name}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ───────────── Оболочка карточки ───────────── */

export function LiveBadge({ label = 'LIVE · демо' }: { label?: string }) {
  return (
    <span className="dash-live">
      <i aria-hidden="true" />
      {label}
    </span>
  );
}

export function Card({
  title,
  sub,
  cap,
  w,
  live,
  children,
  className = '',
}: {
  title: string;
  sub?: ReactNode;
  /** Возможности, к которым относится виджет (через пробел). */
  cap: string;
  /** Ширина на широком экране, из 12 колонок. */
  w: 4 | 5 | 6 | 7 | 12;
  live?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`dash-card dash-widget ${className}`.trim()}
      data-cap={cap}
      data-w={w}
      data-spot
    >
      <header className="dash-card__head">
        <h3>{title}</h3>
        {live && <LiveBadge />}
        {sub && <p>{sub}</p>}
      </header>
      {children}
    </article>
  );
}

/* ───────────── Плитка показателя ───────────── */

function Spark({ values }: { values: number[] }) {
  const { line, area } = useMemo(() => {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const pad = (max - min || max || 1) * 0.15;
    const path = monotonePath(plotPoints(values, max + pad, min - pad, 10));
    return { line: path, area: `${path}L100 100L0 100Z` };
  }, [values]);
  return (
    <svg
      className="dash-spark"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path className="dash-spark__fill" d={area} />
      <path
        className="dash-spark__line"
        d={line}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Num({ data, value }: { data: KpiData; value: number }) {
  return (
    <AnimatedNumber
      value={value}
      decimals={data.decimals ?? 0}
      suffix={data.suffix ?? ''}
      duration={data.live ? 600 : 1100}
    />
  );
}

/** Значение, которое подписано на тики (только у плиток с `live`). */
function LiveNum({ data }: { data: KpiData }) {
  const tick = useTick();
  const spec = data.live;
  const bonus = spec ? liveBonus(data.id, spec, tick) : 0;
  return <Num data={data} value={data.value + bonus} />;
}

export function Delta({ delta, vs }: { delta: KpiData['delta']; vs: string }) {
  const text = delta.text.replace(/^[+−]/, '');
  return (
    <span
      className="dash-delta"
      data-good={delta.flat ? undefined : delta.good}
      data-flat={delta.flat ? 'true' : undefined}
      title={`К ${vs}`}
      aria-label={
        delta.flat
          ? `Без изменений к ${vs}`
          : `${delta.up ? 'Рост' : 'Снижение'} ${text} к ${vs}`
      }
    >
      {delta.flat ? <IconFlat /> : delta.up ? <IconUp /> : <IconDown />}
      {text}
    </span>
  );
}

export function Kpi({
  data,
  vs,
  w = 3,
}: {
  data: KpiData;
  vs: string;
  /** Ширина на широком экране, из 12 колонок. */
  w?: 3 | 4;
}) {
  return (
    <article
      className="dash-card dash-kpi"
      data-cap={data.cap}
      data-w={w}
      data-spot
    >
      <span className="dash-kpi__label">{data.label}</span>
      <div className="dash-kpi__line">
        <strong>
          {data.live ? (
            <LiveNum data={data} />
          ) : (
            <Num data={data} value={data.value} />
          )}
        </strong>
        <Delta delta={data.delta} vs={vs} />
      </div>
      <Spark values={data.spark} />
    </article>
  );
}

/* ───────────── Воронка ───────────── */

export function Funnel({
  steps,
  name,
  note,
  tone = 'info',
}: {
  steps: FunnelStep[];
  name: string;
  /** Вывод из данных под воронкой. */
  note?: ReactNode;
  /** `warn` — на что обратить внимание; `info` — просто вывод. */
  tone?: 'info' | 'warn';
}) {
  return (
    <>
      <ol className="dash-funnel" aria-label={name}>
        {steps.map((step, i) => (
          <li
            key={step.label}
            style={cssVars({ '--i': i, '--w': `${step.share}%` })}
          >
            <span className="dash-funnel__label">{step.label}</span>
            <span className="dash-hbar">
              <i />
            </span>
            <span className="dash-funnel__val">
              <b>{fmt(step.count)}</b>
              <small>{fmt(step.share, step.share % 1 ? 1 : 0)}%</small>
            </span>
          </li>
        ))}
      </ol>
      {note && (
        <p className="dash-callout" data-tone={tone}>
          {tone === 'warn' ? <IconWarn size={16} /> : <IconInfo size={16} />}
          <span>{note}</span>
        </p>
      )}
    </>
  );
}

/* ───────────── Столбцы ───────────── */

export function Columns({
  items,
  name,
  unit,
  caption,
}: {
  items: { label: string; share: number; count: number }[];
  name: string;
  unit: string;
  caption: string;
}) {
  const { frame, tip, atElement, hide } = useTip();
  const [active, setActive] = useState<number | null>(null);
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const show = (i: number) => {
    const item = items[i];
    const el = refs.current[i];
    setActive(i);
    if (el) {
      atElement(
        el,
        {
          title: `Модуль ${item.label}`,
          value: `${item.share}%`,
          label: `${unit}: ${fmt(item.count)}`,
        },
        20,
      );
    }
  };
  const leave = () => {
    setActive(null);
    hide();
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next =
      active === null
        ? 0
        : Math.min(
            items.length - 1,
            Math.max(0, active + (event.key === 'ArrowRight' ? 1 : -1)),
          );
    show(next);
  };
  return (
    <div className="dash-cols" ref={frame}>
      <div
        className="dash-cols__plot"
        tabIndex={0}
        role="group"
        aria-label={`${name}. Стрелки влево и вправо — значения по модулям`}
        onKeyDown={onKey}
        onFocus={() => show(active ?? 0)}
        onBlur={leave}
        onPointerLeave={leave}
      >
        {items.map((item, i) => (
          <div
            key={item.label}
            className="dash-col"
            data-active={active === i}
            style={cssVars({ '--i': i, '--h': `${item.share}%` })}
            onPointerEnter={() => show(i)}
          >
            <b>{item.share}%</b>
            <span
              className="dash-col__bar"
              ref={(el) => {
                refs.current[i] = el;
              }}
            />
          </div>
        ))}
      </div>
      <div className="dash-cols__x" aria-hidden="true">
        {items.map((item) => (
          <span key={item.label}>{item.label}</span>
        ))}
      </div>
      <p className="dash-cols__caption">{caption}</p>
      <Tip tip={tip} />
      <DataTable
        caption={name}
        head={['Модуль', 'Прошли, %']}
        rows={items.map((item) => [item.label, `${item.share}%`])}
      />
    </div>
  );
}

/* ───────────── График по дням ───────────── */

export function AreaChart({
  chart,
  name,
  unit,
  titleFor,
  max: fixedMax,
  suffix = '',
  pulse = true,
}: {
  chart: DayChart;
  name: string;
  unit: string;
  titleFor: (index: number) => string;
  /** Верх оси; по умолчанию подбирается «красивым» числом. Для процентов — 100. */
  max?: number;
  /** Приставка к значениям: «%». */
  suffix?: string;
  /** Пульсирующая точка на последнем значении — «сейчас». Для ряда не по времени её нет. */
  pulse?: boolean;
}) {
  const { values, ticks, marks } = chart;
  const n = values.length;
  const max = fixedMax ?? niceMax(Math.max(...values) * 1.1);
  const pts = useMemo(() => plotPoints(values, max, 0, 8), [values, max]);
  const line = useMemo(() => monotonePath(pts), [pts]);
  const [active, setActive] = useState<number | null>(null);
  const plot = useRef<HTMLDivElement>(null);
  const uid = useId();
  const y = (v: number) => 8 + (1 - v / max) * 84;
  const last = pts[n - 1];

  const at = (clientX: number) => {
    const rect = plot.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const ratio = (clientX - rect.left) / rect.width;
    setActive(Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1)))));
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    setActive((current) =>
      current === null
        ? n - 1
        : Math.min(
            n - 1,
            Math.max(0, current + (event.key === 'ArrowRight' ? 1 : -1)),
          ),
    );
  };
  const point = active === null ? null : pts[active];
  const edge = point
    ? point[0] < 22
      ? 'start'
      : point[0] > 78
        ? 'end'
        : undefined
    : undefined;

  return (
    <div className="dash-chart">
      <div className="dash-chart__y" aria-hidden="true">
        {[max, max / 2, 0].map((v) => (
          <span key={v} style={{ top: `${y(v)}%` }}>
            {compact(v)}
            {suffix}
          </span>
        ))}
      </div>
      <div
        className="dash-chart__plot"
        ref={plot}
        tabIndex={0}
        role="group"
        aria-label={`${name}. Стрелки влево и вправо — значения по дням`}
        aria-describedby={`${uid}-live`}
        onPointerMove={(event: PointerEvent) => at(event.clientX)}
        onPointerDown={(event: PointerEvent) => at(event.clientX)}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKey}
        onFocus={() => setActive((current) => current ?? n - 1)}
        onBlur={() => setActive(null)}
      >
        {[max, max / 2, 0].map((v) => (
          <i
            key={v}
            className={`dash-grid${v === 0 ? ' dash-grid--base' : ''}`}
            style={{ top: `${y(v)}%` }}
            aria-hidden="true"
          />
        ))}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="dash-area__fill"
            d={`${line}L100 ${y(0)}L0 ${y(0)}Z`}
          />
          <path
            className="dash-area__line"
            d={line}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {marks.map((mark) => (
          <span
            key={mark.label}
            className="dash-mark"
            data-edge={
              pts[mark.index][0] < 18
                ? 'start'
                : pts[mark.index][0] > 82
                  ? 'end'
                  : undefined
            }
            style={{
              left: `${pts[mark.index][0]}%`,
              top: `${pts[mark.index][1]}%`,
            }}
          >
            <i aria-hidden="true" />
            <em>{mark.label}</em>
          </span>
        ))}
        {pulse && (
          <span
            className="dash-dot"
            aria-hidden="true"
            style={{ left: `${last[0]}%`, top: `${last[1]}%` }}
          />
        )}
        {point && active !== null && (
          <>
            <i
              className="dash-cursor"
              style={{ left: `${point[0]}%` }}
              aria-hidden="true"
            />
            <span
              className="dash-dot dash-dot--hover"
              aria-hidden="true"
              style={{ left: `${point[0]}%`, top: `${point[1]}%` }}
            />
            <Tip
              edge={edge}
              tip={{
                x: `${point[0]}%`,
                y: `${point[1]}%`,
                title: titleFor(active),
                value: `${fmt(values[active])}${suffix}`,
                label: unit,
              }}
            />
          </>
        )}
      </div>
      <div className="dash-chart__x" aria-hidden="true">
        {ticks.map((tick) => (
          <span
            key={tick.index}
            data-edge={
              tick.label.length <= 4
                ? 'mid'
                : tick.index === 0
                  ? 'start'
                  : tick.index === n - 1
                    ? 'end'
                    : 'mid'
            }
            style={{ left: `${n === 1 ? 50 : (tick.index / (n - 1)) * 100}%` }}
          >
            {tick.label}
          </span>
        ))}
      </div>
      <span id={`${uid}-live`} className="visually-hidden" aria-live="polite">
        {active === null
          ? ''
          : `${titleFor(active)}: ${fmt(values[active])}${suffix} ${unit}`}
      </span>
      <DataTable
        caption={name}
        head={['День', unit]}
        rows={values.map((value, i) => [titleFor(i), `${fmt(value)}${suffix}`])}
      />
    </div>
  );
}

/* ───────────── Горизонтальные столбики ───────────── */

export function HBar({ share, lead }: { share: number; lead?: boolean }) {
  return (
    <span className="dash-hbar" data-lead={lead ? 'true' : undefined}>
      <i style={{ width: `${Math.max(0, Math.min(100, share))}%` }} />
    </span>
  );
}

export type BarRow = {
  key: string;
  label: ReactNode;
  value: number;
  /** Доля от максимума, 0…100 — длина столбика. */
  share: number;
  note?: ReactNode;
  cap?: string;
};

/** Список «название — столбик — число»; первая строка — акцентная (форма «акцент + остальное»). */
export function BarList({
  rows,
  name,
  valueSuffix = '',
  emphasis = true,
}: {
  rows: BarRow[];
  name: string;
  valueSuffix?: string;
  emphasis?: boolean;
}) {
  const top = Math.max(...rows.map((row) => row.value));
  return (
    <ul className="dash-bars" aria-label={name} role="list">
      {rows.map((row, i) => (
        <li key={row.key} style={cssVars({ '--i': i })} data-cap={row.cap}>
          <span className="dash-bars__label">{row.label}</span>
          <HBar share={row.share} lead={emphasis && row.value === top} />
          <span className="dash-bars__val">
            <b>
              {fmt(row.value)}
              {valueSuffix}
            </b>
            {row.note && <small>{row.note}</small>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ───────────── Рейтинг офисов (живой) ───────────── */

export function Leaderboard({
  rows,
  name,
}: {
  rows: { name: string; points: number; was: number }[];
  name: string;
}) {
  const tick = useTick();
  const points = useMemo(() => {
    const rand = rng('board-live');
    const out = rows.map((row) => row.points);
    const total = out.reduce((acc, value) => acc + value, 0);
    for (let t = 1; t <= Math.min(tick, MAX_TICK); t += 1) {
      const index = Math.floor(rand() * rows.length);
      out[index] += Math.round(total * (0.0015 + rand() * 0.004));
    }
    return out;
  }, [rows, tick]);
  const rankOf = (values: number[]) => {
    const order = values
      .map((value, i) => [value, i] as const)
      .sort((a, b) => b[0] - a[0]);
    const rank: number[] = [];
    order.forEach(([, i], r) => {
      rank[i] = r;
    });
    return rank;
  };
  const rank = rankOf(points);
  const was = rankOf(rows.map((row) => row.was));
  const top = Math.max(...points);

  return (
    <ol
      className="dash-board"
      aria-label={name}
      style={cssVars({ '--n': rows.length })}
    >
      {rows.map((row, i) => {
        const moved = was[i] - rank[i];
        return (
          <li
            key={row.name}
            style={cssVars({
              '--rank': rank[i],
              '--w': `${(points[i] / top) * 100}%`,
            })}
            data-lead={rank[i] === 0 ? 'true' : undefined}
            aria-label={`${row.name}: ${rank[i] + 1} место, ${fmt(points[i])} баллов`}
          >
            <span className="dash-board__rank">{rank[i] + 1}</span>
            <span className="dash-board__name">{row.name}</span>
            <span
              className="dash-hbar"
              data-lead={rank[i] === 0 ? 'true' : undefined}
            >
              <i />
            </span>
            <span className="dash-board__pts">
              <AnimatedNumber value={points[i]} duration={500} />
            </span>
            <span
              className="dash-board__move"
              data-dir={moved > 0 ? 'up' : moved < 0 ? 'down' : 'flat'}
              title={
                moved === 0
                  ? 'Место то же, что в прошлом периоде'
                  : `${moved > 0 ? 'Поднялся' : 'Опустился'} на ${Math.abs(moved)} к прошлому периоду`
              }
            >
              {moved > 0 && <IconUp size={9} />}
              {moved < 0 && <IconDown size={9} />}
              {moved === 0 ? '–' : Math.abs(moved)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ───────────── Составная полоса + легенда ───────────── */

export type Segment = {
  id: string;
  label: string;
  share: number;
  count?: number;
  color: string;
  icon?: ReactNode;
};

export function StackBar({
  segments,
  name,
  unit,
}: {
  segments: Segment[];
  name: string;
  unit: string;
}) {
  const { frame, tip, atElement, hide } = useTip();
  const show = (element: Element, segment: Segment) =>
    atElement(element, {
      title: segment.label,
      value: `${fmt(segment.share, segment.share % 1 ? 1 : 0)}%`,
      label:
        segment.count === undefined
          ? undefined
          : `${unit}: ${fmt(segment.count)}`,
    });
  return (
    <div className="dash-stack" ref={frame}>
      <div
        className="dash-stack__bar"
        role="img"
        aria-label={`${name}: ${segments.map((s) => `${s.label} ${s.share}%`).join(', ')}`}
      >
        {segments.map((segment, i) => (
          <span
            key={segment.id}
            className="dash-stack__seg"
            tabIndex={0}
            style={{
              ...cssVars({ '--i': i, '--c': segment.color }),
              flexGrow: segment.share,
            }}
            onPointerEnter={(event) => show(event.currentTarget, segment)}
            onPointerLeave={hide}
            onFocus={(event) => show(event.currentTarget, segment)}
            onBlur={hide}
          />
        ))}
      </div>
      <ul className="dash-stack__legend" role="list">
        {segments.map((segment) => (
          <li key={segment.id}>
            <span className="dash-stack__name">
              <i style={{ background: segment.color }} aria-hidden="true" />
              {segment.icon}
              {segment.label}
            </span>
            <b>{fmt(segment.share, segment.share % 1 ? 1 : 0)}%</b>
            {segment.count !== undefined && (
              <small>
                {fmt(segment.count)} {unit.toLowerCase()}
              </small>
            )}
          </li>
        ))}
      </ul>
      <Tip tip={tip} />
    </div>
  );
}

/* ───────────── Шкала «выдано из» ───────────── */

export function Meter({
  value,
  total,
  label,
  big = false,
}: {
  value: number;
  total: number;
  label: ReactNode;
  big?: boolean;
}) {
  const share = total === 0 ? 0 : (value / total) * 100;
  return (
    <div className="dash-meter" data-big={big ? 'true' : undefined}>
      <div className="dash-meter__head">
        <span>{label}</span>
        <b>
          {fmt(value)}
          <small> из {fmt(total)}</small>
        </b>
      </div>
      <span
        className="dash-meter__track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={value}
      >
        <i style={{ width: `${share}%` }} />
      </span>
    </div>
  );
}

/* ───────────── Поток значений «онлайн сейчас» ───────────── */

const WALK_LENGTH = MAX_TICK + 60;
const walkCache = new Map<string, number[]>();

/** Случайное блуждание вокруг `base`, нормированное так, чтобы в точке `anchor` значение было ровно `base`. */
function walk(seed: string, base: number, amp: number, anchor: number) {
  const key = `${seed}-${base}-${amp}-${anchor}`;
  const cached = walkCache.get(key);
  if (cached) return cached;
  const rand = rng(seed);
  const raw: number[] = [];
  let value = 0;
  for (let i = 0; i < WALK_LENGTH; i += 1) {
    value += (rand() - 0.5) * amp * 0.5 - value * 0.06;
    raw.push(value);
  }
  const shift = base - raw[anchor];
  const out = raw.map((item) => Math.round(item + shift));
  walkCache.set(key, out);
  return out;
}

const WINDOW = 40;

export function LiveStream({
  online,
  peak,
  viewers,
  reactions,
  accentLabel,
}: {
  online: number;
  peak: number;
  viewers: number;
  reactions: number;
  accentLabel: string;
}) {
  const tick = useTick();
  const samples = walk('events-online', online, 260, WINDOW - 1);
  const from = Math.min(tick, MAX_TICK);
  const window = samples.slice(from, from + WINDOW);
  const now = window[window.length - 1];
  const extra = liveBonus(
    'events-reactions',
    { every: 1, min: 2, max: 9 },
    tick,
  );
  const lo = Math.min(...window);
  const hi = Math.max(...window);
  const pad = (hi - lo || 1) * 0.25;
  const pts = plotPoints(window, hi + pad, lo - pad, 6);
  const line = monotonePath(pts);
  const bestNow = Math.max(peak, hi);
  const last = pts[pts.length - 1];

  return (
    <div className="dash-stream">
      <div className="dash-stream__now">
        <small>{accentLabel}</small>
        <strong>
          <AnimatedNumber value={now} duration={500} />
        </strong>
        <span>человек смотрят эфир</span>
      </div>
      <div className="dash-stream__plot" aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <path className="dash-area__fill" d={`${line}L100 100L0 100Z`} />
          <path
            className="dash-area__line"
            d={line}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span
          className="dash-dot"
          style={{ left: `${last[0]}%`, top: `${last[1]}%` }}
        />
      </div>
      <dl className="dash-stream__stats">
        <div>
          <dt>Пик эфира</dt>
          <dd>{fmt(bestNow)}</dd>
        </div>
        <div>
          <dt>Всего смотрели</dt>
          <dd>{fmt(viewers + Math.round(tick * 1.7))}</dd>
        </div>
        <div>
          <dt>Реакций</dt>
          <dd>{fmt(reactions + extra)}</dd>
        </div>
      </dl>
    </div>
  );
}

/* ───────────── Живой список чеков ───────────── */

const FEED_ITEMS = 5;

type FeedItem = {
  id: number;
  status: 'ok' | 'wait' | 'bad';
  points: number;
  age: number;
};

/** Чек №i: статус и баллы — по зерну; рождается раз в 2 тика. */
function feedItem(index: number, tick: number): FeedItem {
  const rand = rng(`feed-${index}`);
  const roll = rand();
  const status = roll < 0.74 ? 'ok' : roll < 0.9 ? 'wait' : 'bad';
  const points = [80, 120, 150][Math.floor(rand() * 3)];
  const born = (index - (FEED_ITEMS - 1)) * 2;
  return { id: index, status, points, age: Math.max(0, (tick - born) * 1.2) };
}

function ageLabel(seconds: number) {
  if (seconds < 3) return 'сейчас';
  if (seconds < 60) return `${Math.round(seconds)} с`;
  return `${Math.floor(seconds / 60)} мин`;
}

export function ReceiptFeed({ name }: { name: string }) {
  const tick = useTick();
  const newest = FEED_ITEMS - 1 + Math.floor(tick / 2);
  const items: FeedItem[] = [];
  for (let k = newest; k > newest - FEED_ITEMS; k -= 1)
    items.push(feedItem(k, tick));
  const text = {
    ok: (item: FeedItem) => `Чек принят · +${item.points} баллов`,
    wait: () => 'Чек на проверке · сверяем с ОФД',
    bad: () => 'Чек отклонён · нет акционной позиции',
  } as const;
  const icon = {
    ok: <IconCheck />,
    wait: <IconClock />,
    bad: <IconCross />,
  } as const;
  return (
    <ul className="dash-feed" aria-label={name} role="list">
      {items.map((item) => (
        <li key={item.id} data-status={item.status}>
          <span className="dash-feed__icon">{icon[item.status]}</span>
          <span className="dash-feed__text">{text[item.status](item)}</span>
          <small>{ageLabel(item.age)}</small>
        </li>
      ))}
    </ul>
  );
}

/* ───────────── Голосование (живое) ───────────── */

export function Votes({
  question,
  options,
  weights,
  name,
}: {
  question: string;
  options: { label: string; votes: number }[];
  /** Куда уходят новые голоса: чем больше вес, тем быстрее растёт столбик. */
  weights: readonly number[];
  name: string;
}) {
  const tick = useTick();
  const counts = liveCounts(
    options.map((option) => option.votes),
    weights,
    tick,
    'votes',
    [2, 6],
  );
  const total = counts.reduce((acc, value) => acc + value, 0);
  const percent = split(100, counts);
  const top = Math.max(...counts);
  return (
    <div className="dash-votes">
      <p className="dash-question">{question}</p>
      <ul className="dash-bars" aria-label={name} role="list">
        {options.map((option, i) => (
          <li key={option.label} style={cssVars({ '--i': i })}>
            <span className="dash-bars__label">{option.label}</span>
            <HBar share={(counts[i] / top) * 100} lead={counts[i] === top} />
            <span className="dash-bars__val">
              <b>{percent[i]}%</b>
              <small>{fmt(counts[i])}</small>
            </span>
          </li>
        ))}
      </ul>
      <p className="dash-note">
        Всего голосов:{' '}
        <b>
          <AnimatedNumber value={total} duration={500} />
        </b>
      </p>
    </div>
  );
}
