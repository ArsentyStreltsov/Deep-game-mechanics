import type { Accent } from './landing';

/**
 * Конфигуратор «Соберите пример проекта»: варианты ответов и тексты карточки «Детали проекта».
 * Для каждой задачи тексты написаны отдельно — шаблонная подстановка («Другое для 500 сотрудников»)
 * ломала русскую грамматику. Сроков по месяцам здесь нет намеренно: подтверждённое обещание сайта —
 * «от 1 недели на готовых модулях», остальное зависит от состава и называется после брифа.
 */

export type Task = {
  /** Подпись кнопки в вопросе; совпадает с названиями задач в «Для кого» и «Кейсах». */
  label: string;
  /** Кого считаем в масштабе проекта (родительный падеж множественного числа). */
  people: string;
  /** Заголовок карточки «Детали проекта». Без цифр: масштаб показан отдельной строкой. */
  title: string;
  /** Как проект работает для этой задачи — первое предложение описания. */
  lead: string;
};

export const tasks: readonly Task[] = [
  {
    label: 'Онбординг',
    people: 'сотрудников',
    title: 'Онбординг новых сотрудников',
    lead: 'Новичок проходит первые недели как игровой маршрут: знакомится с командой, продуктами и правилами компании и получает награды за каждый шаг.',
  },
  {
    label: 'Обучение',
    people: 'сотрудников',
    title: 'Обучение сотрудников',
    lead: 'Обучение превращается в игровой маршрут: короткие модули, задания и проверка знаний, а прогресс виден и сотруднику, и команде.',
  },
  {
    label: 'Вовлечение команды',
    people: 'сотрудников',
    title: 'Вовлечение команды',
    lead: 'Челленджи, общий рейтинг и командные цели собирают людей вокруг важных для компании тем и поддерживают интерес на протяжении всей кампании.',
  },
  {
    label: 'Клуб и лояльность',
    people: 'участников',
    title: 'Клуб и программа лояльности',
    lead: 'Участники копят баллы за действия, открывают статусы и обменивают баллы на награды: это постоянная программа, а не разовая акция.',
  },
  {
    label: 'Мероприятие',
    people: 'участников',
    title: 'Игровая механика для мероприятия',
    lead: 'Один сценарий для площадки и онлайна: QR-активности, задания, эфир и общий рейтинг до, во время и после события.',
  },
  {
    label: 'Внешний спецпроект',
    people: 'участников',
    title: 'Внешний спецпроект',
    lead: 'Брендированная игровая механика для клиентов и широкой аудитории: сценарий, визуал и контент собираются под задачу кампании.',
  },
  {
    label: 'Трейд-маркетинг',
    people: 'покупателей',
    title: 'Трейд-маркетинг: игровая промо-механика',
    lead: 'Покупка становится входом в механику: проверка чеков, баллы и призы в одном контуре, а ход кампании виден в аналитике.',
  },
  {
    label: 'Реферальная программа',
    people: 'участников',
    title: 'Реферальная программа',
    lead: 'Участники приглашают друзей и коллег по личной ссылке и получают баллы и награды за каждого, кто присоединился.',
  },
  {
    label: 'Другое',
    people: 'участников',
    title: 'Проект под вашу задачу',
    lead: 'Расскажите, что нужно получить: соберём механику из готовых модулей и доработаем сценарий и визуал под вас.',
  },
];

export type Scale = {
  label: string;
  /** Как читается перед словом «сотрудников» / «участников» / «покупателей». */
  phrase: string;
};

export const scales: readonly Scale[] = [
  { label: 'до 500', phrase: 'до 500' },
  { label: '500 – 2 000', phrase: '500 – 2 000' },
  { label: '2 000 – 10 000', phrase: '2 000 – 10 000' },
  { label: '10 000+', phrase: 'более 10 000' },
];

export type Module = {
  label: string;
  /** Как звучит в перечислении «В составе: …». */
  phrase: string;
};

export const modules: readonly Module[] = [
  { label: 'Игры', phrase: 'игры' },
  { label: 'Задания', phrase: 'задания' },
  { label: 'Прямой эфир', phrase: 'прямой эфир' },
  { label: 'Команды', phrase: 'командный зачёт' },
  { label: 'Рейтинг', phrase: 'рейтинг' },
  { label: 'Награды', phrase: 'награды' },
  { label: 'Мерч-шоп', phrase: 'мерч-шоп' },
  { label: 'Проверка чеков', phrase: 'проверка чеков' },
  { label: 'Пользовательский контент', phrase: 'пользовательский контент' },
  { label: 'Telegram-бот с web app', phrase: 'Telegram-бот с web app' },
];

