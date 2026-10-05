import { ArrowIcon } from '@/components/ui/ArrowIcon';

export function ArrowButton({
  href = '#',
  children,
  light = false,
}: {
  href?: string;
  children: string;
  light?: boolean;
}) {
  return (
    <a
      className={`arrow-button${light ? ' arrow-button--light' : ''}`}
      href={href}
    >
      <span>{children}</span>
      <span aria-hidden="true" className="arrow-button__icon">
        <ArrowIcon className="arrow-button__arrow" />
      </span>
    </a>
  );
}
