import { audienceCards, audienceHeading } from '@/data/landing';
import { IconTile } from '@/components/ui/IconTile';
import { ArrowIcon } from '@/components/ui/ArrowIcon';

type AudienceIcon = (typeof audienceCards)[number]['icon'];

function AudienceIconSvg({ name }: { name: AudienceIcon }) {
  switch (name) {
    case 'users':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.25-.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5ZM2.75 19.5c0-2.9 2.58-5.25 5.75-5.25s5.75 2.35 5.75 5.25V20.5H2.75v-1Zm12.5-.5c0-1.45-.48-2.78-1.28-3.82 1.1-.45 2.32-.68 3.63-.68 2.9 0 5.25 1.98 5.25 4.5V20.5h-7.6V19Z"
          />
        </svg>
      );
    case 'spark':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M12 2.25 13.55 8.4 19.75 9.95l-6.2 1.55L12 17.7l-1.55-6.2L4.25 9.95l6.2-1.55L12 2.25Zm6.4 10.55.75 2.9 2.9.75-2.9.75-.75 2.9-.75-2.9-2.9-.75 2.9-.75.75-2.9ZM5.35 15.1l.65 2.35 2.35.65-2.35.65-.65 2.35-.65-2.35-2.35-.65 2.35-.65.65-2.35Z"
          />
        </svg>
      );
    case 'megaphone':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M19.25 4.1v15.8c0 .82-.9 1.3-1.58.84L12.2 16.9H7.85A3.35 3.35 0 0 1 4.5 13.55v-3.1A3.35 3.35 0 0 1 7.85 7.1h4.35l5.47-3.84c.68-.46 1.58.02 1.58.84ZM7.85 9.1a1.35 1.35 0 0 0-1.35 1.35v3.1c0 .75.6 1.35 1.35 1.35H8.1V9.1h-.25Zm9.4.55-4.55 3.2v2.3l4.55 3.2V9.65ZM9.2 17.65l1.55 2.25c.4.58-.08 1.35-.78 1.35H8.35c-.4 0-.75-.22-.93-.57L6.15 17.65H9.2Z"
          />
        </svg>
      );
    case 'layers':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M12 3 3.2 8.1 12 13.2l8.8-5.1L12 3Zm0 12.15L4.35 10.7l-1.15 1.95L12 17.85l8.8-5.2-1.15-1.95L12 15.15Zm0 3.7-7.65-4.45-1.15 1.95L12 21.65l8.8-5.3-1.15-1.95L12 18.85Z"
          />
        </svg>
      );
  }
}

export default function Audience() {
  return (
    <section
      className="audience section-shell"
      id="what-we-do"
      aria-labelledby="audience-heading"
    >
      <div className="audience__heading">
        <h2 className="section-title" id="audience-heading">
          Для кого мы собираем <span>проекты</span>
        </h2>
        <p className="section-lead">{audienceHeading.lead}</p>
      </div>
      <div className="audience__grid">
        {audienceCards.map((item) => (
          <article className="audience-card" key={item.id}>
            <IconTile className="audience-card__icon">
              <AudienceIconSvg name={item.icon} />
            </IconTile>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
      <a className="telegram-banner" href="#configurator">
        <IconTile>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M22 2.4 2.8 10.1c-1 .4-1 1.8.1 2.1l5 1.6 1.8 5.7c.3.9 1.4 1.1 2 .4l2.9-3.2 4.9 3.6c.8.6 1.9.2 2.1-.8L23.5 3.8c.2-1-.6-1.8-1.5-1.4ZM9.2 13.2l9.5-6.1-7.1 7.6-.4 3.1-1.3-4.4-3.8-1.2 3.1 1Z"
            />
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
