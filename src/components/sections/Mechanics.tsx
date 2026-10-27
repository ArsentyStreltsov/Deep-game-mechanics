import { useEffect, useState } from 'react';
import { figmaAssets } from '@/lib/figma-assets';
import { mechanicsCatalog, mechanicsLead } from '@/data/landing';
import { ArrowButton } from '@/components/ui/ArrowButton';
import { cssVars } from '@/lib/css-vars';
import MechanicsQuiz from '@/components/sections/MechanicsQuiz';

function iconForMechanic(icon: string) {
  return figmaAssets.mechanicIcons[
    icon as keyof typeof figmaAssets.mechanicIcons
  ];
}

function mechanicIndexFromHash() {
  if (typeof window === 'undefined') return 0;
  if (window.location.hash === '#integrations') {
    const index = mechanicsCatalog.findIndex((item) => item.id === 'integrations');
    return index >= 0 ? index : 0;
  }
  return 0;
}

function selectIntegrationsIndex() {
  const index = mechanicsCatalog.findIndex((item) => item.id === 'integrations');
  return index >= 0 ? index : 0;
}

export default function Mechanics() {
  const [active, setActive] = useState(mechanicIndexFromHash);
  const [quizOpen, setQuizOpen] = useState(false);
  const current = mechanicsCatalog[active] ?? mechanicsCatalog[0];

  useEffect(() => {
    function applyHash() {
      if (window.location.hash === '#integrations') {
        setActive(selectIntegrationsIndex());
      }
    }
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const href = target?.closest('a')?.getAttribute('href');
      if (href === '#integrations' || href === '/#integrations') {
        setActive(selectIntegrationsIndex());
      }
      // Ссылки с data-mechanic-id (например, чип «Своя механика» на первом экране) открывают эту возможность.
      const id = target?.closest('[data-mechanic-id]')?.getAttribute('data-mechanic-id');
      const index = id ? mechanicsCatalog.findIndex((item) => item.id === id) : -1;
      if (index >= 0) setActive(index);
    }
    applyHash();
    window.addEventListener('hashchange', applyHash);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('hashchange', applyHash);
      document.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <section
      className="mechanics section-shell"
      id="mechanics"
      aria-labelledby="mechanics-heading"
    >
      <span className="mechanics__anchor" id="integrations" />
      <div className="mechanics__heading" data-reveal>
        <div>
          <h2 className="section-title" id="mechanics-heading">
            Механики и <span>возможности</span>
          </h2>
          <p className="section-lead">{mechanicsLead}</p>
        </div>
        <button
          className="mechanics__try"
          type="button"
          aria-haspopup="dialog"
          aria-label="Протестируйте механики — подбор за 3 вопроса"
          onClick={() => setQuizOpen(true)}
        >
          <img
            className="mechanics__decoration"
            src={figmaAssets.mechanicsDecoration}
            alt=""
            aria-hidden="true"
          />
          <span className="mechanics__try-note" aria-hidden="true">
            Тест из 3 вопросов
          </span>
        </button>
      </div>
      <div className="mechanics__layout">
        <div
          className="mechanics__grid"
          role="listbox"
          aria-label="Выберите возможность"
        >
          {mechanicsCatalog.map((item, index) => (
            <button
              className={`mechanic-card${index === active ? ' is-active' : ''}`}
              key={item.id}
              type="button"
              role="option"
              aria-selected={index === active}
              data-accent={item.accent}
              data-spot
              data-reveal
              style={cssVars({ '--i': index })}
              onClick={() => setActive(index)}
            >
              <span className="mechanic-card__top">
                <span className="mechanic-art">
                  <img
                    src={iconForMechanic(item.icon)}
                    alt=""
                    width={256}
                    height={256}
                    decoding="async"
                  />
                </span>
              </span>
              <strong>{item.title}</strong>
              <span className="mechanic-card__description">{item.summary}</span>
            </button>
          ))}
        </div>
        <aside
          className="mechanic-detail"
          aria-label={current.title}
          data-accent={current.accent}
          data-reveal
        >
          <div className="mechanic-detail__head" key={current.id}>
            <span className="mechanic-art mechanic-art--detail">
              <img
                src={iconForMechanic(current.icon)}
                alt=""
                width={256}
                height={256}
                decoding="async"
              />
            </span>
            <div>
              <h3>{current.title}</h3>
              <p>{current.description}</p>
            </div>
          </div>
          <div className="mechanic-detail__body">
            <span className="mechanic-detail__label">Возможности</span>
            <ul key={current.id}>
              {current.capabilities.map((item, index) => (
                <li key={item} style={cssVars({ '--i': index })}>
                  {item}
                </li>
              ))}
            </ul>
            <ArrowButton href="#configurator" openContact>
              Обсудить эту возможность
            </ArrowButton>
          </div>
        </aside>
      </div>
      {quizOpen && (
        <MechanicsQuiz
          onClose={() => setQuizOpen(false)}
          onPick={(index) => setActive(index)}
        />
      )}
    </section>
  );
}
