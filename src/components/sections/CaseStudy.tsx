import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { figmaAssets } from '@/lib/figma-assets';
import {
  caseBrand,
  caseCategories,
  cases,
  type CaseCategoryId,
} from '@/data/landing';
import { IconTile } from '@/components/ui/IconTile';
import { ArrowButton } from '@/components/ui/ArrowButton';
import { ArrowIcon } from '@/components/ui/ArrowIcon';
import { cssVars } from '@/lib/css-vars';

export default function CaseStudy() {
  const [activeCategory, setActiveCategory] = useState<CaseCategoryId>(
    caseCategories[0].id,
  );
  const [activeCaseId, setActiveCaseId] = useState('');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const category =
    caseCategories.find((item) => item.id === activeCategory) ??
    caseCategories[0];
  const categoryCases = cases.filter(
    (item) => item.categoryId === category.id,
  );
  const current =
    categoryCases.find((item) => item.id === activeCaseId) ?? categoryCases[0];

  function selectCategory(id: CaseCategoryId) {
    setActiveCategory(id);
    setActiveCaseId('');
  }

  // Карточки блока «Для кого» и кнопки «Для задач» в первом экране открывают нужную задачу в этом разделе.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const trigger = (event.target as Element | null)?.closest?.(
        '[data-case-category]',
      );
      const id = trigger?.getAttribute('data-case-category');
      const category = caseCategories.find((item) => item.id === id);
      if (!trigger || !category) return;
      setActiveCategory(category.id);
      setActiveCaseId(trigger.getAttribute('data-case-id') ?? '');
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Ссылка вида /#case-<id> (со страницы «Все кейсы», из закладки или письма) открывает нужный проект.
  // К самому разделу страница прокручивается без скриптов: якоря `case-<id>` лежат над вкладками.
  useEffect(() => {
    function openFromHash() {
      const match = /^#case-([\w-]+)$/.exec(window.location.hash);
      const item = match ? cases.find((entry) => entry.id === match[1]) : undefined;
      if (!item) return;
      setActiveCategory(item.categoryId);
      setActiveCaseId(item.id);
    }
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, []);

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = caseCategories.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % caseCategories.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + caseCategories.length) % caseCategories.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : -1;
    if (next < 0) return;
    event.preventDefault();
    selectCategory(caseCategories[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <section
      className="case-study"
      id="cases"
      aria-labelledby="case-heading"
    >
      <div className="case-study__inner">
        <div className="case-study__heading-row" data-reveal>
          <div>
            <h2 className="section-title" id="case-heading">
              Кейсы
              <br />
              <span>по задачам</span>
            </h2>
            <p className="section-lead">
              Выберите задачу — покажем похожий проект: что получили
              участники и из чего он собран.
            </p>
          </div>
          <a className="compact-cta" href="/cases">
            Все кейсы
            <span className="compact-cta__icon" aria-hidden="true">
              <ArrowIcon />
            </span>
          </a>
        </div>
        <span className="case-anchors" aria-hidden="true">
          {cases.map((item) => (
            <span id={`case-${item.id}`} key={item.id} />
          ))}
        </span>
        <div className="case-study__filter" data-reveal>
          <span id="case-filter-label">Задача</span>
          <div
            className="chip-strip"
            role="tablist"
            aria-labelledby="case-filter-label"
          >
            {caseCategories.map((item, index) => {
              const selected = item.id === activeCategory;
              return (
                <button
                  className={`chip${selected ? ' chip--selected' : ''}`}
                  key={item.id}
                  data-accent={item.accent}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`case-tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls="case-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectCategory(item.id)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                >
                  {item.title}
                </button>
              );
            })}
          </div>
        </div>
        {categoryCases.length > 1 ? (
          // без data-reveal: блок появляется и пропадает при смене задачи, а наблюдатель прокрутки
          // видит только то, что было на странице при загрузке
          <div className="case-study__examples">
            <span id="case-examples-label">Проекты</span>
            <div
              className="case-switch"
              role="group"
              aria-labelledby="case-examples-label"
            >
              {categoryCases.map((item) => (
                <button
                  className={`case-switch__item${item.id === current.id ? ' is-active' : ''}`}
                  key={item.id}
                  data-brand={item.theme}
                  type="button"
                  aria-pressed={item.id === current.id}
                  onClick={() => setActiveCaseId(item.id)}
                >
                  <b>{item.brand}</b>
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div
          className="case-study__body"
          id="case-panel"
          data-reveal
          role="tabpanel"
          aria-labelledby={`case-tab-${category.id}`}
        >
          <div className="benefits-panel" data-accent={category.accent}>
            <div className="benefits-panel__heading">
              <h3>{category.title}</h3>
              <p>{category.lead}</p>
            </div>
            <div className="benefits-list" key={category.id}>
              {category.benefits.map((item, index) => (
                <div
                  className="benefit-row"
                  key={item.title}
                  style={cssVars({ '--i': index })}
                >
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
            className={`case-visual case-visual--${current.artwork} case-visual--cover case-visual--brand`}
            data-brand={current.theme}
            aria-label={`Пример: ${caseBrand(current)} — ${current.title}`}
          >
            <div className="case-visual__art" aria-hidden="true">
              <img
                className="case-visual__image"
                key={current.id}
                src={current.cover}
                alt=""
                width={1536}
                height={1024}
                decoding="async"
              />
              <span className="case-visual__shade" />
            </div>
            <div className="case-visual__meta" key={category.id}>
              КЕЙС <span>•</span> {category.title.toLocaleUpperCase('ru-RU')}
            </div>
            <div className="case-visual__copy" key={current.id}>
              <header className="case-visual__head">
                <h3>
                  {current.brand}
                  {current.brandNote ? (
                    <>
                      {' '}
                      <small className="case-visual__brand-note">
                        ({current.brandNote})
                      </small>
                    </>
                  ) : null}
                </h3>
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
              <ArrowButton
                href="#configurator"
                openContact
                context={`${caseBrand(current)} — ${current.title}`}
                kicker="Похожий проект"
                source={`case-${current.id}`}
              >
                Обсудить такой проект
              </ArrowButton>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
