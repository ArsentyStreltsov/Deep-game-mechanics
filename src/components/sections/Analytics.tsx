import { useState } from 'react';
import { figmaAssets } from '@/lib/figma-assets';
import { IconTile } from '@/components/ui/IconTile';

const scenarios = [
  'Внутриком',
  'Офлайн-ивент',
  'Обучение',
  'Внешний спецпроект',
  'Мерч-шоп',
];
const periods = [
  { id: '7', label: 'За последние 7 дней', bars: [350, 520, 790, 170, 690, 420, 260] },
  { id: '14', label: 'За 14 дней', bars: [280, 410, 640, 220, 710, 390, 310] },
  { id: '30', label: 'За 30 дней', bars: [420, 580, 760, 300, 820, 510, 450] },
] as const;
const kpis = [
  {
    label: 'Участники',
    value: '8 430',
    delta: '+5%',
    positive: true,
    trend: 'M0 48 C20 34 28 42 43 37 S59 14 76 12 S93 15 100 0',
  },
  {
    label: 'Participation rate',
    value: '74%',
    delta: '-0,2%',
    positive: false,
    trend: 'M0 48 C20 34 28 42 43 37 S59 14 76 12 S93 15 100 0',
  },
  {
    label: 'Игровые сессии',
    value: '31 420',
    delta: '+1%',
    positive: true,
    trend: 'M0 48 C20 34 28 42 43 37 S59 14 76 12 S93 15 100 0',
  },
  {
    label: 'Активностей на участника',
    value: '4,7',
    delta: '-0,1%',
    positive: false,
    trend: 'M0 48 C20 34 28 42 43 37 S59 14 76 12 S93 15 100 0',
  },
];
const totals = [
  { icon: 'users', label: 'Зарегистрированные', value: '8 430' },
  { icon: 'lightning', label: 'Активные сегодня', value: '3 120' },
  { icon: 'gamepad', label: 'Игровые сессии', value: '31 420' },
  { icon: 'shield', label: 'Выполнено заданий', value: '12 880' },
] as const;
const features = [
  'Контент, задания и активности',
  'Награды и рейтинги',
  'Просмотры LIVE и реакции',
  'Активность по командам и регионам',
  'Выгрузка результатов',
];

export default function Analytics() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [periodIndex, setPeriodIndex] = useState(0);
  const [periodOpen, setPeriodOpen] = useState(false);
  const multipliers = [1, 0.82, 0.74, 1.16, 0.68];
  const multiplier = multipliers[scenarioIndex];
  const period = periods[periodIndex];

  return (
    <section className="analytics" aria-labelledby="analytics-heading">
      <div className="analytics__inner">
        <header className="analytics__heading">
          <h2 id="analytics-heading">
            Следите за проектом <span>в реальном времени</span>
          </h2>
          <p>
            Предоставляем постоянный доступ к ключевым показателям на всём
            протяжении проекта. Панель адаптируем под ваш сценарий.
            <br />
            Демонстрационные показатели. Не являются результатами реального
            проекта
          </p>
        </header>
        <nav className="scenario-tabs" aria-label="Сценарии аналитики">
          {scenarios.map((name, i) => (
            <button
              type="button"
              className={i === scenarioIndex ? 'is-selected' : ''}
              aria-pressed={i === scenarioIndex}
              onClick={() => setScenarioIndex(i)}
              key={name}
            >
              {name}
            </button>
          ))}
        </nav>
        <div className="analytics-grid">
          <div className="kpi-grid">
            {kpis.map((item) => (
              <article className="kpi-card" key={item.label}>
                <span className="kpi-card__label">{item.label}</span>
                <div className="kpi-card__line">
                  <strong>
                    {item.label === 'Participation rate' ||
                    item.label === 'Активностей на участника'
                      ? item.value
                      : Math.round(
                          Number(item.value.replace(/[^\d]/g, '')) * multiplier,
                        ).toLocaleString('ru-RU')}
                  </strong>
                  <span className={`delta${item.positive ? ' delta--up' : ''}`}>
                    {item.delta}
                  </span>
                </div>
                <svg
                  className="kpi-card__spark"
                  viewBox="0 0 100 50"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    className="kpi-card__spark-fill"
                    d={`${item.trend} L100 50 L0 50 Z`}
                  />
                  <path className="kpi-card__spark-line" d={item.trend} />
                </svg>
              </article>
            ))}
          </div>
          <article className="chart-card">
            <div className="chart-card__heading">
              <h3>Активность по дням</h3>
              <div className="chart-period">
                <button
                  type="button"
                  className="chart-period__trigger"
                  aria-expanded={periodOpen}
                  aria-haspopup="listbox"
                  onClick={() => setPeriodOpen((open) => !open)}
                >
                  <svg
                    className="chart-period__calendar"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path
                      d="M4.25 1.25a.75.75 0 0 1 .75.75V3h6V2a.75.75 0 0 1 1.5 0V3h.75A2.25 2.25 0 0 1 15.5 5.25v7.5A2.25 2.25 0 0 1 13.25 15H2.75A2.25 2.25 0 0 1 .5 12.75v-7.5A2.25 2.25 0 0 1 2.75 3H3.5V2a.75.75 0 0 1 .75-.75ZM2 6.5v6.25c0 .414.336.75.75.75h10.5a.75.75 0 0 0 .75-.75V6.5H2Z"
                      fill="currentColor"
                    />
                    <circle cx="5" cy="9.1" r="0.85" fill="#fff" />
                    <circle cx="8" cy="9.1" r="0.85" fill="#fff" />
                    <circle cx="11" cy="9.1" r="0.85" fill="#fff" />
                    <circle cx="5" cy="12" r="0.85" fill="#fff" />
                    <circle cx="8" cy="12" r="0.85" fill="#fff" />
                    <circle cx="11" cy="12" r="0.85" fill="#fff" />
                  </svg>
                  <span className="chart-period__label">{period.label}</span>
                  <svg
                    className={`chart-period__chevron${periodOpen ? ' is-open' : ''}`}
                    viewBox="0 0 12 12"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 4.25L6 7.75L9.5 4.25"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {periodOpen && (
                  <ul className="chart-period__menu" role="listbox">
                    {periods.map((item, index) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={index === periodIndex}
                          className={index === periodIndex ? 'is-selected' : ''}
                          onClick={() => {
                            setPeriodIndex(index);
                            setPeriodOpen(false);
                          }}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="chart">
              <div className="chart__ticks">
                {[800, 600, 400, 200, 0].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
              <div className="chart__plot">
                {period.bars.map((height, i) => (
                  <div className="chart__bar-wrap" key={`${period.id}-${i}`}>
                    <span
                      className="chart__bar"
                      style={{
                        height: `${Math.min(100, (height * multiplier) / 8)}%`,
                      }}
                    />
                    <small>
                      {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i]}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
        <div className="totals-strip">
          {totals.map((item) => (
            <article className="total-card" key={item.label}>
              <IconTile className="total-card__icon">
                <img src={figmaAssets.analyticsIcons[item.icon]} alt="" />
              </IconTile>
              <div>
                <small>{item.label}</small>
                <strong>
                  {Math.round(
                    Number(item.value.replace(/[\s\u00a0]/g, '')) * multiplier,
                  ).toLocaleString('ru-RU')}
                </strong>
              </div>
            </article>
          ))}
        </div>
        <div className="analytics-features">
          {features.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
