import {
  heroAudience,
  heroProof,
  heroSubtitle,
  heroTitle,
} from '@/data/landing';
import { ArrowButton } from '@/components/ui/ArrowButton';
import { HeroCarousel } from '@/components/sections/HeroCarousel';
import { cssVars } from '@/lib/css-vars';

export default function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__surface" aria-hidden="true">
        <div className="hero__grain" />
      </div>
      <div className="hero__body">
        <div className="hero__content">
          <h1 id="hero-title">
            <span>{heroTitle.accent}</span>
            {heroTitle.rest}
          </h1>
          <p>
            {heroSubtitle.map((line) => (
              <span className="hero__line" key={line}>
                {line}{' '}
              </span>
            ))}
          </p>
          <div className="hero__actions">
            <a className="hero__secondary" href="#mechanics">
              Смотреть возможности
            </a>
            <ArrowButton href="#configurator" openContact>
              Обсудить проект
            </ArrowButton>
          </div>
          <div className="hero__audience">
            <span className="hero__audience-label">Для задач</span>
            <ul role="list">
              {heroAudience.map((item, index) => (
                <li
                  key={item.label}
                  data-accent={item.accent}
                  style={cssVars({ '--i': index })}
                >
                  {item.categoryId ? (
                    <a href="#cases" data-case-category={item.categoryId}>
                      {item.label}
                    </a>
                  ) : (
                    <a href="#mechanics" data-mechanic-id="custom">
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="hero__proof">
            <span className="hero__proof-label">{heroProof.label}</span>
            <ul role="list">
              {heroProof.brands.map((brand, index) => (
                <li key={brand} style={cssVars({ '--i': index })}>
                  {brand}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="hero__stage">
          <HeroCarousel />
        </div>
      </div>
    </section>
  );
}
