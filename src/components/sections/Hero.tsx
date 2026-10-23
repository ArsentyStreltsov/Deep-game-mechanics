import { heroSubtitle, navigation } from '@/data/landing';
import { ArrowButton } from '@/components/ui/ArrowButton';
import { BrandMark } from '@/components/ui/BrandMark';
import { HeroCarousel } from '@/components/sections/HeroCarousel';

export default function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__surface" aria-hidden="true">
        <div className="hero__grain" />
      </div>
      <header className="site-header">
        <a
          className="site-header__brand"
          href="#top"
          aria-label="Deep — на главную"
        >
          <BrandMark />
        </a>
        <nav className="site-nav" aria-label="Основная навигация">
          {navigation.map(([label, href]) => (
            <a href={href} key={href}>
              {label}
            </a>
          ))}
        </nav>
        <a className="brief-button" href="#configurator">
          Отправить бриф
        </a>
      </header>
      <div className="hero__body">
        <div className="hero__content">
          <h1 id="hero-title">
            <span>Игровые механики</span> для
            <br />
            команды — быстро
          </h1>
          <p>{heroSubtitle}</p>
          <div className="hero__actions">
            <a className="hero__secondary" href="#mechanics">
              Смотреть возможности
            </a>
            <ArrowButton href="#configurator">Обсудить проект</ArrowButton>
          </div>
        </div>
        <div className="hero__stage">
          <HeroCarousel />
        </div>
      </div>
    </section>
  );
}
