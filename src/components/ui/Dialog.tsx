import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Всё, до чего можно дойти клавишей Tab внутри окна. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

type DialogProps = {
  onClose: () => void;
  /** id заголовка окна — для `aria-labelledby`. */
  labelledBy: string;
  /** Класс панели (рамка, ширина). */
  className?: string;
  children: ReactNode;
  /** CSS-селектор элемента внутри окна, который получает фокус при открытии. По умолчанию — сама панель. */
  initialFocus?: string;
};

/**
 * Модальное окно: блокирует прокрутку страницы, держит фокус внутри (Tab / Shift+Tab по кругу),
 * закрывается по Esc и клику на подложку и возвращает фокус туда, откуда его открыли.
 * Показывать — монтировать компонент, скрывать — размонтировать.
 */
export function Dialog({
  onClose,
  labelledBy,
  className = '',
  children,
  initialFocus,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  // Закрывать по клику только если и нажали, и отпустили на подложке — иначе выделение текста
  // в поле, закончившееся за пределами окна, закрыло бы форму вместе с набранным.
  const pressedOnBackdrop = useRef(false);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const body = document.body;
    const { overflow, paddingRight } = body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    const target = initialFocus
      ? panel.querySelector<HTMLElement>(initialFocus)
      : null;
    // На телефоне фокус в поле сразу открывает клавиатуру и закрывает пол-экрана, поэтому там фокус получает панель.
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    (coarse ? panel : (target ?? panel)).focus({ preventScroll: true });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((item) => item.getClientRects().length > 0);
      if (!items.length) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (!panel.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      body.style.overflow = overflow;
      body.style.paddingRight = paddingRight;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
    // initialFocus учитывается один раз — при открытии.
  }, []);

  function onBackdropDown(event: MouseEvent<HTMLDivElement>) {
    pressedOnBackdrop.current = event.target === event.currentTarget;
  }

  function onBackdropUp(event: MouseEvent<HTMLDivElement>) {
    if (pressedOnBackdrop.current && event.target === event.currentTarget) {
      closeRef.current();
    }
    pressedOnBackdrop.current = false;
  }

  // В <body>, а не на месте вызова: так окно не зависит от transform и overflow у родителей.
  return createPortal(
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={onBackdropDown}
      onMouseUp={onBackdropUp}
    >
      <div
        ref={panelRef}
        className={`dialog-panel ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
