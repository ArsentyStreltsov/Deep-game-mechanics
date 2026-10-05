import { useState } from 'react';
import { figmaAssets } from '@/lib/figma-assets';
import { audienceCards } from '@/data/landing';
import { IconTile } from '@/components/ui/IconTile';
import { ArrowIcon } from '@/components/ui/ArrowIcon';

export default function Audience() {
  const [failedIcons, setFailedIcons] = useState<number[]>([]);
  return (
    <section
      className="audience section-shell"
      id="what-we-do"
      aria-label="Для кого мы делаем проекты"
    >
      <div className="audience__grid">
        {audienceCards.map((item, index) => (
          <article className="audience-card" key={item.title}>
            <IconTile>
              <img
                src={figmaAssets.audiences[0]}
                alt=""
                onError={() =>
                  setFailedIcons((current) =>
                    current.includes(index) ? current : [...current, index],
                  )
                }
              />
              {failedIcons.includes(index) && (
                <span
                  className="audience-card__icon-fallback"
                  aria-hidden="true"
                >
                  ★
                </span>
              )}
            </IconTile>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
      <a className="telegram-banner" href="#configurator">
        <IconTile>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M22 2.4 2.8 10.1c-1 .4-1 1.8.1 2.1l5 1.6 1.8 5.7c.3.9 1.4 1.1 2 .4l2.9-3.2 4.9 3.6c.8.6 1.9.2 2.1-.8L23.5 3.8c.2-1-.6-1.8-1.5-1.4ZM9.2 13.2l9.5-6.1-7.1 7.6-.4 3.1-1.3-4.4-3.8-1.2 3.1 1Z" />
          </svg>
        </IconTile>
        <span className="telegram-banner__copy">
          <strong>Также запускаем Telegram-боты с web app</strong>
          <small>
            Онлайн- и офлайн-активности, QR-коды, задания и начисление баллов в
            одном сценарии.
          </small>
        </span>
        <span className="telegram-banner__arrow" aria-hidden="true">
          <ArrowIcon direction="right" />
        </span>
      </a>
    </section>
  );
}
