import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { heroCards, type HeroCard } from '@/data/landing';
import { ArrowIcon } from '@/components/ui/ArrowIcon';

/**
 * Слайдер первого экрана (coverflow). У каждой карточки — свой мини-интерфейс,
 * который показывает, что именно получает клиент: игру в фирменном оформлении, баллы и награды,
 * Telegram/QR, аналитику, механику на заказ. Вёрстка и 3D-позиции — в styles/showcase.css.
 *
 * Карточек пять: три видны (-1…1), по одной ждёт «за кадром» с каждой стороны (±2),
 * поэтому уходящая карточка перепрыгивает на другую сторону незаметно.
 * Автопрокрутку ведёт CSS-анимация заполнения активной точки: когда она закончилась — следующий слайд.
 * Так индикатор всегда совпадает с таймером, а пауза (наведение, фокус с клавиатуры, перетаскивание,
 * кнопка) — это просто `animation-play-state`.
 */

/** Размеры сцены в натуральных пикселях; на широком экране она масштабируется целиком. */
const SCENE_WIDTH = 1340;
const SCENE_HEIGHT = 450;
const DESKTOP_QUERY = '(min-width: 1100px)';
const TOTAL = heroCards.length;
const HALF = Math.floor(TOTAL / 2);
const INITIAL_ACTIVE = 0;
const SWIPE_THRESHOLD = 56;
/** Карточки дальше этого расстояния от центра не видны (ждут «за кадром»). */
const VISIBLE_RADIUS = 1;

function wrapOffset(index: number, active: number) {
  return ((index - active + TOTAL + HALF) % TOTAL) - HALF;
}

/* ───────────── Значки ───────────── */

type GlyphName = 'check' | 'plus' | 'gift' | 'quiz' | 'plane';

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

/**
 * Игры: одна и та же игра в оформлении трёх брендов. Меняются цвета и форма элементов (оформление),
 * условие на старте (правила) и приз (награды) — ровно то, что мы подстраиваем под клиента.
 * Названий игр здесь нет: полный список — в разделе «Механики и возможности».
 */
const SKINS = [
  { skin: 'blue', rule: '30 с', prize: '+50', widths: [64, 78, 52] },
  { skin: 'warm', rule: '1/5', prize: 'Мерч', widths: [72, 48, 66] },
  { skin: 'mint', rule: '2/3', prize: '−15%', widths: [56, 70, 60] },
] as const;

/** Какой из трёх ответов в мини-экране выбран (номер с нуля). */
const PICKED_ANSWER = 1;

