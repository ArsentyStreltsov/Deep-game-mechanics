import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { heroCards } from '@/data/landing';

const BASE_WIDTH = 2048;
const BASE_HEIGHT = 567;
/** Visual scale vs the original 2048×567 prototype (~half height). */
const DESIGN_SCALE = 0.5;
const TOTAL = heroCards.length;
const INITIAL_ACTIVE = 2;
const SWIPE_THRESHOLD = 56;
const AUTOPLAY_MS = 4200;

type Card = (typeof heroCards)[number];
type IconName = Card['icon'];

function wrapOffset(index: number, active: number) {
  return ((index - active + TOTAL + 2) % TOTAL) - 2;
}

function CoverflowIcon({ name }: { name: IconName }) {
  switch (name) {
    case 'span':
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 48 48">
          <path
            d="M30 7c-7.6 2.1-13.2 10.2-14.9 20.1l8.3 7.6C33.6 29.1 39.4 20.6 37 9a29 29 0 0 0-7-2Z"
            fill="currentColor"
          />
          <circle cx="27.5" cy="20.5" fill="#f7fbff" r="3.5" />
          <path
            d="m17.5 29-7 5 1-10 6-4m4 12-5 9-1-7"
            fill="currentColor"
          />
        </svg>
      );
    case 'launch':
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 48 48">
          <path
            d="M9 15a8 8 0 0 1 8-8h14a8 8 0 0 1 8 8l2 15a7 7 0 0 1-12 6l-5-4-5 4a7 7 0 0 1-12-6l2-15Z"
            fill="currentColor"
          />
          <path
            d="M16 18v10m-5-5h10"
            stroke="white"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <circle cx="30" cy="20" fill="white" r="2.5" />
          <circle cx="35" cy="25" fill="white" r="2.5" />
        </svg>
      );
    case 'cost':
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 48 48">
          <path
            d="m24 6 5.7 11.7 13 1.8-9.4 9.1 2.3 12.8L24 35.3 12.4 41.4l2.2-12.8-9.3-9.1 13-1.8L24 6Z"
            fill="currentColor"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        </svg>
      );
    case 'team':
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 48 48">
          <rect fill="currentColor" height="32" rx="8" width="32" x="8" y="8" />
          <path
            d="M17 32V23m7 9V17m7 15v-7"
            stroke="white"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
      );
    default:
      return null;
  }
}

