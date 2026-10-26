import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { heroCards, type HeroCard } from '@/data/landing';

/**
 * Слайдер первого экрана (coverflow). У каждой карточки — свой мини-интерфейс,
 * который показывает, что именно получает клиент: скорость, игры, кастом, баллы,
 * командный зачёт, Telegram/QR, аналитику. Вёрстка и 3D-позиции — в styles/showcase.css.
 *
 * Слотов семь: пять видимых (-2…2) и по одному скрытому с каждой стороны,
 * поэтому карточка, уходящая «за кадр», перепрыгивает на другую сторону незаметно.
 */

/** Размеры сцены в натуральных пикселях; на широком экране она масштабируется целиком. */
const SCENE_WIDTH = 1340;
const SCENE_HEIGHT = 450;
const DESKTOP_QUERY = '(min-width: 1100px)';
const TOTAL = heroCards.length;
const HALF = Math.floor(TOTAL / 2);
const INITIAL_ACTIVE = 0;
const SWIPE_THRESHOLD = 56;
const AUTOPLAY_MS = 5200;

function wrapOffset(index: number, active: number) {
  return ((index - active + TOTAL + HALF) % TOTAL) - HALF;
}

/* ───────────── Значки ───────────── */

type GlyphName =
  | 'check'
  | 'plus'
  | 'flag'
  | 'modules'
  | 'gift'
  | 'trophy'
  | 'quiz'
  | 'wheel'
  | 'memory'
  | 'clicker'
  | 'catch'
  | 'bingo'
  | 'plane';

