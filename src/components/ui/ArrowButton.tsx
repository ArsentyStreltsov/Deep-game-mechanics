import { ArrowIcon } from '@/components/ui/ArrowIcon';

export function ArrowButton({
  href = '#',
  children,
  light = false,
  openContact = false,
  context,
  kicker,
  source,
}: {
  href?: string;
  children: string;
  light?: boolean;
  /** Клик открывает форму «Обсудить проект» (без JS ссылка просто ведёт к `href`). */
  openContact?: boolean;
  /** Что показать в форме плашкой «Интересует: …» (нужен `openContact`). */
  context?: string;
  /** Подпись над плашкой в форме; по умолчанию «Интересует». */
  kicker?: string;
  /** Откуда пришла заявка — уходит вместе с ней (нужен `context`). */
  source?: string;
}) {
  return (
    <a
      className={`arrow-button${light ? ' arrow-button--light' : ''}`}
      href={href}
      data-open-contact={openContact ? '' : undefined}
      data-contact-context={openContact ? context : undefined}
      data-contact-kicker={openContact && context ? kicker : undefined}
      data-contact-source={openContact && context ? source : undefined}
    >
      <span>{children}</span>
      <span aria-hidden="true" className="arrow-button__icon">
        <ArrowIcon className="arrow-button__arrow" />
      </span>
    </a>
  );
}