function TitleLines({ lines, long }: { lines: readonly string[]; long?: boolean }) {
  return (
    <h2 className={`coverflow__title${long ? ' coverflow__title--long' : ''}`}>
      {lines.map((line, index) => (
        <span key={line}>
          {index > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </h2>
  );
}

function SubLines({ lines }: { lines: readonly string[] }) {
  return (
    <div className="coverflow__sub">
      {lines.map((line, index) => (
        <span key={line}>
          {index > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </div>
  );
}

function Avatars() {
  return (
    <div className="coverflow__avatars" aria-hidden="true">
      <span className="coverflow__avatar coverflow__avatar--a">А</span>
      <span className="coverflow__avatar coverflow__avatar--b">М</span>
      <span className="coverflow__avatar coverflow__avatar--c">С</span>
      <span className="coverflow__count">+</span>
    </div>
  );
}

function CoverflowCard({
  card,
  offset,
  onSelect,
}: {
  card: Card;
  offset: number;
  onSelect: () => void;
}) {
  const isProgress = card.type === 'progress';

  return (
    <article
      className={`coverflow__card${isProgress ? ' coverflow__card--progress coverflow__card--plus' : ''}`}
      data-offset={String(offset)}
      aria-label={card.title}
      aria-current={offset === 0 ? 'true' : 'false'}
      onClick={onSelect}
    >
      {isProgress ? (
        <>
          <div className="coverflow__progress-circle" aria-hidden="true">
            <svg viewBox="0 0 324 324">
              <circle
                className="coverflow__ring-track"
                cx="162"
                cy="162"
                fill="none"
                pathLength="100"
                r="138"
                strokeWidth="29"
              />
              <circle
                className="coverflow__ring-fill"
                cx="162"
                cy="162"
                fill="none"
                pathLength="100"
                r="138"
                strokeWidth="29"
              />
            </svg>
            <div className="coverflow__ring-label">{card.meta}</div>
            <div className="coverflow__ring-value">+</div>
          </div>
          <div className="coverflow__info">
            <h2 className="coverflow__center-title">
              {card.titleLines.map((line, index) => (
                <span key={line}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </h2>
            <SubLines lines={card.subtitleLines} />
          </div>
        </>
      ) : (
        <>
          <div className="coverflow__icon">
            <CoverflowIcon name={card.icon} />
          </div>
          <TitleLines lines={card.titleLines} long={'longTitle' in card && card.longTitle} />
          <div className="coverflow__info">
            {card.type === 'timer' && card.meta ? (
              <div className="coverflow__micro">{card.meta}</div>
            ) : null}
            <SubLines lines={card.subtitleLines} />
            {card.type === 'team' ? <Avatars /> : null}
          </div>
        </>
      )}
    </article>
  );
}

export function HeroCarousel() {
  const holderRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(INITIAL_ACTIVE);
  const [paused, setPaused] = useState(false);
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

  const fit = useCallback(() => {
    const holder = holderRef.current;
    const scene = sceneRef.current;
    if (!holder || !scene) return;
    if (holder.closest('.preview')) {
      scene.style.transform = 'none';
      holder.style.height = '';
      return;
    }
    const scale = Math.min(DESIGN_SCALE, holder.clientWidth / BASE_WIDTH);
    scene.style.transform = `scale(${scale})`;
    holder.style.height = `${Math.round(BASE_HEIGHT * scale)}px`;
  }, []);

  const goTo = useCallback((index: number) => {
    setActive(((index % TOTAL) + TOTAL) % TOTAL);
  }, []);

  const move = useCallback(
    (delta: number) => {
      setActive((current) => (current + delta + TOTAL) % TOTAL);
    },
    [],
  );

  useEffect(() => {
    fit();
    const holder = holderRef.current;
    if (!holder) return undefined;
    const observer = new ResizeObserver(fit);
    observer.observe(holder);
    window.addEventListener('resize', fit);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [fit]);

  useEffect(() => {
    if (paused) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      if (dragRef.current.dragging) return;
      move(1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, move]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
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
      pauseAutoplay();
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add('coverflow--dragging');
    },
    [pauseAutoplay],
  );

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.dragging || drag.pointerId !== event.pointerId) return;
    drag.lastX = event.clientX;
    if (Math.abs(event.clientX - drag.startX) > 8) {
      drag.moved = true;
    }
  }, []);

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag.dragging || drag.pointerId !== event.pointerId) return;
      drag.dragging = false;
      drag.pointerId = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
      event.currentTarget.classList.remove('coverflow--dragging');

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
      event.currentTarget.classList.remove('coverflow--dragging');
      resumeAutoplaySoon();
    },
    [resumeAutoplaySoon],
  );

  return (
    <div
      className="coverflow"
      ref={holderRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={onPointerCancel}
      onPointerEnter={pauseAutoplay}
      onPointerLeave={() => {
        if (!dragRef.current.dragging) resumeAutoplaySoon();
      }}
    >
      <div
        className="coverflow__scene"
        id="coverflow-scene"
        ref={sceneRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Карусель преимуществ платформы"
      >
        <div className="coverflow__space">
          {heroCards.map((card, index) => (
            <CoverflowCard
              key={card.id}
              card={card}
              offset={wrapOffset(index, active)}
              onSelect={() => {
                if (dragRef.current.moved) return;
                goTo(index);
                pauseAutoplay();
                resumeAutoplaySoon();
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