function Glyph({ name }: { name: GlyphName }) {
  const props = {
    viewBox: '0 0 24 24',
    'aria-hidden': true,
    focusable: false,
  } as const;
  switch (name) {
    case 'check':
      return (
        <svg {...props}>
          <path
            d="m5 12.5 4.6 4.6L19 7.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'plus':
      return (
        <svg {...props}>
          <path
            d="M12 5v14M5 12h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'flag':
      return (
        <svg {...props}>
          <path
            fill="currentColor"
            d="M5 3h2.2v18H5zM8.4 4.2h11.2l-2.7 4.4 2.7 4.4H8.4z"
          />
        </svg>
      );
    case 'modules':
      return (
        <svg {...props}>
          <g fill="currentColor">
            <rect x="3" y="3" width="8" height="8" rx="2.2" />
            <rect x="13" y="3" width="8" height="8" rx="2.2" />
            <rect x="3" y="13" width="8" height="8" rx="2.2" />
            <rect x="13" y="13" width="8" height="8" rx="2.2" opacity=".4" />
          </g>
        </svg>
      );
    case 'gift':
      return (
        <svg {...props}>
          <g fill="currentColor">
            <rect x="3" y="9" width="18" height="4" rx="1.2" />
            <path d="M4.5 14h15v5.6a1.4 1.4 0 0 1-1.4 1.4H5.9a1.4 1.4 0 0 1-1.4-1.4z" />
            <path d="M12 9C9.4 9 7 8 7 6.3 7 5 8 4 9.3 4 11 4 12 6 12 9Zm0 0c2.6 0 5-1 5-2.7C17 5 16 4 14.7 4 13 4 12 6 12 9Z" />
          </g>
          <rect x="11" y="9" width="2" height="12" fill="var(--ui-cut)" />
        </svg>
      );
    case 'trophy':
      return (
        <svg {...props}>
          <g fill="currentColor">
            <path d="M7 3h10v6.2a5 5 0 0 1-10 0z" />
            <rect x="11" y="13.5" width="2" height="4" />
            <rect x="7.5" y="17" width="9" height="3.4" rx="1.4" />
          </g>
          <path
            d="M7 5H3.8v1.4A3.6 3.6 0 0 0 7.4 10M17 5h3.2v1.4a3.6 3.6 0 0 1-3.6 3.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'quiz':
      return (
        <svg {...props}>
          <path
            fill="currentColor"
            d="M12 3a8.5 8.5 0 0 0-8.5 8.5c0 2.3.9 4.4 2.5 5.9L5 21l4.3-1.9c.9.3 1.8.4 2.7.4a8.5 8.5 0 0 0 0-17Z"
          />
          <path
            d="M9.6 9.6a2.4 2.4 0 1 1 3.6 2c-.8.5-1.2 1-1.2 1.8"
            fill="none"
            stroke="var(--ui-cut)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="15.9" r="1.2" fill="var(--ui-cut)" />
        </svg>
      );
    case 'wheel':
      return (
        <svg {...props}>
          <circle cx="12" cy="13" r="8" fill="currentColor" />
          <path
            d="M12 5v16M5.1 9l13.8 8M18.9 9 5.1 17"
            stroke="var(--ui-cut)"
            strokeWidth="1.6"
          />
          <circle cx="12" cy="13" r="2" fill="var(--ui-cut)" />
          <path fill="currentColor" d="M12 1.6l2.5 3.6h-5z" />
        </svg>
      );
    case 'memory':
      return (
        <svg {...props}>
          <rect
            x="3"
            y="6"
            width="11"
            height="14"
            rx="2.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="10"
            y="4"
            width="11"
            height="14"
            rx="2.6"
            fill="currentColor"
          />
          <path
            fill="var(--ui-cut)"
            d="m15.5 7.6 1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"
          />
        </svg>
      );
    case 'clicker':
      return (
        <svg {...props}>
          <path
            fill="currentColor"
            d="M7 3.5 19 13l-5.2 1 3 6.2-2.6 1.2-3-6.2L7 18.6z"
          />
          <path
            d="M3.5 8.5a6 6 0 0 1 2.6-4.4M3 13.6a9 9 0 0 1-.2-3.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'catch':
      return (
        <svg {...props}>
          <path
            fill="currentColor"
            d="M3.5 11h17l-1.9 8.2a2.2 2.2 0 0 1-2.1 1.7H7.5a2.2 2.2 0 0 1-2.1-1.7z"
          />
          <circle cx="8.5" cy="5.2" r="2" fill="currentColor" />
          <circle cx="15" cy="3.8" r="1.7" fill="currentColor" />
          <circle cx="13" cy="8.4" r="1.4" fill="currentColor" />
        </svg>
      );
    case 'bingo':
      return (
        <svg {...props}>
          <g fill="currentColor">
            {[0, 1, 2].flatMap((row) =>
              [0, 1, 2].map((col) => (
                <rect
                  key={`${row}-${col}`}
                  x={3 + col * 6.7}
                  y={3 + row * 6.7}
                  width="5.3"
                  height="5.3"
                  rx="1.5"
                  opacity={(row + col) % 2 === 0 ? 1 : 0.38}
                />
              )),
            )}
          </g>
        </svg>
      );
    case 'plane':
      return (
        <svg {...props}>
          <path
            fill="currentColor"
            d="M21.6 3.2 2.9 10.4c-.9.4-.9 1.6.1 1.9l4.7 1.5 1.8 5.5c.3.9 1.4 1.1 2 .4l2.7-2.9 4.6 3.4c.8.6 1.9.2 2.1-.8L23.1 4.6c.2-1-.7-1.7-1.5-1.4Z"
          />
        </svg>
      );
  }
}

/** QR-код-иллюстрация. Точки считаются детерминированно, чтобы сервер и клиент рисовали одно и то же. */
function QrCode() {
  const size = 15;
  let seed = 11;
  const bit = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return (seed >>> 17) % 2 === 1;
  };
  const cells = [] as { x: number; y: number }[];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nearRight = x >= size - 5;
      const nearBottom = y >= size - 5;
      const finder =
        (x < 5 && y < 5) || (nearRight && y < 5) || (x < 5 && nearBottom);
      let on: boolean;
      if (finder) {
        const fx = x < 5 ? x : x - (size - 5);
        const fy = y < 5 ? y : y - (size - 5);
        on =
          fx === 0 ||
          fx === 4 ||
          fy === 0 ||
          fy === 4 ||
          (fx === 2 && fy === 2);
      } else {
        on = bit();
      }
      if (on) cells.push({ x, y });
    }
  }
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {cells.map(({ x, y }) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
      ))}
    </svg>
  );
}

