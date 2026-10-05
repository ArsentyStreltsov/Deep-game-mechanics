import { useState } from 'react';
import { figmaAssets } from '@/lib/figma-assets';
import { IconTile } from '@/components/ui/IconTile';
import { ArrowButton } from '@/components/ui/ArrowButton';
import { ArrowIcon } from '@/components/ui/ArrowIcon';

const categories = [
  'Программы лояльности',
  'Закрытые клубы',
  'Онлайн- и офлайн-мероприятия',
  'Внешние спецпроекты',
  'Реферальные программы',
  'Обучение',
];

const projects = [
  {
    brand: 'МТС',
    title: '30 лет — чековое промо для сотрудников',
    description:
      'Внутренняя промо-механика с играми, баллами и наградами в честь юбилея компании.',
    category: categories[0],
    artwork: 'mts',
    stats: [
      ['24 000', 'участников'],
      ['3×', 'рост вовлечённости'],
      ['92%', 'положительных отзывов'],
    ],
    quote:
      'Геймификация помогла нам собрать команду вокруг общих ценностей и сделать юбилей по-настоящему запоминающимся.',
    author: 'Команда внутренних коммуникаций МТС',
  },
  {
    brand: 'Клуб',
    title: 'Закрытое сообщество участников',
    description:
      'Платформа с уровнями доступа, регулярными активностями и витриной наград.',
    category: categories[1],
    artwork: 'club',
    stats: [
      ['8 400', 'участников клуба'],
      ['76%', 'возвращаются в клуб'],
      ['12', 'активностей в месяц'],
    ],
    quote:
      'Закрытый клуб помогает поддерживать живое общение и превращает разовые активности в привычку.',
    author: 'Команда проекта',
  },
  {
    brand: 'Ивент',
    title: 'Интерактивное событие для команды',
    description:
      'Задания, игровые активности и общий рейтинг объединены в один сценарий.',
    category: categories[2],
    artwork: 'event',
    stats: [
      ['3 200', 'участников события'],
      ['89%', 'прошли весь сценарий'],
      ['4,8/5', 'оценка участников'],
    ],
    quote:
      'Общая игровая история помогла включить в событие людей из разных команд и городов.',
    author: 'Команда мероприятия',
  },
  {
    brand: 'Промо',
    title: 'Спецпроект для внешней аудитории',
    description:
      'Брендированная игровая механика для знакомства с продуктом и вовлечения участников.',
    category: categories[3],
    artwork: 'promo',
    stats: [
      ['18 600', 'участников кампании'],
      ['2,4×', 'рост взаимодействий'],
      ['64%', 'завершили задания'],
    ],
    quote:
      'Игровой сценарий сделал знакомство с продуктом понятным и запоминающимся.',
    author: 'Команда спецпроекта',
  },
  {
    brand: 'Рефералы',
    title: 'Программа рекомендаций',
    description:
      'Механика приглашений с заданиями, статусами и отслеживанием прогресса.',
    category: categories[4],
    artwork: 'referral',
    stats: [
      ['5 700', 'приглашений'],
      ['41%', 'участников пригласили друга'],
      ['1,8×', 'рост рекомендаций'],
    ],
    quote:
      'Участникам легко делиться проектом, а прогресс программы остаётся прозрачным для команды.',
    author: 'Команда программы',
  },
  {
    brand: 'Обучение',
    title: 'Обучающий игровой маршрут',
    description:
      'Короткие задания, понятный прогресс и награды помогают пройти обучение до конца.',
    category: categories[5],
    artwork: 'learning',
    stats: [
      ['2 100', 'прошли маршрут'],
      ['83%', 'завершили обучение'],
      ['6', 'учебных модулей'],
    ],
    quote:
      'Игровая подача помогает удерживать внимание и видеть, какой шаг обучения следующий.',
    author: 'Команда обучения',
  },
];

