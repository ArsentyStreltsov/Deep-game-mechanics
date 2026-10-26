import { useEffect, useRef, useState } from 'react';
import { navigation } from '@/data/landing';
import { BrandMark } from '@/components/ui/BrandMark';

/** Секции, за которыми следит подсветка пункта меню. Служебные (не в меню) сбрасывают подсветку. */
const navIds = navigation.map(([, href]) => href.slice(1));
const watchedIds = [...navIds, 'configurator', 'analytics', 'contact'] as const;

/** Ширина, с которой меню прячется в «бургер» (совпадает с media-запросом в clarity.css). */
const COMPACT_MAX = 1080;

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const probe = Math.min(window.innerHeight * 0.4, 320);
      let current = '';
      for (const id of watchedIds) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= probe) {
          current = id;
        }
      }
      setActive(navIds.includes(current) ? current : '');
      setScrolled(window.scrollY > 8);
    }
    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        burgerRef.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onResize() {
      if (window.innerWidth > COMPACT_MAX) setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <header
      className={`site-header${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}
      ref={headerRef}
    >
      <div className="site-header__bar">
        <a
          className="site-header__brand"
          href="#top"
          aria-label="Deep — на главную"
          onClick={() => setOpen(false)}
        >
          <BrandMark />
        </a>
        <nav className="site-nav" aria-label="Основная навигация">
          {navigation.map(([label, href]) => (
            <a
              href={href}
              key={href}
              aria-current={active === href.slice(1) ? 'location' : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
        <a className="brief-button" href="#configurator" data-open-contact>
          Обсудить проект
        </a>
        <button
          ref={burgerRef}
          className="site-header__burger"
          type="button"
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>
      <nav
        className="site-menu"
        id="site-menu"
        aria-label="Меню"
        hidden={!open}
      >
        {navigation.map(([label, href]) => (
          <a
            href={href}
            key={href}
            aria-current={active === href.slice(1) ? 'location' : undefined}
            onClick={() => setOpen(false)}
          >
            {label}
          </a>
        ))}
        <a
          className="brief-button"
          href="#configurator"
          data-open-contact
          onClick={() => setOpen(false)}
        >
          Обсудить проект
        </a>
      </nav>
    </header>
  );
}
