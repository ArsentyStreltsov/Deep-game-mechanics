import { figmaAssets } from '@/lib/figma-assets';
import { navigation } from '@/data/landing';
import { ArrowButton } from '@/components/ui/ArrowButton';
import { HeroCarousel } from '@/components/sections/HeroCarousel';

export default function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__surface" aria-hidden="true">
        <div className="hero__grain" />
        <img className="hero__backdrop" src={figmaAssets.heroBackground} alt="" />
        <img className="hero__glow" src={figmaAssets.heroGlow} alt="" />
      </div>
      <header className="site-header">
        <a
          className="site-header__brand"
          href="#top"
          aria-label="Deep — на главную"
        >
          <img src={figmaAssets.logo} alt="deep creative / digital" />
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
      <div className="hero__content">
        <h1 id="hero-title">
          <span>Игровые механики</span> для
          <br />
          команды — быстро
        </h1>
        <p>
          Берём на себя разработку, дизайн и тексты. Запускаем от одной недели и
          адаптируем готовые
          <br className="desktop-break" /> решения под ваш бренд и задачу
        </p>
        <div className="hero__actions">
          <a className="hero__secondary" href="#cases">
            Смотреть возможности
          </a>
          <ArrowButton href="#configurator">Обсудить проект</ArrowButton>
        </div>
        <HeroCarousel />
      </div>
    </section>
  );
}