/* ───────────── Мини-интерфейсы карточек ───────────── */

function SpeedUi() {
  return (
    <>
      <ol className="ui-steps">
        <li className="is-done">
          <span className="ui-steps__dot">
            <Glyph name="check" />
          </span>
          <b>Бриф</b>
        </li>
        <li className="is-now">
          <span className="ui-steps__dot">
            <i />
          </span>
          <b>Сборка</b>
        </li>
        <li>
          <span className="ui-steps__dot">
            <Glyph name="flag" />
          </span>
          <b>Запуск</b>
        </li>
      </ol>
      <ul className="ui-checks">
        <li>
          <span className="ui-checks__mark">
            <Glyph name="check" />
          </span>
          Готовые модули
          <em>основа</em>
        </li>
        <li className="ui-checks__idea">
          <span className="ui-checks__mark">
            <Glyph name="plus" />
          </span>
          Кастом под задачу
          <em>что угодно</em>
        </li>
      </ul>
    </>
  );
}

const GAMES: readonly (readonly [GlyphName, string])[] = [
  ['quiz', 'Квиз'],
  ['wheel', 'Колесо'],
  ['memory', 'Memory'],
  ['clicker', 'Кликер'],
  ['catch', 'Ловля'],
  ['bingo', 'Bingo'],
];

function GamesUi() {
  return (
    <div className="ui-games">
      {GAMES.map(([glyph, label]) => (
        <span className="ui-tile" key={label}>
          <Glyph name={glyph} />
          <b>{label}</b>
        </span>
      ))}
    </div>
  );
}

const CUSTOM_ROWS = [
  'Механика и сценарий',
  'Дизайн и бренд',
  'Интеграции с сервисами',
];

function CustomUi() {
  return (
    <ul className="ui-checks">
      {CUSTOM_ROWS.map((row) => (
        <li key={row}>
          <span className="ui-checks__mark">
            <Glyph name="check" />
          </span>
          {row}
          <em>под вас</em>
        </li>
      ))}
      <li className="ui-checks__idea">
        <span className="ui-checks__mark">
          <Glyph name="plus" />
        </span>
        Ваша идея — соберём
      </li>
    </ul>
  );
}

const BOARD = [
  { rank: 1, share: 100, points: '1 480' },
  { rank: 2, share: 92, points: '1 360' },
  { rank: 3, share: 84, points: '1 240', me: true },
] as const;

function RewardsUi() {
  return (
    <>
      <div className="ui-points">
        <div>
          <small>Ваши баллы</small>
          <strong>1 240</strong>
        </div>
        <span className="ui-prize">
          <Glyph name="gift" />
          <small>до приза 260</small>
        </span>
      </div>
      <div className="ui-bar">
        <i style={{ width: '83%' }} />
      </div>
      <ol className="ui-board">
        {BOARD.map((row) => (
          <li key={row.rank} className={'me' in row ? 'is-me' : undefined}>
            <b>{row.rank}</b>
            <span className="ui-board__bar">
              <i style={{ width: `${row.share}%` }} />
            </span>
            <em>{row.points}</em>
            {'me' in row ? <u>Вы</u> : null}
          </li>
        ))}
      </ol>
    </>
  );
}

const TEAMS = [
  { city: 'Москва', points: '2 480', share: 100 },
  { city: 'Санкт-Петербург', points: '2 215', share: 89 },
  { city: 'Казань', points: '1 960', share: 79 },
] as const;

