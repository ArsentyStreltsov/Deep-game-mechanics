import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { figmaAssets } from '@/lib/figma-assets';
import { IconTile } from '@/components/ui/IconTile';
import { ArrowIcon } from '@/components/ui/ArrowIcon';

const questions = [
  {
    title: 'Какая задача?',
    options: [
      'Офлайн-мероприятие',
      'Онбординг',
      'Обучение',
      'Вовлечение',
      'Интерактивный спецпроект',
      'Внешний спецпроект',
      'Отдельная платформа',
      'Реферальная программа',
      'Другое',
    ],
  },
  {
    title: 'Сколько участников?',
    options: ['до 500', '500 – 2 000', '2 000 – 10 000', '10 000+'],
  },
  {
    title: 'Что добавить?',
    options: [
      'Игры',
      'Задания',
      'Live',
      'Команды',
      'Рейтинг',
      'Награды',
      'Пользовательский контент',
      'Telegram / бот-webapp',
    ],
  },
  {
    title: 'Нужны интеграции?',
    options: [
      'Нет',
      'HR-система',
      'SSO',
      'LMS',
      'Корпоративный портал',
      'Несколько систем',
    ],
  },
];
const defaultSelection = [1, 1, [1, 2], 0] as const;

type DiscussForm = {
  name: string;
  contact: string;
  details: string;
};

const emptyForm: DiscussForm = {
  name: '',
  contact: '',
  details: '',
};

