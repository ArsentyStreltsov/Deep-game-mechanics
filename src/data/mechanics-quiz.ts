import { mechanicsCatalog } from './landing';

/**
 * Мини-тест «Протестируйте механики»: три вопроса о задаче → две механики из каталога.
 * Это ориентир для разговора, а не расчёт: каждому ответу даны баллы по механикам, побеждают
 * две с наибольшей суммой (при равенстве — та, что выше в каталоге).
 */

export type MechanicId = (typeof mechanicsCatalog)[number]['id'];

export type QuizOption = {
  label: string;
  weights: Partial<Record<MechanicId, number>>;
};

export type QuizQuestion = {
  title: string;
  options: readonly QuizOption[];
};

export const quizQuestions: readonly QuizQuestion[] = [
  {
    title: 'Кого хотите вовлечь?',
    options: [
      {
        label: 'Своих сотрудников',
        weights: { learning: 2, teams: 1, 'quick-games': 1 },
      },
      {
        label: 'Клиентов и аудиторию бренда',
        weights: { 'quick-games': 2, shop: 1, custom: 1 },
      },
      {
        label: 'Покупателей в рознице',
        weights: { receipts: 3, shop: 1, 'quick-games': 1 },
      },
      {
        label: 'Гостей мероприятия',
        weights: { live: 2, 'quick-games': 2, teams: 1 },
      },
    ],
  },
  {
    title: 'Что важнее всего получить?',
    options: [
      { label: 'Знания и навыки', weights: { learning: 3, 'quick-games': 1 } },
      { label: 'Активность и азарт', weights: { 'quick-games': 3, teams: 1 } },
      { label: 'Покупки и продажи', weights: { receipts: 3, shop: 2 } },
      { label: 'Возвращение и лояльность', weights: { shop: 3, teams: 1 } },
    ],
  },
  {
    title: 'Как участники будут играть?',
    options: [
      {
        label: 'Каждый сам за себя',
        weights: { 'quick-games': 2, learning: 1 },
      },
      { label: 'Командами и офисами', weights: { teams: 3 } },
      {
        label: 'В прямом эфире или на площадке',
        weights: { live: 3, 'quick-games': 1 },
      },
      { label: 'По особому сценарию', weights: { custom: 4 } },
    ],
  },
];

/** Две механики с наибольшей суммой баллов по ответам (индексы выбранных вариантов). */
export function recommend(answers: readonly number[]) {
  const scores = new Map<MechanicId, number>();
  answers.forEach((answer, questionIndex) => {
    const option = quizQuestions[questionIndex]?.options[answer];
    if (!option) return;
    for (const [id, weight] of Object.entries(option.weights)) {
      scores.set(
        id as MechanicId,
        (scores.get(id as MechanicId) ?? 0) + (weight ?? 0),
      );
    }
  });
  return mechanicsCatalog
    .map((item, index) => ({ item, index, score: scores.get(item.id) ?? 0 }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 2);
}
