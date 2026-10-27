import { useEffect, useRef, useState } from 'react';

type Props = {
  value: number;
  /** Знаков после запятой (запятая — русская). */
  decimals?: number;
  suffix?: string;
  /** Длительность набора, мс. */
  duration?: number;
};

function format(value: number, decimals: number) {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Число, которое «набегает» от нуля, когда блок появляется на экране, и плавно перескакивает
 * на новое значение при смене сценария. Без JS и при `prefers-reduced-motion` остаётся
 * обычный текст с итоговым значением (его же отдаёт сервер, поэтому гидрация не расходится).
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = '',
  duration = 1100,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  const current = useRef(value);
  const started = useRef(false);

  useEffect(() => {
    const element = ref.current;
    const motionOk =
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('motion-ok');
    if (!element || !motionOk) {
      current.current = value;
      setShown(value);
      return;
    }

    let frame = 0;
    let observer: IntersectionObserver | undefined;

    function run(from: number) {
      const startedAt = performance.now();
      function step(now: number) {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const next = from + (value - from) * eased;
        current.current = next;
        setShown(next);
        if (progress < 1) frame = window.requestAnimationFrame(step);
      }
      frame = window.requestAnimationFrame(step);
    }

    if (started.current) {
      run(current.current);
    } else {
      current.current = 0;
      setShown(0);
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer?.disconnect();
          started.current = true;
          run(0);
        },
        { threshold: 0.6 },
      );
      observer.observe(element);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [value, duration]);

  return (
    <span ref={ref}>
      {format(shown, decimals)}
      {suffix}
    </span>
  );
}