function TeamsUi() {
  return (
    <>
      <div className="ui-teams__head">
        <Glyph name="trophy" />
        <b>Общий зачёт</b>
        <small>города</small>
      </div>
      {TEAMS.map((team) => (
        <div className="ui-team" key={team.city}>
          <div>
            <b>{team.city}</b>
            <em>{team.points}</em>
          </div>
          <span className="ui-team__bar">
            <i style={{ width: `${team.share}%` }} />
          </span>
        </div>
      ))}
    </>
  );
}

function OnlineUi() {
  return (
    <div className="ui-online">
      <span className="ui-qr">
        <QrCode />
      </span>
      <ol className="ui-flow">
        <li>
          <b>1</b>
          Сканируют QR
        </li>
        <li>
          <b>2</b>
          Задание в Telegram
        </li>
        <li>
          <b>3</b>
          Баллы на счёт
        </li>
      </ol>
      <span className="ui-online__tag">
        <Glyph name="plane" />
        Telegram web app
      </span>
    </div>
  );
}

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;
const DAY_BARS = [44, 66, 100, 22, 87, 53, 33] as const;

function AnalyticsUi() {
  return (
    <>
      <div className="ui-kpis">
        <div className="ui-kpi">
          <small>Участники</small>
          <em>+5%</em>
          <strong>8 430</strong>
        </div>
        <div className="ui-kpi">
          <small>Participation rate</small>
          <strong>74%</strong>
        </div>
      </div>
      <div className="ui-chart">
        <small>Активность по дням</small>
        <div className="ui-chart__bars">
          {DAY_BARS.map((height, index) => (
            <span key={DAYS[index]}>
              <i style={{ height: `${height}%` }} />
              <b>{DAYS[index]}</b>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

function CardUi({ id }: { id: HeroCard['id'] }) {
  switch (id) {
    case 'speed':
      return <SpeedUi />;
    case 'games':
      return <GamesUi />;
    case 'custom':
      return <CustomUi />;
    case 'rewards':
      return <RewardsUi />;
    case 'teams':
      return <TeamsUi />;
    case 'online':
      return <OnlineUi />;
    case 'analytics':
      return <AnalyticsUi />;
  }
}

/* ───────────── Карточка и карусель ───────────── */

function ShowcaseCard({
  card,
  index,
  offset,
  onSelect,
}: {
  card: HeroCard;
  index: number;
  offset: number;
  onSelect: () => void;
}) {
  const hidden = Math.abs(offset) > 2;
  return (
    <article
      className="showcase__card"
      data-offset={String(offset)}
      data-card={card.id}
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} из ${TOTAL}: ${card.title}`}
      aria-hidden={hidden || undefined}
      onClick={onSelect}
    >
      <div className="showcase__top">
        <span>{card.tag}</span>
        {card.demo ? <small>демо-данные</small> : null}
      </div>
      <h3 className="showcase__title">
        {card.titleLines[0]}
        <br />
        {card.titleLines[1]}
      </h3>
      <p className="showcase__text">{card.text}</p>
      <div
        className={`showcase__ui showcase__ui--${card.id}`}
        aria-hidden="true"
      >
        <CardUi id={card.id} />
      </div>
    </article>
  );
}

export function HeroCarousel() {
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(INITIAL_ACTIVE);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const resumeTimerRef = useRef<number | null>(null);
  const dragRef = useRef<{
    pointerId: number | null;
    startX: number;
    lastX: number;
    dragging: boolean;
    moved: boolean;
  }>({
    pointerId: null,
    startX: 0,
    lastX: 0,
    dragging: false,
    moved: false,
  });

  const pauseAutoplay = useCallback(() => {
    setPaused(true);
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const resumeAutoplaySoon = useCallback(() => {
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = window.setTimeout(() => {
      setPaused(false);
      resumeTimerRef.current = null;
    }, AUTOPLAY_MS);
  }, []);

  /** Широкий экран: сцена целиком масштабируется под ширину. Узкий: карточки в натуральную величину, без масштаба. */
  const fit = useCallback(() => {
    const stage = stageRef.current;
    const scene = sceneRef.current;
    if (!stage || !scene) return;
    if (!window.matchMedia(DESKTOP_QUERY).matches) {
      scene.style.transform = '';
      stage.style.height = '';
      return;
    }
    const scale = Math.min(1, stage.clientWidth / SCENE_WIDTH);
    scene.style.transform = `scale(${scale})`;
    stage.style.height = `${Math.round(SCENE_HEIGHT * scale)}px`;
  }, []);

  const goTo = useCallback((index: number) => {
    setActive(((index % TOTAL) + TOTAL) % TOTAL);
  }, []);

  const move = useCallback((delta: number) => {
    setActive((current) => (current + delta + TOTAL) % TOTAL);
  }, []);

  useEffect(() => {
    fit();
    const stage = stageRef.current;
    if (!stage) return undefined;
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    window.addEventListener('resize', fit);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [fit]);

  /* Листаем только пока слайдер на экране. */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !inView) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      if (dragRef.current.dragging) return;
      move(1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, inView, move]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  const select = useCallback(
    (index: number) => {
      goTo(index);
      pauseAutoplay();
      resumeAutoplaySoon();
    },
    [goTo, pauseAutoplay, resumeAutoplaySoon],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      const drag = dragRef.current;
      drag.pointerId = event.pointerId;
      drag.startX = event.clientX;
      drag.lastX = event.clientX;
      drag.dragging = true;
      drag.moved = false;
      pauseAutoplay();
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add('is-dragging');
    },
    [pauseAutoplay],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag.dragging || drag.pointerId !== event.pointerId) return;
      drag.lastX = event.clientX;
      if (Math.abs(event.clientX - drag.startX) > 8) {
        drag.moved = true;
      }
    },
    [],
  );

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag.dragging || drag.pointerId !== event.pointerId) return;
      drag.dragging = false;
      drag.pointerId = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
      event.currentTarget.classList.remove('is-dragging');

      const deltaX = drag.lastX - drag.startX;
      if (drag.moved && Math.abs(deltaX) >= SWIPE_THRESHOLD) {
        const steps = Math.max(1, Math.round(Math.abs(deltaX) / 160));
        move(deltaX < 0 ? steps : -steps);
      }
      resumeAutoplaySoon();
    },
    [move, resumeAutoplaySoon],
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (drag.pointerId !== event.pointerId) return;
      drag.dragging = false;
      drag.pointerId = null;
      event.currentTarget.classList.remove('is-dragging');
      resumeAutoplaySoon();
    },
    [resumeAutoplaySoon],
  );

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        select(active + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        select(active - 1);
      }
    },
    [active, select],
  );

  return (
    <div
      className="showcase"
      role="region"
      aria-roledescription="carousel"
      aria-label="Возможности платформы"
      onKeyDown={onKeyDown}
    >
      <div
        className="showcase__stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={onPointerCancel}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') pauseAutoplay();
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse' && !dragRef.current.dragging) {
            resumeAutoplaySoon();
          }
        }}
      >
        <div className="showcase__scene" id="showcase-scene" ref={sceneRef}>
          <div className="showcase__space">
            {heroCards.map((card, index) => (
              <ShowcaseCard
                key={card.id}
                card={card}
                index={index}
                offset={wrapOffset(index, active)}
                onSelect={() => {
                  if (dragRef.current.moved) return;
                  select(index);
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="showcase__pager">
        {heroCards.map((card, index) => (
          <button
            type="button"
            key={card.id}
            className="showcase__dot"
            aria-label={`Показать: ${card.title}`}
            aria-current={index === active ? 'true' : undefined}
            onClick={() => select(index)}
          />
        ))}
      </div>
    </div>
  );
}