export default function Configurator() {
  const [submitted, setSubmitted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<DiscussForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof DiscussForm, string>>>(
    {},
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [selection, setSelection] = useState<number[][]>(
    defaultSelection.map((value) =>
      Array.isArray(value) ? [...value] : [value as number],
    ),
  );
  const values = useMemo(
    () =>
      selection.map((indexes, q) =>
        indexes.map((index) => questions[q].options[index]).filter(Boolean),
      ),
    [selection],
  );
  const [task] = values;
  const audience = values[1][0] ?? 'до 500';
  const modules = values[2];
  const integrations = values[3];
  const selectedTask = task[0] ?? 'Проект';
  const participantCount =
    audience === 'до 500'
      ? '500'
      : audience === '500 – 2 000'
        ? '1 500'
        : audience === '2 000 – 10 000'
          ? '5 000'
          : '10 000+';
  const participantWord = [
    'Внешний спецпроект',
    'Реферальная программа',
  ].includes(selectedTask)
    ? 'участников'
    : 'сотрудников';
  const title = `${selectedTask} для ${participantCount} ${participantWord}`;
  const description = [
    `Участники входят через корпоративный доступ и сразу попадают в персональный сценарий «${selectedTask}».`,
    modules.length
      ? `Внутри — ${modules.join(', ').toLocaleLowerCase('ru-RU')}, понятный прогресс и награды по ходу пути.`
      : 'Внутри — игровые механики, понятный прогресс и награды по ходу пути.',
    integrations[0] === 'Нет'
      ? 'Проект можно запустить отдельно и при необходимости связать с вашей инфраструктурой позже.'
      : `Подключим ${integrations.join(', ')} и настроим интеграции под вашу инфраструктуру.`,
  ].join(' ');

  function toggle(questionIndex: number, optionIndex: number) {
    setSubmitted(false);
    setSelection((current) =>
      current.map((items, index) => {
        if (index !== questionIndex) return items;
        if (questionIndex !== 2) return [optionIndex];
        const next = items.includes(optionIndex)
          ? items.filter((item) => item !== optionIndex)
          : [...items, optionIndex];
        return next.length ? next : [optionIndex];
      }),
    );
  }

  function openModal() {
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setErrors({});
  }

  function validate(next: DiscussForm) {
    const nextErrors: Partial<Record<keyof DiscussForm, string>> = {};
    if (!next.name.trim()) {
      nextErrors.name = 'Укажите, как к вам обращаться';
    }
    if (!next.contact.trim()) {
      nextErrors.contact = 'Укажите почту или телефон';
    }
    return nextErrors;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitted(true);
    setModalOpen(false);
    setForm(emptyForm);
  }

  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeModal();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [modalOpen]);

  return (
    <section
      className="configurator"
      id="configurator"
      aria-labelledby="configurator-heading"
    >
      <div className="configurator__inner">
        <header className="configurator__intro">
          <h2 id="configurator-heading">
            <span>Соберите пример</span> своего проекта
          </h2>
          <p>
            Выберите задачу, масштаб и модули — покажем возможный сценарий.
            Готовые модули ускоряют запуск, а<br className="desktop-break" />{' '}
            дизайн, контент и пользовательский путь остаются вашими.
          </p>
        </header>
        <div className="configurator__columns">
          <div className="builder-panel">
            <h3>
              Настройте <span>свой проект</span>
            </h3>
            {questions.map((question, questionIndex) => (
              <fieldset className="builder-question" key={question.title}>
                <IconTile>
                  <img
                    src={figmaAssets.configuratorIcons[questionIndex]}
                    alt=""
                  />
                </IconTile>
                <div className="builder-question__content">
                  <legend>{question.title}</legend>
                  <div
                    className="builder-options"
                    role="group"
                    aria-label={question.title}
                  >
                    {question.options.map((option, optionIndex) => (
                      <button
                        className={
                          selection[questionIndex].includes(optionIndex)
                            ? 'is-selected'
                            : ''
                        }
                        type="button"
                        key={option}
                        aria-pressed={selection[questionIndex].includes(
                          optionIndex,
                        )}
                        onClick={() => toggle(questionIndex, optionIndex)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </fieldset>
            ))}
          </div>
          <aside className="project-summary" aria-live="polite">
            <span className="project-summary__eyebrow">Детали проекта</span>
            <h3>{title}</h3>
            <p>{description}</p>
            <div className="summary-tags">
              {[
                ...integrations.filter((item) => item !== 'Нет'),
                ...(modules.length ? modules : ['Механики']),
              ].map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="summary-facts">
              <div>
                <b aria-hidden="true">▦</b>
                <span>
                  Примерный срок разработки
                  <strong>
                    {audience === 'до 500'
                      ? '1 – 2 месяца'
                      : audience === '10 000+'
                        ? '4 – 6 месяцев'
                        : '3 – 4 месяца'}
                  </strong>
                </span>
              </div>
              <div>
                <b aria-hidden="true">♟</b>
                <span>
                  Масштаб проекта
                  <strong>
                    {participantCount} {participantWord}
                  </strong>
                </span>
              </div>
            </div>
            <div className="project-summary__cta">
              {submitted ? (
                <div
                  className="project-summary__success"
                  role="status"
                  aria-live="polite"
                >
                  <strong>Спасибо! Заявка принята</strong>
                  <span>Вернёмся к вам, чтобы обсудить детали проекта.</span>
                </div>
              ) : (
                <>
                  <button
                    className="arrow-button arrow-button--light"
                    type="button"
                    onClick={openModal}
                  >
                    <span>Обсудить проект</span>
                    <span aria-hidden="true" className="arrow-button__icon">
                      <ArrowIcon className="arrow-button__arrow" />
                    </span>
                  </button>
                  <small>Расскажем, как адаптировать под ваши задачи</small>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>

      {modalOpen && (
        <div
          className="discuss-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="discuss-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="discuss-modal-title"
          >
            <button
              ref={closeButtonRef}
              className="discuss-modal__close"
              type="button"
              aria-label="Закрыть"
              onClick={closeModal}
            >
              <span aria-hidden="true">×</span>
            </button>
            <span className="discuss-modal__eyebrow">Задача</span>
            <h3 id="discuss-modal-title">Расскажите, что хотите запустить</h3>
            <p className="discuss-modal__context">{title}</p>
            <form className="discuss-modal__form" onSubmit={handleSubmit} noValidate>
              <label className="discuss-field">
                <span>
                  Как к вам обращаться <em aria-hidden="true">*</em>
                </span>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={form.name}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'discuss-name-error' : undefined}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }));
                    if (errors.name) {
                      setErrors((current) => ({ ...current, name: undefined }));
                    }
                  }}
                />
                {errors.name && (
                  <small id="discuss-name-error" className="discuss-field__error">
                    {errors.name}
                  </small>
                )}
              </label>
              <label className="discuss-field">
                <span>
                  Почта или телефон <em aria-hidden="true">*</em>
                </span>
                <input
                  type="text"
                  name="contact"
                  autoComplete="email"
                  placeholder="name@company.ru или +7"
                  value={form.contact}
                  aria-invalid={Boolean(errors.contact)}
                  aria-describedby={
                    errors.contact ? 'discuss-contact-error' : undefined
                  }
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      contact: event.target.value,
                    }));
                    if (errors.contact) {
                      setErrors((current) => ({
                        ...current,
                        contact: undefined,
                      }));
                    }
                  }}
                />
                {errors.contact && (
                  <small
                    id="discuss-contact-error"
                    className="discuss-field__error"
                  >
                    {errors.contact}
                  </small>
                )}
              </label>
              <label className="discuss-field">
                <span>
                  Опишите задачу <small>(необязательно)</small>
                </span>
                <textarea
                  name="details"
                  rows={4}
                  placeholder="Хочу обсудить проект"
                  value={form.details}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      details: event.target.value,
                    }))
                  }
                />
              </label>
              <button className="discuss-modal__submit" type="submit">
                Отправить заявку
              </button>
              <p className="discuss-modal__legal">
                Нажимая кнопку, вы соглашаетесь на обработку данных для связи по
                задаче.
              </p>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
