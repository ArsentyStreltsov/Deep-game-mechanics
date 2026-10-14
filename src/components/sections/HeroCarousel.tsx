import { useState } from 'react';
import { figmaAssets } from '@/lib/figma-assets';
import { heroCards } from '@/data/landing';
import { ThreeDCarousel } from '@/components/ui/ThreeDCarousel';
import { ArrowIcon } from '@/components/ui/ArrowIcon';

const FALLBACK: Record<(typeof heroCards)[number]['icon'], string> = {
  rocket: '↗',
  gamepad: '▣',
  users: '●',
  star: '★',
  chart: '▥',
};

function HeroCard({
  card,
  isActive,
}: {
  card: (typeof heroCards)[number];
  isActive: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <article
      className={`hero-carousel__card hero-carousel__card--${card.type}${isActive ? ' is-current' : ''}`}
      aria-current={isActive ? 'true' : undefined}
      aria-label={card.title}
    >
      <span className="hero-carousel__glass" aria-hidden="true" />
      <span className="hero-carousel__bulge" aria-hidden="true" />

      {card.type === 'progress' ? (
        <div className="hero-carousel__progress">
          <div className="hero-carousel__ring" aria-hidden="true">
            <svg viewBox="0 0 120 120">
              <circle className="hero-carousel__ring-track" cx="60" cy="60" r="48" />
              <circle className="hero-carousel__ring-value" cx="60" cy="60" r="48" />
            </svg>
            <div className="hero-carousel__ring-copy">
              <span>{card.meta}</span>
              <strong>+</strong>
            </div>
          </div>
          <strong className="hero-carousel__title">{card.title}</strong>
          <span className="hero-carousel__progress-caption">{card.subtitle}</span>
        </div>
      ) : (
        <>
          <span className={`hero-carousel__icon${failed ? ' is-failed' : ''}`}>
            <img
              src={figmaAssets.heroCarouselIcons[card.icon]}
              alt=""
              onError={() => setFailed(true)}
            />
            {failed && <span aria-hidden="true">{FALLBACK[card.icon]}</span>}
          </span>
          <strong className="hero-carousel__title">{card.title}</strong>

          {card.type === 'timer' ? (
            <div className="hero-carousel__timer">
              <span>{card.meta}</span>
              <strong>{card.subtitle}</strong>
            </div>
          ) : card.type === 'team' ? (
            <div className="hero-carousel__team">
              <span>{card.meta}</span>
              <span className="hero-carousel__avatars" aria-hidden="true">
                <i />
                <i />
                <i />
                <b>+</b>
              </span>
            </div>
          ) : card.type === 'watch' ? (
            <>
              <p className="hero-carousel__caption">{card.subtitle}</p>
              <span className="hero-carousel__watch">
                {card.meta}
                <span className="hero-carousel__watch-icon" aria-hidden="true">
                  <ArrowIcon />
                </span>
              </span>
            </>
          ) : card.type === 'stat' ? (
            <div className="hero-carousel__timer">
              <span>Масштаб</span>
              <strong>{card.subtitle}</strong>
            </div>
          ) : (
            <p className="hero-carousel__caption">{card.subtitle}</p>
          )}
        </>
      )}
    </article>
  );
}

export function HeroCarousel() {
  return (
    <ThreeDCarousel
      className="hero-carousel"
      count={heroCards.length}
      initialIndex={2}
      ariaLabel="Карусель преимуществ платформы. Перетаскивайте или свайпайте карточки."
      renderItem={(index, isActive) => (
        <HeroCard card={heroCards[index]} isActive={isActive} />
      )}
    />
  );
}
