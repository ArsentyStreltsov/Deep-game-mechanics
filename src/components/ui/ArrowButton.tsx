import { ArrowIcon } from '@/components/ui/ArrowIcon';

export function ArrowButton({
  href = '#',
  children,
  light = false,
  openContact = false,
}: {
  href?: string;
  children: string;
  light?: boolean;
  /** Клик открывает форму «Обсудить проект» (без JS ссылка просто ведёт к `href`). */
  openContact?: boolean;
}) {
  return (
    <a
      className={`arrow-button${light ? ' arrow-button--light' : ''}`}
      href={href}
      data-open-contact={openContact ? '' : undefined}
    >
      <span>{children}</span>
      <span aria-hidden="true" className="arrow-button__icon">
        <ArrowIcon className="arrow-button__arrow" />
      </span>
    </a>
  );
}
