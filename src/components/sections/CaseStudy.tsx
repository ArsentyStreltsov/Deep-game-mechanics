import { useMemo, useState } from 'react';
import { figmaAssets } from '@/lib/figma-assets';
import {
  caseCategories,
  featuredCaseForCategory,
  type CaseCategoryId,
} from '@/data/landing';
import { IconTile } from '@/components/ui/IconTile';
import { ArrowButton } from '@/components/ui/ArrowButton';
import { ArrowIcon } from '@/components/ui/ArrowIcon';

export default function CaseStudy() {
  const [activeCategory, setActiveCategory] = useState<CaseCategoryId>(
    caseCategories[0].id,
  );
  const category =
    caseCategories.find((item) => item.id === activeCategory) ??
    caseCategories[0];
  const current = useMemo(
    () => featuredCaseForCategory(activeCategory),
    [activeCategory],
  );
  const categoryLabel =
    caseCategories.find((item) => item.id === current.categoryId)?.title ??
    current.categoryId;

  return (
    <section
      className="case-study"
      id="cases"
      aria-labelledby="case-heading"
    >
      <div className="case-study__inner">
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
          <a className="compact-cta" href="/cases">
            Все кейсы
            <span className="compact-cta__icon" aria-hidden="true">
              <ArrowIcon />
            </span>
          </a>
        </div>
        <div className="case-study__filter">
          <span>Для кого</span>
          <div className="chip-strip" role="tablist" aria-label="Тип проекта">
            {caseCategories.map((item) => (
              <button
                className={`chip${item.id === activeCategory ? ' chip--selected' : ''}`}
                key={item.id}
                type="button"
                role="tab"
                aria-selected={item.id === activeCategory}
                onClick={() => setActiveCategory(item.id)}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
        <div className="case-study__body">
          <div className="benefits-panel">
            <div className="benefits-panel__heading">
              <h3>{category.title}</h3>
              <p>
                Собираем сценарий, контент и интеграции под задачу — на
                проверенной платформенной базе.
              </p>
            </div>
            <div className="benefits-list">
              {category.benefits.map((item, index) => (
                <div className="benefit-row" key={item.title}>
                  <IconTile>
                    <img
                      src={
                        figmaAssets.benefitIcons[
                          index % figmaAssets.benefitIcons.length
                        ]
                      }
                      alt=""
                    />
                  </IconTile>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <article
            className={`case-visual case-visual--${current.artwork}`}
            aria-label={`Пример: ${current.brand} — ${current.title}`}
          >
            <div className="case-visual__art" aria-hidden="true">
              <span className="case-visual__shade" />
            </div>
            <div className="case-visual__meta">
              КЕЙС <span>•</span> {categoryLabel.toLocaleUpperCase('ru-RU')}
            </div>
            <div className="case-visual__copy">
              <header className="case-visual__head">
                <h3>{current.brand}</h3>
                <h4>{current.title}</h4>
                <p>{current.description}</p>
              </header>

              <dl className="case-facts">
                <div className="case-facts__task">
                  <dt>Задача</dt>
                  <dd>{current.task}</dd>
                </div>
                <div className="case-facts__metrics">
                  <div>
                    <dt>Масштаб</dt>
                    <dd>{current.scale}</dd>
                  </div>
                  <div>
                    <dt>Продолжительность</dt>
                    <dd>{current.duration}</dd>
                  </div>
                </div>
              </dl>

              <div className="case-stats" aria-label="Ключевые результаты">
                {current.results.map((item) => (
                  <div key={`${item.value}-${item.label}`}>
                    <strong>{item.value}</strong>
                    <small>{item.label}</small>
                  </div>
                ))}
              </div>
            </div>
            <div className="case-visual__cta">
              <ArrowButton href="#configurator">Хочу узнать подробнее</ArrowButton>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
