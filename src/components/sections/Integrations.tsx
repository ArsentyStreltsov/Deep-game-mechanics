import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { figmaAssets } from '@/lib/figma-assets';
import { IconTile } from '@/components/ui/IconTile';

const integrations = [
  { title: 'ATS', caption: 'Huntflow', icon: 'ats', position: 'ats' },
  {
    title: 'Teams / коммуникации',
    caption: 'Microsoft 365',
    icon: 'people',
    position: 'teams',
  },
  {
    title: 'HRIS',
    caption: 'SAP SuccessFactors',
    icon: 'user',
    position: 'hris',
  },
  { title: 'BI', caption: 'Аналитика клиента', icon: 'chart', position: 'bi' },
  { title: 'LMS', caption: 'Корпоративный LMS', icon: 'eye', position: 'lms' },
  {
    title: 'CRM',
    caption: 'Salesforce / amoCRM',
    icon: 'cloud',
    position: 'crm',
  },
  {
    title: 'Собственные системы',
    caption: 'API клиента',
    icon: 'settings',
    position: 'custom',
  },
  {
    title: 'Корпоративный портал',
    caption: 'Intranet',
    icon: 'document',
    position: 'portal',
  },
  {
    title: 'SSO',
    caption: 'Корпоративная авторизация',
    icon: 'shield',
    position: 'sso',
  },
] as const;

type Position = (typeof integrations)[number]['position'];

type Point = { x: number; y: number };

type Connector = {
  id: Position;
  d: string;
  start: Point;
  end: Point;
};

type CoreSide =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

type CardSide = 'top' | 'bottom' | 'left' | 'right';

const CONNECTOR_LAYOUT: Record<
  Position,
  { core: CoreSide; card: CardSide; style: 'straight' | 's' }
> = {
  hris: { core: 'top', card: 'bottom', style: 'straight' },
  ats: { core: 'top-left', card: 'right', style: 's' },
  lms: { core: 'top-right', card: 'left', style: 's' },
  portal: { core: 'left', card: 'right', style: 's' },
  sso: { core: 'right', card: 'left', style: 's' },
  teams: { core: 'bottom-left', card: 'right', style: 's' },
  custom: { core: 'bottom-right', card: 'left', style: 's' },
  bi: { core: 'bottom-left', card: 'top', style: 's' },
  crm: { core: 'bottom-right', card: 'top', style: 's' },
};

function relativeRect(el: HTMLElement, root: DOMRect) {
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left - root.left,
    top: rect.top - root.top,
    right: rect.right - root.left,
    bottom: rect.bottom - root.top,
    width: rect.width,
    height: rect.height,
    midX: rect.left - root.left + rect.width / 2,
    midY: rect.top - root.top + rect.height / 2,
  };
}

function corePoint(
  core: ReturnType<typeof relativeRect>,
  side: CoreSide,
): Point {
  const inset = 2;
  switch (side) {
    case 'top':
      return { x: core.midX, y: core.top + inset };
    case 'bottom':
      return { x: core.midX, y: core.bottom - inset };
    case 'left':
      return { x: core.left + inset, y: core.midY };
    case 'right':
      return { x: core.right - inset, y: core.midY };
    case 'top-left':
      return { x: core.left + core.width * 0.22, y: core.top + inset };
    case 'top-right':
      return { x: core.right - core.width * 0.22, y: core.top + inset };
    case 'bottom-left':
      return { x: core.left + core.width * 0.28, y: core.bottom - inset };
    case 'bottom-right':
      return { x: core.right - core.width * 0.28, y: core.bottom - inset };
  }
}

function cardPoint(
  card: ReturnType<typeof relativeRect>,
  side: CardSide,
): Point {
  const inset = 1;
  switch (side) {
    case 'top':
      return { x: card.midX, y: card.top + inset };
    case 'bottom':
      return { x: card.midX, y: card.bottom - inset };
    case 'left':
      return { x: card.left + inset, y: card.midY };
    case 'right':
      return { x: card.right - inset, y: card.midY };
  }
}