function GamesUi() {
  return (
    <div className="ui-skins">
      {SKINS.map(({ skin, rule, prize, widths }) => (
        <span className="ui-skin" data-skin={skin} key={skin}>
          <span className="ui-skin__head">
            <i className="ui-skin__logo" />
            <span className="ui-skin__rule">{rule}</span>
          </span>
          <span className="ui-skin__question">
            <Glyph name="quiz" />
            <span className="ui-skin__lines">
              <i />
              <i />
            </span>
          </span>
          <span className="ui-skin__answers">
            {widths.map((width, index) => (
              <span
                className={`ui-skin__answer${index === PICKED_ANSWER ? ' is-picked' : ''}`}
                key={index}
              >
                <i style={{ width: `${width}%` }} />
                {index === PICKED_ANSWER ? <Glyph name="check" /> : null}
              </span>
            ))}
          </span>
          <span className="ui-skin__prize">
            <Glyph name="gift" />
            {prize}
          </span>
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
          <small>Доля участвующих</small>
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
    case 'games':
      return <GamesUi />;
    case 'custom':
      return <CustomUi />;
    case 'rewards':
      return <RewardsUi />;
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
  const hidden = Math.abs(offset) > VISIBLE_RADIUS;
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

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
      <rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M8 5.2v13.6a.8.8 0 0 0 1.2.7l10.6-6.8a.8.8 0 0 0 0-1.4L9.2 4.5A.8.8 0 0 0 8 5.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function HeroCarousel() {
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(INITIAL_ACTIVE);
  /** Кнопка «Пауза»: человек сам остановил автопрокрутку. */
  const [playing, setPlaying] = useState(true);
  /** Временная пауза: мышь над слайдером, фокус с клавиатуры внутри, перетаскивание. */
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [inView, setInView] = useState(true);
  /** Индикатор автопрокрутки включаем после гидратации: раньше обработчик конца анимации не подключён. */
  const [mounted, setMounted] = useState(false);
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
  const running = !hovered && !focused && !dragging && inView;

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
    setMounted(true);
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

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      const drag = dragRef.current;
      drag.pointerId = event.pointerId;
      drag.startX = event.clientX;
      drag.lastX = event.clientX;
      drag.dragging = true;
      drag.moved = false;
      setDragging(true);
      // Захват указателя включаем не сразу, а когда пользователь реально потащил (см. onPointerMove):
      // при захвате браузер отправляет click на сам слайдер, и клик по соседней карточке до неё не доходит.
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag.dragging || drag.pointerId !== event.pointerId) return;
      drag.lastX = event.clientX;
      if (!drag.moved && Math.abs(event.clientX - drag.startX) > 8) {
        drag.moved = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.classList.add('is-dragging');
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
      setDragging(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      event.currentTarget.classList.remove('is-dragging');

      const deltaX = drag.lastX - drag.startX;
      if (drag.moved && Math.abs(deltaX) >= SWIPE_THRESHOLD) {
        const steps = Math.max(1, Math.round(Math.abs(deltaX) / 160));
        move(deltaX < 0 ? steps : -steps);
      }
    },
    [move],
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (drag.pointerId !== event.pointerId) return;
      drag.dragging = false;
      drag.pointerId = null;
      setDragging(false);
      event.currentTarget.classList.remove('is-dragging');
    },
    [],
  );

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(active + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(active - 1);
      }
    },
    [active, goTo],
  );

  return (
    <div
      className="showcase"
      role="region"
      aria-roledescription="carousel"
      aria-label="Возможности платформы"
      data-playing={playing ? 'true' : 'false'}
      onKeyDown={onKeyDown}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setHovered(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'mouse') return;
        setHovered(false);
        const drag = dragRef.current;
        // Нажали и ушли за край слайдера, не успев потащить: захвата ещё нет, отпускание сюда не придёт.
        if (drag.dragging && !drag.moved) {
          drag.dragging = false;
          drag.pointerId = null;
          setDragging(false);
        }
      }}
      // Фокус с клавиатуры ставит автопрокрутку на паузу; фокус после клика мышью — нет.
      onFocus={(event) => {
        if (event.target.matches(':focus-visible')) setFocused(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
    >
      <div
        className="showcase__stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={onPointerCancel}
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
                  goTo(index);
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="showcase__controls">
        <button
          type="button"
          className="showcase__arrow"
          aria-label="Предыдущий слайд"
          onClick={() => goTo(active - 1)}
        >
          <ArrowIcon direction="left" />
        </button>
        <div className="showcase__pager" role="group" aria-label="Выбор слайда">
          {heroCards.map((card, index) => {
            const current = index === active;
            return (
              <button
                type="button"
                key={card.id}
                className="showcase__dot"
                aria-label={`Слайд ${index + 1} из ${TOTAL}: ${card.title}`}
                aria-current={current ? 'true' : undefined}
                onClick={() => goTo(index)}
              >
                {current && mounted ? (
                  <span
                    className="showcase__dot-fill"
                    style={{
                      animationPlayState: running ? 'running' : 'paused',
                    }}
                    onAnimationEnd={(event) => {
                      if (event.animationName === 'showcase-dot-fill') move(1);
                    }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="showcase__arrow"
          aria-label="Следующий слайд"
          onClick={() => goTo(active + 1)}
        >
          <ArrowIcon direction="right" />
        </button>
        <button
          type="button"
          className="showcase__playpause"
          aria-label={
            playing ? 'Остановить автопрокрутку' : 'Включить автопрокрутку'
          }
          onClick={() => setPlaying((value) => !value)}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>
    </div>
  );
}
