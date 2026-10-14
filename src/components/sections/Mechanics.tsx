import { useEffect, useState } from 'react';
import { figmaAssets } from '@/lib/figma-assets';
import { mechanicsCatalog } from '@/data/landing';
import { IconTile } from '@/components/ui/IconTile';
import { ArrowButton } from '@/components/ui/ArrowButton';

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
  const current = mechanicsCatalog[active] ?? mechanicsCatalog[0];

  useEffect(() => {
    function applyHash() {
      if (window.location.hash === '#integrations') {
        setActive(selectIntegrationsIndex());
      }
    }
    function onClick(event: MouseEvent) {
      const link = (event.target as HTMLElement | null)?.closest('a');
      const href = link?.getAttribute('href');
      if (href === '#integrations' || href === '/#integrations') {
        setActive(selectIntegrationsIndex());
      }
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
      <div className="mechanics__heading">
        <div>
          <h2 className="section-title" id="mechanics-heading">
            Механики и <span>возможности</span>
          </h2>
          <p className="section-lead">
            Короткий набор того, что можно собрать в проекте. Узнайте свою
            задачу — сценарий, контент и интеграции докрутим под неё.
          </p>
        </div>
        <img
          className="mechanics__decoration"
          src={figmaAssets.mechanicsDecoration}
          alt=""
          aria-hidden="true"
        />
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
              onClick={() => setActive(index)}
            >
              <span className="mechanic-card__top">
                <IconTile>
                  <img src={iconForMechanic(item.icon)} alt="" />
                </IconTile>
              </span>
              <strong>{item.title}</strong>
              <span className="mechanic-card__description">{item.summary}</span>
            </button>
          ))}
        </div>
        <aside
          className="mechanic-detail"
          aria-label={current.title}
        >
          <div className="mechanic-detail__head">
            <IconTile>
              <img src={iconForMechanic(current.icon)} alt="" />
            </IconTile>
            <div>
              <h3>{current.title}</h3>
              <p>{current.description}</p>
            </div>
          </div>
          <div className="mechanic-detail__body">
            <span className="mechanic-detail__label">Возможности</span>
            <ul>
              {current.capabilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <ArrowButton href="#configurator">Обсудить эту возможность</ArrowButton>
          </div>
        </aside>
      </div>
    </section>
  );
}
