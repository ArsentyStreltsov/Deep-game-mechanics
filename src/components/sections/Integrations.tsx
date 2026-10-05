import { useState } from 'react';
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

export default function Integrations() {
  const [active, setActive] = useState('teams');
  const activeIntegration =
    integrations.find((item) => item.position === active) ?? integrations[1];
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
      <div className="integration-map">
        <svg
          className="integration-connectors"
          viewBox="0 0 1537 585"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <g fill="none" stroke="rgba(91,159,255,0.55)" strokeWidth="2">
            <path d="M768 292 H 980" />
            <path d="M768 292 V 99 H 980" />
            <path d="M768 292 V 420 H 980" />
            <path d="M768 292 V 520 H 620" />
            <path d="M768 292 V 520 H 916" />
            <path d="M768 292 H 556" />
            <path d="M768 292 V 99 H 556" />
            <path d="M768 292 V 420 H 556" />
            <path d="M768 190 V 99" />
          </g>
          <g fill="#5b9fff">
            <circle cx="768" cy="292" r="4" />
            <circle cx="980" cy="292" r="3" />
            <circle cx="556" cy="292" r="3" />
            <circle cx="980" cy="99" r="3" />
            <circle cx="556" cy="99" r="3" />
            <circle cx="980" cy="420" r="3" />
            <circle cx="556" cy="420" r="3" />
            <circle cx="620" cy="520" r="3" />
            <circle cx="916" cy="520" r="3" />
          </g>
        </svg>
        <div className="integration-core">
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
