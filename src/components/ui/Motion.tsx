import { useEffect } from 'react';

/**
 * Лёгкий слой «живости» страницы. Компонент ничего не рисует, а подключает две вещи:
 *
 * 1. Появление при прокрутке. Блоки с атрибутом `data-reveal` прячутся и перед попаданием в экран
 *    получают `data-in` — дальше работают CSS-анимации (motion.css). Срабатывает с запасом
 *    (`LEAD`): блок начинает проявляться, пока он ещё ниже края экрана, и при обычной прокрутке
 *    пользователь не видит пустых мест. Если листают быстро (рывок трекпада, переход по якорю) или
 *    блок к моменту срабатывания уже на экране, он появляется сразу, без плавного входа: иначе
 *    контент «догоняет» взгляд. Задержка-«лесенка» есть только у карточек в одном ряду (`data-spot`),
 *    у заголовков, панелей и списков её нет.
 *    Состояние хранится в атрибутах, а не в классах: React перерисовывает className и затёр бы его.
 *    Блоки, которые уже на экране при старте, не прячутся вовсе (без вспышки).
 * 2. Подсветка под курсором. Карточки с `data-spot` получают `--mx/--my` — центр свечения.
 *
 * Если анимации выключены в системе (нет класса `motion-ok` на <html>), ничего не происходит
 * и вся страница остаётся статичной и полностью видимой.
 */
/** Насколько заранее (доля высоты экрана ниже его края) блок начинает появляться. */
const LEAD = '18%';
/** Шаг задержки между карточками одного ряда и их предельное число шагов: в сумме не больше 0,12 с. */
const STAGGER_MS = 40;
const STAGGER_STEPS = 3;
/** Если к моменту срабатывания блок виден больше чем на столько пикселей — показываем без анимации. */
const INSTANT_VISIBLE_PX = 40;
/** Быстрой считаем прокрутку быстрее этого (пикселей в миллисекунду, 1,5 = 1500 px/с): блоки без анимации. */
const FAST_SCROLL_PX_PER_MS = 1.5;

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

      const show = (element: Element, delay: number, instant = false) => {
        if (element.hasAttribute('data-in')) return;
        if (instant) {
          element.setAttribute('data-in', 'now');
          return;
        }
        (element as HTMLElement).style.setProperty('--rd', `${delay}ms`);
        element.setAttribute('data-in', '');
      };

      // скорость прокрутки по последним событиям scroll: страница, которую листают рывком, не ждёт анимаций
      let lastY = window.scrollY;
      let lastTime = performance.now();
      let speed = 0;
      const onScroll = () => {
        const time = performance.now();
        const y = window.scrollY;
        if (time > lastTime) speed = Math.abs(y - lastY) / (time - lastTime);
        lastY = y;
        lastTime = time;
      };
      window.addEventListener('scroll', onScroll, { passive: true });

      const observer = new IntersectionObserver(
        (entries) => {
          const fast =
            performance.now() - lastTime < 200 && speed > FAST_SCROLL_PX_PER_MS;
          const entering = entries
            .filter((entry) => entry.isIntersecting)
            .sort(
              (a, b) =>
                a.boundingClientRect.top - b.boundingClientRect.top ||
                a.boundingClientRect.left - b.boundingClientRect.left,
            );
          // «Лесенка» только у карточек и только внутри одного ряда: сетка из трёх карточек
          // выезжает слева направо за ~0,1 с, а следующий ряд начинается с нуля.
          let rowTop = Number.NEGATIVE_INFINITY;
          let inRow = 0;
          for (const entry of entering) {
            let delay = 0;
            if (entry.target.hasAttribute('data-spot')) {
              const top = entry.boundingClientRect.top;
              if (Math.abs(top - rowTop) > 24) {
                rowTop = top;
                inRow = 0;
              } else {
                inRow += 1;
              }
              delay = Math.min(inRow, STAGGER_STEPS) * STAGGER_MS;
            }
            const visiblePx = window.innerHeight - entry.boundingClientRect.top;
            show(entry.target, delay, fast || visiblePx > INSTANT_VISIBLE_PX);
            observer.unobserve(entry.target);
          }
        },
        { rootMargin: `0px 0px ${LEAD} 0px`, threshold: 0 },
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
        window.removeEventListener('scroll', onScroll);
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
