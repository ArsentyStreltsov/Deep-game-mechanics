type ArrowDirection = 'up-right' | 'left' | 'right';

const rotation: Record<ArrowDirection, string> = {
  right: '0deg',
  'up-right': '-45deg',
  left: '180deg',
};

/** Long stem + compact head; rotate for other directions. */
const ARROW_PATH = 'M4 12H19.5M19.5 12L14.75 7.25M19.5 12L14.75 16.75';

export function ArrowIcon({
  direction = 'up-right',
  className = '',
  strokeWidth = 1.8,
}: {
  direction?: ArrowDirection;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      className={`arrow-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ transform: `rotate(${rotation[direction]})` }}
    >
      <path
        d={ARROW_PATH}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