const benefits = [
  'Баллы, уровни и персональные достижения',
  'Витрина наград и мерч-шоп',
  'Регулярные кампании и поводы вернуться',
  'Масштабирование на тысячи участников',
];

export default function CaseStudy() {
  const [activeCase, setActiveCase] = useState(0);
  const [activeCategory, setActiveCategory] = useState(0);
  const current = projects[activeCase];
  const isMts = activeCase === 0;
  const total = String(projects.length).padStart(2, '0');
  const currentLabel = String(activeCase + 1).padStart(2, '0');

  function move(direction: number) {
    setActiveCase(
      (index) => (index + direction + projects.length) % projects.length,
    );
  }

  return (
    <section
      className="case-study section-shell"
      id="cases"
      aria-labelledby="case-heading"
    >
      <div className="case-study__heading-row">
        <div>
          <h2 className="section-title" id="case-heading">
            От одной механики
            <br />
            до <span>отдельной платформы</span>
          </h2>
          <p className="section-lead">
            Выберите тип проекта — покажем, что он даёт участникам и как может
            выглядеть решение.
          </p>
        </div>
        <a className="compact-cta" href="#cases">
          Все кейсы
          <span className="compact-cta__icon" aria-hidden="true">
            <ArrowIcon />
          </span>
        </a>
      </div>
      <div className="case-study__filter">
        <span>Для кого</span>
        <div className="chip-strip" role="group" aria-label="Тип проекта">
          {categories.map((item, index) => (
            <button
              className={`chip${index === activeCategory ? ' chip--selected' : ''}`}
              key={item}
              type="button"
              aria-pressed={index === activeCategory}
              onClick={() => {
                setActiveCategory(index);
                setActiveCase(index);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="case-study__body">
        <div className="benefits-panel">
          <div className="benefits-panel__heading">
            <span className="eyebrow-pill">Что даёт</span>
            <h3>{categories[activeCategory]}</h3>
          </div>
          <div className="benefits-list">
            {benefits.map((item, index) => (
              <div className="benefit-row" key={item}>
                <IconTile>
                  <img src={figmaAssets.benefitIcons[index]} alt="" />
                </IconTile>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
        <article
          className={`case-visual case-visual--${current.artwork}`}
          aria-label={`Пример: ${current.title}`}
        >
          <div className="case-visual__art" aria-hidden="true">
            {isMts && (
              <img
                className="case-visual__image"
                src={figmaAssets.caseHero}
                alt=""
              />
            )}
            <span className="case-visual__shade" />
          </div>
          <div className="case-visual__meta">
            КЕЙС <span>•</span> {current.category.toLocaleUpperCase('ru-RU')}
          </div>
          <div
            className="case-visual__counter"
            aria-label={`Кейс ${currentLabel} из ${total}`}
          >
            <span className="case-visual__counter-label">
              {currentLabel}/{total}
            </span>
            <button
              type="button"
              className={activeCase === 0 ? 'is-muted' : ''}
              aria-label="Предыдущий кейс"
              onClick={() => move(-1)}
            >
              <ArrowIcon direction="left" />
            </button>
            <button
              type="button"
              aria-label="Следующий кейс"
              onClick={() => move(1)}
            >
              <ArrowIcon direction="right" />
            </button>
          </div>
          <div className="case-visual__copy">
            <h3>{current.brand}</h3>
            <h4>{current.title}</h4>
            <p>{current.description}</p>
            <div className="case-stats">
              {current.stats.map(([value, label]) => (
                <div key={label}>
                  <strong>{value}</strong>
                  <small>{label}</small>
                </div>
              ))}
            </div>
            <ArrowButton href="#configurator">Смотреть кейс</ArrowButton>
          </div>
          <blockquote className="case-quote">
            <span className="case-quote__mark">“</span>
            <p>{current.quote}</p>
            <div>
              <b>{current.brand}</b>
              <small>{current.author}</small>
            </div>
          </blockquote>
        </article>
      </div>
    </section>
  );
}
