import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { figmaAssets } from '@/lib/figma-assets';
import { ArrowIcon } from '@/components/ui/ArrowIcon';

const cards = [
  {
    id: 'sales',
    title: 'Турнир продаж',
    icon: 'rocket',
    variant: 'timer',
    timerLabel: 'До конца',
  },
  { id: 'quiz', title: 'Командный квиз', icon: 'gamepad', variant: 'team' },
  {
    id: 'progress',
    title: 'Прогресс',
    icon: 'users',
    variant: 'progress',
  },
  {
    id: 'hello',
    title: 'Привет, команда!',
    icon: 'star',
    variant: 'timer',
    timerLabel: 'До начала трансляции',
  },
  { id: 'leaders', title: 'Лидеры недели', icon: 'chart', variant: 'watch' },
] as const;

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(2);
  const [failedIcons, setFailedIcons] = useState<string[]>([]);
  const dragStart = useRef<number | null>(null);
  const dragged = useRef(false);

  function move(direction: number) {
    setActiveIndex(
      (current) => (current + direction + cards.length) % cards.length,
    );
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    dragStart.current = event.clientX;
    dragged.current = false;
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (
      dragStart.current !== null &&
      !dragged.current &&
      Math.abs(event.clientX - dragStart.current) > 8
    ) {
      dragged.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragStart.current === null) return;
    const distance = event.clientX - dragStart.current;
    if (Math.abs(distance) > 32) {
      dragged.current = true;
      move(distance < 0 ? 1 : -1);
    }
    dragStart.current = null;
  }

  return (
    <div
      className="hero-carousel"
      role="group"
      aria-label="Карусель игровых карточек. Перетаскивайте, нажимайте на карточки или используйте стрелки клавиатуры."
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        dragStart.current = null;
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          move(1);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      <div className="hero-carousel__belly" aria-hidden="true" />
      <div className="hero-carousel__stage" aria-hidden="true" />
      {cards.map((card, index) => {
        const offset =
          ((index - activeIndex + cards.length + 2) % cards.length) - 2;
        const distance = Math.abs(offset);
        const fallbackGlyph = {
          rocket: '↗',
          gamepad: '✣',
          users: '●',
          star: '★',
          chart: '▥',
        }[card.icon];

        // Soft coverflow with air between cards
        const shiftX =
          Math.sign(offset) * (distance === 1 ? 118 : distance === 2 ? 228 : 0);
        const arcY = distance === 0 ? 22 : distance === 1 ? 10 : 4;
        const scale = distance === 0 ? 1 : distance === 1 ? 0.94 : 0.88;
        const angle = offset * (distance === 1 ? 7 : 12);
        const cardStyle = {
          '--shift': `${shiftX}%`,
          '--arc': `${arcY}px`,
          '--depth': `${(2 - distance) * 36}px`,
          '--angle': `${angle}deg`,
          '--scale': scale,
          '--opacity': distance === 0 ? 1 : distance === 1 ? 0.96 : 0.9,
          zIndex: 20 - distance,
        } as CSSProperties;

        return (
          <button
            className={`hero-carousel__card hero-carousel__card--${card.variant} hero-carousel__card--distance-${distance}`}
            type="button"
            style={cardStyle}
            key={card.id}
            aria-label={`Показать карточку «${card.title}» в центре`}
            aria-current={index === activeIndex ? 'true' : undefined}
            onClick={() => {
              if (dragged.current) {
                dragged.current = false;
                return;
              }
              setActiveIndex(index);
            }}
          >
            <span className="hero-carousel__glass" aria-hidden="true" />
            <span className="hero-carousel__bulge" aria-hidden="true" />
            {card.variant === 'progress' ? (
              <div className="hero-carousel__progress">
                <div className="hero-carousel__ring" aria-hidden="true">
                  <svg viewBox="0 0 120 120">
                    <circle className="hero-carousel__ring-track" cx="60" cy="60" r="48" />
                    <circle className="hero-carousel__ring-value" cx="60" cy="60" r="48" />
                  </svg>
                  <div className="hero-carousel__ring-copy">
                    <span>Прогресс</span>
                    <strong>68%</strong>
                  </div>
                </div>
                <span className="hero-carousel__progress-caption">
                  Вместе к цели
                </span>
                <span className="hero-carousel__avatars" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <b>+142</b>
                </span>
              </div>
            ) : (
              <>
                <span
                  className={`hero-carousel__icon${failedIcons.includes(card.id) ? ' is-failed' : ''}`}
                >
                  <img
                    src={figmaAssets.heroCarouselIcons[card.icon]}
                    alt=""
                    onError={() =>
                      setFailedIcons((current) =>
                        current.includes(card.id)
                          ? current
                          : [...current, card.id],
                      )
                    }
                  />
                  {failedIcons.includes(card.id) && (
                    <span aria-hidden="true">{fallbackGlyph}</span>
                  )}
                </span>
                <strong className="hero-carousel__title">{card.title}</strong>
                {card.variant === 'team' ? (
                  <div className="hero-carousel__team">
                    <span>Текущая активность</span>
                    <span className="hero-carousel__avatars" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <b>+24</b>
                    </span>
                  </div>
                ) : card.variant === 'timer' ? (
                  <div className="hero-carousel__timer">
                    <span>
                      {'timerLabel' in card ? card.timerLabel : 'До начала'}
                    </span>
                    <strong>01:23:45</strong>
                  </div>
                ) : (
                  <span className="hero-carousel__watch">
                    СМОТРЕТЬ
                    <span className="hero-carousel__watch-icon" aria-hidden="true">
                      <ArrowIcon />
                    </span>
                  </span>
                )}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