export type Integration = {
  label: string;
  /** Предложение о том, что именно подключаем (без точки в конце). */
  clause: string;
};

export const integrations: readonly Integration[] = [
  {
    label: 'Нет',
    clause:
      'Проект можно запустить отдельно и при необходимости связать с вашей инфраструктурой позже',
  },
  { label: 'HR-система', clause: 'Свяжем проект с вашей HR-системой' },
  { label: 'SSO', clause: 'Настроим корпоративный вход (SSO)' },
  { label: 'LMS', clause: 'Свяжем проект с обучающей платформой (LMS)' },
  { label: 'CRM', clause: 'Свяжем проект с вашей CRM' },
  {
    label: 'Корпоративный портал',
    clause: 'Встроим проект в корпоративный портал',
  },
  {
    label: 'Несколько систем',
    clause: 'Свяжем проект с несколькими вашими системами',
  },
];

export type Question = {
  title: string;
  hint?: string;
  options: readonly string[];
  multiple?: boolean;
  /** Цвет значка вопроса — из общей палитры задач. */
  accent: Accent;
};

export const questions: readonly Question[] = [
  {
    title: 'Какая задача?',
    options: tasks.map((item) => item.label),
    accent: 'blue',
  },
  {
    title: 'Сколько участников?',
    options: scales.map((item) => item.label),
    accent: 'cyan',
  },
  {
    title: 'Что добавить?',
    hint: 'Можно выбрать несколько или не выбирать ничего',
    options: modules.map((item) => item.label),
    multiple: true,
    accent: 'violet',
  },
  {
    title: 'Нужны интеграции?',
    options: integrations.map((item) => item.label),
    accent: 'green',
  },
];

/** Что выбрано при загрузке страницы: индексы вариантов по каждому вопросу. */
export const defaultSelection: readonly (readonly number[])[] = [
  [0],
  [1],
  [0, 1],
  [0],
];

/** Склонение: 1 модуль, 2 модуля, 5 модулей. */
export function plural(count: number, one: string, few: string, many: string) {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/** «игры, задания и рейтинг». */
export function joinList(items: readonly string[]) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} и ${items[items.length - 1]}`;
}

export type ProjectExample = {
  task: Task;
  scale: Scale;
  moduleLabels: string[];
  integrationLabels: string[];
  title: string;
  description: string;
  /** «до 500 сотрудников», «более 10 000 покупателей». */
  scaleText: string;
  /** «3 модуля, без интеграций» / «Модули подберём вместе». */
  compositionText: string;
};

/** Собирает карточку «Детали проекта» из выбранных индексов. */
export function buildExample(
  selection: readonly (readonly number[])[],
): ProjectExample {
  const task = tasks[selection[0][0]] ?? tasks[tasks.length - 1];
  const scale = scales[selection[1][0]] ?? scales[0];
  const picked = selection[2].map((index) => modules[index]).filter(Boolean);
  const integration = integrations[selection[3][0]] ?? integrations[0];
  const moduleLabels = picked.map((item) => item.label);
  const integrationLabels =
    integration.label === 'Нет' ? [] : [integration.label];

  const modulesSentence = picked.length
    ? `В составе: ${joinList(picked.map((item) => item.phrase))}.`
    : 'Набор модулей подберём вместе: из готовых механик или кастомных.';
  const integrationSentence =
    integration.label === 'Нет'
      ? `${integration.clause}.`
      : `${integration.clause} — объём определим после технического анализа.`;

  const compositionText = picked.length
    ? `${picked.length} ${plural(picked.length, 'модуль', 'модуля', 'модулей')}, ${
        integrationLabels.length ? 'с интеграцией' : 'без интеграций'
      }`
    : 'Модули подберём вместе';

  return {
    task,
    scale,
    moduleLabels,
    integrationLabels,
    title: task.title,
    description: [task.lead, modulesSentence, integrationSentence].join(' '),
    scaleText: `${scale.phrase} ${task.people}`,
    compositionText,
  };
}
