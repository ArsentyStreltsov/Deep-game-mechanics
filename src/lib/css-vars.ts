import type { CSSProperties } from 'react';

/** Инлайн-стиль с произвольными CSS-переменными (`--i` для задержек анимации и т. п.). */
export function cssVars(vars: Record<`--${string}`, string | number>) {
  return vars as CSSProperties;
}
