import type { ReactNode } from 'react';

export function IconTile({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`icon-tile ${className}`}>{children}</span>;
}
