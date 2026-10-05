import { useState } from 'react';
import { faqItems } from '@/data/landing';
import { figmaAssets } from '@/lib/figma-assets';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function toggle(index: number) {
    const selection = window.getSelection()?.toString();
    if (selection) return;
    setOpenIndex((current) => (current === index ? null : index));
  }

  return (
    <section
      className="faq section-shell"
      id="faq"
      aria-labelledby="faq-heading"
    >
      <header className="faq__heading">
        <h2 className="section-title" id="faq-heading">
          FAQ
        </h2>
        <p className="section-lead">
          Коротко о том, как устроена работа с платформой
        </p>
      </header>
      <div className="faq__list">
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              className={`faq-item${isOpen ? ' is-open' : ''}`}
              key={item.question}
            >
              <button
                type="button"
                className="faq-item__trigger"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${index}`}
                id={`faq-trigger-${index}`}
                onClick={() => toggle(index)}
              >
                <span className="faq-item__question">{item.question}</span>
                <img src={figmaAssets.faqChevron} alt="" aria-hidden="true" />
              </button>
              <div
                className="faq-item__panel"
                id={`faq-panel-${index}`}
                role="region"
                aria-labelledby={`faq-trigger-${index}`}
                hidden={!isOpen}
                onClick={() => toggle(index)}
              >
                <p>{item.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
