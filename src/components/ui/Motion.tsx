import { useEffect } from 'react';

/**
 * Лёгкий слой «живости» страницы. Компонент ничего не рисует, а подключает две вещи:
 *
 * 1. Появление при прокрутке. Блоки с атрибутом `data-reveal` прячутся и по мере
 *    попадания в экран получают `data-in` — дальше работают CSS-анимации (motion.css).
 *    Состояние хранится в атрибутах, а не в классах: React перерисовывает className и затёр бы его.
 *    Блоки, которые уже на экране при старте, не прячутся вовсе (без вспышки).
 * 2. Подсветка под курсором. Карточки с `data-spot` получают `--mx/--my` — центр свечения.
 *
 * Если анимации выключены в системе (нет класса `motion-ok` на <html>), ничего не происходит
 * и вся страница остаётся статичной и полностью видимой.
 */
export default function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('motion-ok')) return;

    const cleanups: Array<() => void> = [];

    // ───── появление при прокрутке ─────
    if ('IntersectionObserver' in window) {
      const targets = Array.from(
        document.querySelectorAll<HTMLElement>('[data-reveal]'),
      );
      const viewport = window.innerHeight;

      // уже видимое не прячем: без анимации, чтобы не мигало при загрузке с якорем
      for (const element of targets) {
        const rect = element.getBoundingClientRect();
        if (rect.top < viewport * 0.92 && rect.bottom > 0) {
          element.setAttribute('data-in', 'now');
        }
      }

      const show = (element: Element, delay: number) => {
        if (element.hasAttribute('data-in')) return;
        (element as HTMLElement).style.setProperty('--rd', `${delay}ms`);
        element.setAttribute('data-in', '');
      };

      const observer = new IntersectionObserver(
        (entries) => {
          const entering = entries
            .filter((entry) => entry.isIntersecting)
            .sort(
              (a, b) =>
                a.boundingClientRect.top - b.boundingClientRect.top ||
                a.boundingClientRect.left - b.boundingClientRect.left,
            );
          entering.forEach((entry, index) => {
            show(entry.target, Math.min(index, 6) * 70);
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
      );

      for (const element of targets) {
        if (!element.hasAttribute('data-in')) observer.observe(element);
      }
      root.classList.add('motion-live');

      // фокус с клавиатуры на ещё спрятанном блоке — показать сразу
      const onFocusIn = (event: FocusEvent) => {
        const element = (event.target as Element | null)?.closest?.(
          '[data-reveal]:not([data-in])',
        );
        if (element) {
          show(element, 0);
          observer.unobserve(element);
        }
      };
      document.addEventListener('focusin', onFocusIn);

      // страховка: если наблюдатель по какой-то причине промолчал, видимое показываем сами
      const sweep = window.setTimeout(() => {
        for (const element of document.querySelectorAll<HTMLElement>(
          '[data-reveal]:not([data-in])',
        )) {
          const rect = element.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            show(element, 0);
            observer.unobserve(element);
          }
        }
      }, 2500);

      cleanups.push(() => {
        observer.disconnect();
        document.removeEventListener('focusin', onFocusIn);
        window.clearTimeout(sweep);
        root.classList.remove('motion-live');
      });
    }

    // ───── подсветка под курсором ─────
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (fine.matches) {
      let frame = 0;
      let last: PointerEvent | null = null;
      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return;
        last = event;
        if (frame) return;
        frame = window.requestAnimationFrame(() => {
          frame = 0;
          const pointer = last;
          const spot = (pointer?.target as Element | null)?.closest?.(
            '[data-spot]',
          ) as HTMLElement | null;
          if (!pointer || !spot) return;
          const rect = spot.getBoundingClientRect();
          spot.style.setProperty('--mx', `${pointer.clientX - rect.left}px`);
          spot.style.setProperty('--my', `${pointer.clientY - rect.top}px`);
        });
      };
      document.addEventListener('pointermove', onMove, { passive: true });
      cleanups.push(() => {
        document.removeEventListener('pointermove', onMove);
        if (frame) window.cancelAnimationFrame(frame);
      });
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}