function buildPath(
  start: Point,
  end: Point,
  style: 'straight' | 's',
  position: Position,
): string {
  if (style === 'straight') {
    // Чуть смещаем X, чтобы SVG-filter не схлопывал вертикальную линию
    // (у идеально вертикального path ширина bbox = 0)
    const x = end.x;
    return `M ${x - 0.01} ${start.y} L ${x + 0.01} ${end.y}`;
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const absDy = Math.abs(dy);
  const leftSide =
    position === 'ats' ||
    position === 'portal' ||
    position === 'teams' ||
    position === 'bi';
  // Выпуклость всегда «наружу» от центра, даже если карточка близко
  const out = leftSide ? -1 : 1;

  let c1: Point;
  let c2: Point;

  if (position === 'portal' || position === 'sso') {
    // Мягкая горизонтальная S
    const pull = 72;
    c1 = { x: start.x + out * pull, y: start.y + dy * 0.12 };
    c2 = { x: end.x - out * pull * 0.85, y: end.y - dy * 0.12 };
  } else if (position === 'bi' || position === 'crm') {
    // Дуга вниз-наружу
    const pullY = Math.max(64, absDy * 0.58);
    c1 = { x: start.x + out * 36, y: start.y + pullY };
    c2 = { x: end.x - out * 18, y: end.y - absDy * 0.2 };
  } else if (position === 'ats' || position === 'lms') {
    // Верхние углы: S наружу и вверх
    const pullY = Math.max(52, absDy * 0.58);
    c1 = { x: start.x + out * 64, y: start.y - pullY * 0.35 };
    c2 = { x: end.x - out * 56, y: end.y + absDy * 0.18 };
  } else {
    // Teams / custom: S наружу и вниз
    const pullY = Math.max(52, absDy * 0.55);
    c1 = { x: start.x + out * 64, y: start.y + pullY * 0.45 };
    c2 = { x: end.x - out * 56, y: end.y - absDy * 0.12 };
  }

  // Небольшой учёт dx, чтобы на широком экране дуга тянулась естественнее
  c1.x += dx * 0.08;
  c2.x += dx * 0.08;

  return `M ${start.x} ${start.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`;
}

export default function Integrations() {
  const [active, setActive] = useState('teams');
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [mapSize, setMapSize] = useState({ width: 1537, height: 585 });
  const mapRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Partial<Record<Position, HTMLButtonElement | null>>>(
    {},
  );
  const activeIntegration =
    integrations.find((item) => item.position === active) ?? integrations[1];

  const updateConnectors = useCallback(() => {
    const map = mapRef.current;
    const core = coreRef.current;
    if (!map || !core) return;

    // На узких экранах карта становится сеткой без линий
    if (window.matchMedia('(max-width: 900px)').matches) {
      setConnectors([]);
      return;
    }

    const root = map.getBoundingClientRect();
    if (root.width < 40 || root.height < 40) return;

    setMapSize({ width: root.width, height: root.height });
    const coreBox = relativeRect(core, root);
    const next: Connector[] = [];

    for (const item of integrations) {
      const cardEl = cardRefs.current[item.position];
      if (!cardEl) continue;
      const layout = CONNECTOR_LAYOUT[item.position];
      const cardBox = relativeRect(cardEl, root);
      const start = corePoint(coreBox, layout.core);
      const end = cardPoint(cardBox, layout.card);
      // Для BI/CRM якорь на нижней стороне ядра чуть ближе к центру/краю
      if (item.position === 'bi') {
        start.x = coreBox.left + coreBox.width * 0.34;
        start.y = coreBox.bottom - 2;
      }
      if (item.position === 'crm') {
        start.x = coreBox.right - coreBox.width * 0.34;
        start.y = coreBox.bottom - 2;
      }
      if (item.position === 'teams') {
        start.x = coreBox.left + 2;
        start.y = coreBox.top + coreBox.height * 0.7;
      }
      if (item.position === 'custom') {
        start.x = coreBox.right - 2;
        start.y = coreBox.top + coreBox.height * 0.7;
      }
      if (item.position === 'ats') {
        start.x = coreBox.left + 2;
        start.y = coreBox.top + coreBox.height * 0.22;
      }
      if (item.position === 'lms') {
        start.x = coreBox.right - 2;
        start.y = coreBox.top + coreBox.height * 0.22;
      }
      if (layout.style === 'straight') {
        start.x = end.x;
      }
      next.push({
        id: item.position,
        d: buildPath(start, end, layout.style, item.position),
        start,
        end,
      });
    }

    setConnectors(next);
  }, []);

  useLayoutEffect(() => {
    updateConnectors();
  }, [updateConnectors, active]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const observer = new ResizeObserver(() => updateConnectors());
    observer.observe(map);
    if (coreRef.current) observer.observe(coreRef.current);
    Object.values(cardRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    window.addEventListener('resize', updateConnectors);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateConnectors);
    };
  }, [updateConnectors]);

  return (
    <section
      className="integrations"
      id="integrations"
      aria-labelledby="integrations-heading"
    >
      <div className="integrations__backdrop" aria-hidden="true">
        <img
          className="integrations__bg"
          src={figmaAssets.integrationsBackground}
          alt=""
        />
      </div>
      <header className="integrations__heading">
        <h2 id="integrations-heading">
          Подключаемся к вашей инфраструктуре — куда
          <br /> <span>технически можно</span>
        </h2>
        <p>
          Подключаем платформу к вашей инфраструктуре: через API, webhooks, SSO
          или кастомный сценарий онбординга — в HR-систему, CRM,
          <br className="desktop-break" /> портал, LMS и внутренние сервисы
          компании
        </p>
      </header>
      <div className="integration-map" ref={mapRef}>
        <svg
          className="integration-connectors"
          viewBox={`0 0 ${mapSize.width} ${mapSize.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="integration-neon-stroke"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#006AFF" />
              <stop offset="25%" stopColor="#7CB2FF" />
              <stop offset="47.6%" stopColor="#006AFF" />
              <stop offset="72.1%" stopColor="#7CB2FF" />
              <stop offset="100%" stopColor="#006AFF" />
            </linearGradient>
            <filter
              id="integration-neon-glow"
              x="-100"
              y="-100"
              width={mapSize.width + 200}
              height={mapSize.height + 200}
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation="4.8" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="0 0 0 0 0
                        0 0 0 0 0.42
                        0 0 0 0 1
                        0 0 0 1 0"
                result="glow"
              />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g
            fill="none"
            stroke="url(#integration-neon-stroke)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#integration-neon-glow)"
          >
            {connectors.map((item) => (
              <path key={item.id} d={item.d} />
            ))}
          </g>
          <g fill="url(#integration-neon-stroke)" filter="url(#integration-neon-glow)">
            {connectors.map((item) => (
              <g key={`${item.id}-nodes`}>
                <circle cx={item.start.x} cy={item.start.y} r="5.35" />
                <circle cx={item.end.x} cy={item.end.y} r="5.35" />
              </g>
            ))}
          </g>
        </svg>
        <div className="integration-core" ref={coreRef}>
          <span className="core-badge">ЦЕНТР</span>
          <h3>
            Engagement
            <br />
            Platform
          </h3>
        </div>
        {integrations.map((item) => (
          <button
            type="button"
            aria-pressed={item.position === active}
            onClick={() => setActive(item.position)}
            className={`integration-card integration-card--${item.position}${item.position === active ? ' is-active' : ''}`}
            key={item.title}
            ref={(el) => {
              cardRefs.current[item.position] = el;
            }}
          >
            <IconTile>
              <img src={figmaAssets.integrationIcons[item.icon]} alt="" />
            </IconTile>
            <div>
              <h3>{item.title}</h3>
              <p>{item.caption}</p>
            </div>
          </button>
        ))}
      </div>
      <footer className="integrations__footer">
        <p>
          Не заставляем людей вручную переносить данные. Если у системы есть
          технический доступ — проектируем обмен под задачу проекта. Сейчас
          выбрано: {activeIntegration.title}.
        </p>
        <small>
          Примеры систем с доступными API. Возможность и объём конкретной
          интеграции определяются после технического анализа
        </small>
      </footer>
    </section>
  );
}
