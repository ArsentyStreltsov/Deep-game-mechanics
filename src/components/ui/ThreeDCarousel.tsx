/**
 * Adapted from Cult UI 3D Carousel (MIT)
 * https://21st.dev/@cult-ui/components/3d-carousel
 * https://cult-ui.com/docs/components/three-d-carousel
 *
 * Keeps Cult UI motion primitives (useMotionValue, useAnimation, drag, spring,
 * perspective / preserve-3d) and reshapes the layout into a shallow coverflow
 * arc for Deep hero cards instead of an image cylinder gallery.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { motion, type PanInfo } from 'motion/react';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

type UseMediaQueryOptions = {
  defaultValue?: boolean;
  initializeWithValue?: boolean;
};

const IS_SERVER = typeof window === 'undefined';

function useMediaQuery(
  query: string,
  {
    defaultValue = false,
    initializeWithValue = true,
  }: UseMediaQueryOptions = {},
): boolean {
  const getMatches = (q: string): boolean => {
    if (IS_SERVER) return defaultValue;
    return window.matchMedia(q).matches;
  };

  const [matches, setMatches] = useState(() => {
    if (initializeWithValue) return getMatches(query);
    return defaultValue;
  });

  useIsomorphicLayoutEffect(() => {
    const matchMedia = window.matchMedia(query);
    const handleChange = () => setMatches(getMatches(query));
    handleChange();
    matchMedia.addEventListener('change', handleChange);
    return () => matchMedia.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

type Breakpoint = 'desktop' | 'tablet' | 'mobile';

type SlotTransform = {
  x: number;
  y: number;
  z: number;
  rotateY: number;
  scale: number;
  opacity: number;
  blur: number;
};

const DESKTOP_SLOTS: Record<number, SlotTransform> = {
  0: { x: 0, y: 20, z: 40, rotateY: 0, scale: 1, opacity: 1, blur: 0 },
  1: { x: 248, y: 8, z: -70, rotateY: -7, scale: 0.9, opacity: 0.94, blur: 0.35 },
  [-1]: { x: -248, y: 8, z: -70, rotateY: 7, scale: 0.9, opacity: 0.94, blur: 0.35 },
  2: { x: 440, y: -2, z: -170, rotateY: -15, scale: 0.74, opacity: 0.7, blur: 1.1 },
  [-2]: { x: -440, y: -2, z: -170, rotateY: 15, scale: 0.74, opacity: 0.7, blur: 1.1 },
};

const TABLET_SLOTS: Record<number, SlotTransform> = {
  0: { x: 0, y: 14, z: 0, rotateY: 0, scale: 1, opacity: 1, blur: 0 },
  1: { x: 210, y: 6, z: -70, rotateY: -5, scale: 0.88, opacity: 0.88, blur: 0.5 },
  [-1]: { x: -210, y: 6, z: -70, rotateY: 5, scale: 0.88, opacity: 0.88, blur: 0.5 },
  2: { x: 360, y: 0, z: -140, rotateY: -10, scale: 0.72, opacity: 0.45, blur: 1.4 },
  [-2]: { x: -360, y: 0, z: -140, rotateY: 10, scale: 0.72, opacity: 0.45, blur: 1.4 },
};

const MOBILE_SLOTS: Record<number, SlotTransform> = {
  0: { x: 0, y: 10, z: 0, rotateY: 0, scale: 1, opacity: 1, blur: 0 },
  1: { x: 118, y: 4, z: -40, rotateY: -3, scale: 0.86, opacity: 0.55, blur: 0.6 },
  [-1]: { x: -118, y: 4, z: -40, rotateY: 3, scale: 0.86, opacity: 0.55, blur: 0.6 },
  2: { x: 200, y: 0, z: -90, rotateY: -6, scale: 0.7, opacity: 0.2, blur: 1.6 },
  [-2]: { x: -200, y: 0, z: -90, rotateY: 6, scale: 0.7, opacity: 0.2, blur: 1.6 },
};

const HIDDEN_SLOT: SlotTransform = {
  x: 0,
  y: 0,
  z: -320,
  rotateY: 0,
  scale: 0.55,
  opacity: 0,
  blur: 2,
};

const SPRING = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 22,
  mass: 0.7,
};

const AUTOPLAY_MS = 3800;
const TRANSITION_MS = 850;

function wrapOffset(index: number, active: number, total: number) {
  const half = Math.floor(total / 2);
  return ((index - active + total + half) % total) - half;
}

function slotsFor(breakpoint: Breakpoint) {
  if (breakpoint === 'mobile') return MOBILE_SLOTS;
  if (breakpoint === 'tablet') return TABLET_SLOTS;
  return DESKTOP_SLOTS;
}

function transformFor(
  offset: number,
  breakpoint: Breakpoint,
): SlotTransform {
  const slots = slotsFor(breakpoint);
  return slots[offset] ?? {
    ...HIDDEN_SLOT,
    x: Math.sign(offset || 1) * (breakpoint === 'mobile' ? 260 : 680),
    rotateY: Math.sign(offset || 1) * (breakpoint === 'mobile' ? -8 : -22),
  };
}

export type ThreeDCarouselProps = {
  count: number;
  initialIndex?: number;
  className?: string;
  ariaLabel?: string;
  renderItem: (index: number, isActive: boolean) => ReactNode;
};

export function ThreeDCarousel({
  count,
  initialIndex = 0,
  className = '',
  ariaLabel = 'Карусель',
  renderItem,
}: ThreeDCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const isTablet = useMediaQuery('(max-width: 1200px)');
  const isMobile = useMediaQuery('(max-width: 800px)');
  const breakpoint: Breakpoint = isMobile
    ? 'mobile'
    : isTablet
      ? 'tablet'
      : 'desktop';
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const dragStartActive = useRef(activeIndex);
  const isDragging = useRef(false);
  const ignoreClick = useRef(false);

  const goTo = useCallback(
    (next: number) => {
      setActiveIndex(((next % count) + count) % count);
    },
    [count],
  );

  const step = useCallback(
    (direction: number) => {
      goTo(activeIndex + direction);
    },
    [activeIndex, goTo],
  );

  useEffect(() => {
    if (reduceMotion || count < 2) return undefined;

    const timer = window.setInterval(() => {
      if (document.hidden || isDragging.current) return;
      setActiveIndex((current) => (current + 1) % count);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [count, reduceMotion]);

  const onDragStart = useCallback(() => {
    isDragging.current = true;
    dragStartActive.current = activeIndex;
  }, [activeIndex]);

  const onDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      isDragging.current = false;
      const threshold = isMobile ? 48 : 90;
      const velocityBoost = Math.abs(info.velocity.x) > 500;
      let delta = 0;
      if (info.offset.x < -threshold || (velocityBoost && info.velocity.x < -200)) {
        delta = 1;
      } else if (
        info.offset.x > threshold ||
        (velocityBoost && info.velocity.x > 200)
      ) {
        delta = -1;
      }

      if (delta !== 0) {
        ignoreClick.current = true;
        goTo(dragStartActive.current + delta);
      }
    },
    [goTo, isMobile],
  );

  const perspective = isMobile ? '900px' : isTablet ? '1200px' : '1600px';

  return (
    <div
      className={`three-d-carousel ${className}`.trim()}
      role="group"
      aria-label={ariaLabel}
      tabIndex={0}
      style={{
        perspective,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          step(1);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          step(-1);
        }
      }}
    >
      <div className="three-d-carousel__glow" aria-hidden="true" />
      <motion.div
        className="three-d-carousel__track"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.16}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        style={{
          transformStyle: 'preserve-3d',
          cursor: 'grab',
        }}
      >
        {Array.from({ length: count }, (_, index) => {
          const offset = wrapOffset(index, activeIndex, count);
          const slot = transformFor(offset, breakpoint);
          const isActive = offset === 0;
          const visible = Math.abs(offset) <= 2;

          return (
            <motion.div
              key={index}
              className={`three-d-carousel__slot${isActive ? ' is-active' : ''}`}
              style={{
                zIndex: 20 - Math.abs(offset),
                pointerEvents: visible ? 'auto' : 'none',
                transformStyle: 'preserve-3d',
              }}
              animate={{
                x: slot.x,
                y: slot.y,
                z: slot.z,
                rotateY: slot.rotateY,
                scale: slot.scale,
                opacity: slot.opacity,
                filter: `blur(${slot.blur}px)`,
              }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      ...SPRING,
                      duration: TRANSITION_MS / 1000,
                    }
              }
              onClick={() => {
                if (ignoreClick.current) {
                  ignoreClick.current = false;
                  return;
                }
                if (!isActive) goTo(index);
              }}
            >
              {renderItem(index, isActive)}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
