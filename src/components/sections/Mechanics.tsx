import { useEffect, useMemo, useRef, useState } from 'react';
import { figmaAssets } from '@/lib/figma-assets';
import { mechanics } from '@/data/landing';
import { IconTile } from '@/components/ui/IconTile';
import { ArrowButton } from '@/components/ui/ArrowButton';

const DEMO_COUNT = 4;

const quizQuestions = [
  {
    prompt: 'Что важнее для digital HR-события?',
    choices: [
      'Только смотреть эфир',
      'Участвовать и получать прогресс',
      'Читать регламент',
    ],
  },
  {
    prompt: 'Как лучше вовлечь удалённую команду?',
    choices: [
      'Общий чат без правил',
      'Игровая механика с баллами',
      'Длинная презентация',
    ],
  },
  {
    prompt: 'Что помогает удержать внимание участников?',
    choices: [
      'Короткие задания и прогресс',
      'Только текстовые инструкции',
      'Один большой опрос в конце',
    ],
  },
];

const wheelPrizes = [
  { label: '★', points: 50 },
  { label: '+100', points: 100 },
  { label: '🎁', points: 75 },
  { label: '+50', points: 50 },
  { label: '★', points: 50 },
  { label: '+200', points: 200 },
  { label: '🔥', points: 80 },
  { label: '+25', points: 25 },
];

const memorySymbols = ['★', '◆', '●', '▲', '★', '◆', '●', '▲'];

function iconForMechanic(icon: string) {
  return figmaAssets.mechanicIcons[
    icon as keyof typeof figmaAssets.mechanicIcons
  ];
}

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function QuizDemo() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);
  const question = quizQuestions[step];
  const progress = ((step + 1) / quizQuestions.length) * 100;

  function pick(index: number) {
    if (done || leaving) return;
    setSelected(index);
  }

  function goNext() {
    if (selected === null || leaving || done) return;
    if (step >= quizQuestions.length - 1) {
      setDone(true);
      return;
    }
    setLeaving(true);
    window.setTimeout(() => {
      setStep((n) => n + 1);
      setSelected(null);
      setLeaving(false);
    }, 280);
  }

  if (done) {
    return (
      <div className="demo-complete" role="status">
        <strong>Ответ получен</strong>
        <p>Спасибо! Ваши ответы учтены в командном зачёте.</p>
        <button
          type="button"
          onClick={() => {
            setStep(0);
            setSelected(null);
            setDone(false);
          }}
        >
          Пройти ещё раз
        </button>
      </div>
    );
  }

  return (
    <div className={`quiz-play${leaving ? ' is-leaving' : ''}`}>
      <div className="quiz-demo__progress">
        <span>DEMO КВИЗ</span>
        <span className="quiz-demo__counter">
          {step + 1}/{quizQuestions.length}
        </span>
      </div>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${Math.max(progress, 8)}%` }} />
      </div>
      <h4 key={question.prompt}>{question.prompt}</h4>
      <div className="quiz-demo__answers">
        {question.choices.map((choice, index) => (
          <button
            type="button"
            key={choice}
            className={selected === index ? 'is-selected' : ''}
            onClick={() => pick(index)}
          >
            {choice}
          </button>
        ))}
      </div>
      <button
        className="quiz-demo__next"
        type="button"
        disabled={selected === null}
        onClick={goNext}
      >
        Дальше
      </button>
    </div>
  );
}

function WheelDemo() {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState<string | null>(null);
  const sectorAngle = 360 / wheelPrizes.length;

  function spin() {
    if (spinning) return;
    setSpinning(true);
    setPrize(null);
    const sector = Math.floor(Math.random() * wheelPrizes.length);
    const extraTurns = 4 + Math.floor(Math.random() * 3);
    // Align chosen sector center to the top (12 o'clock)
    const target =
      extraTurns * 360 +
      (360 - (sector * sectorAngle + sectorAngle / 2));
    setRotation((current) => {
      const normalized = ((current % 360) + 360) % 360;
      return current + target - normalized;
    });
    window.setTimeout(() => {
      const item = wheelPrizes[sector];
      setPrize(`Выпало: ${item.label} · ${item.points} баллов`);
      setSpinning(false);
    }, 3200);
  }

  return (
    <div className="wheel-demo">
      <div className="wheel-demo__meta">
        <span className="wheel-demo__badge">DEMO КОЛЕСО</span>
        <span className="wheel-demo__hint">Крути и лови приз</span>
      </div>
      <div className="wheel-demo__stage">
        <div className="wheel-demo__frame">
          <span className="wheel-demo__pointer" aria-hidden="true" />
          <div
            className={`wheel-demo__disc${spinning ? ' is-spinning' : ''}`}
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {wheelPrizes.map((item, index) => {
              const angle = index * sectorAngle + sectorAngle / 2;
              return (
                <span
                  key={`${item.label}-${index}`}
                  style={{
                    transform: `rotate(${angle}deg) translateY(-62px)`,
                  }}
                >
                  {item.label}
                </span>
              );
            })}
          </div>
          <span className="wheel-demo__hub" aria-hidden="true" />
        </div>
      </div>
      {prize ? (
        <p className="wheel-demo__result" role="status">
          {prize}
        </p>
      ) : null}
      <button type="button" onClick={spin} disabled={spinning}>
        {spinning ? 'Крутится…' : 'Крутить колесо'}
      </button>
    </div>
  );
}

function MemoryDemo() {
  const [seed, setSeed] = useState(0);
  const deck = useMemo(() => shuffle(memorySymbols), [seed]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [moves, setMoves] = useState(0);

  function reset() {
    setSeed((n) => n + 1);
    setFlipped([]);
    setMatched([]);
    setBusy(false);
    setMoves(0);
  }

  function flip(index: number) {
    if (busy || flipped.includes(index) || matched.includes(index)) return;
    const next = [...flipped, index];
    setFlipped(next);
    if (next.length < 2) return;
    setBusy(true);
    setMoves((n) => n + 1);
    const [a, b] = next;
    if (deck[a] === deck[b]) {
      setMatched((current) => [...current, a, b]);
      setFlipped([]);
      setBusy(false);
      return;
    }
    window.setTimeout(() => {
      setFlipped([]);
      setBusy(false);
    }, 700);
  }

  const complete = matched.length === deck.length;
  const pairsFound = matched.length / 2;
  const pairsTotal = deck.length / 2;

  return (
    <div className="memory-demo">
      <div className="memory-demo__meta">
        <span className="memory-demo__badge">DEMO MEMORY</span>
        <span className="memory-demo__counter">
          Ходы {moves} · Пары {pairsFound}/{pairsTotal}
        </span>
      </div>
      <div className="memory-demo__stage">
        <div className="memory-demo__grid">
          {deck.map((symbol, index) => {
            const open = flipped.includes(index) || matched.includes(index);
            return (
              <button
                type="button"
                key={`${seed}-${symbol}-${index}`}
                className={`memory-card${open ? ' is-open' : ''}${matched.includes(index) ? ' is-matched' : ''}`}
                onClick={() => flip(index)}
                aria-label={
                  open ? `Карточка ${symbol}` : `Закрытая карточка ${index + 1}`
                }
              >
                <span className="memory-card__inner">
                  <span className="memory-card__face memory-card__face--back">?</span>
                  <span className="memory-card__face memory-card__face--front">
                    {symbol}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {complete && (
        <p className="memory-demo__done" role="status">
          Все пары найдены. Отличная память — за {moves} ходов.
        </p>
      )}
      <button className="memory-demo__restart" type="button" onClick={reset}>
        Начать заново
      </button>
    </div>
  );
}

function ClickerDemo() {
  const [score, setScore] = useState(0);
  const [burst, setBurst] = useState(false);

  return (
    <div className="clicker-demo">
      <div className="clicker-demo__meta">
        <span className="clicker-demo__badge">DEMO КЛИКЕР</span>
        <span className="clicker-demo__score">Очки: {score}</span>
      </div>
      <div className="clicker-demo__stage">
        <button
          className={`clicker-target${burst ? ' is-burst' : ''}`}
          type="button"
          onClick={() => {
            setScore((n) => n + 1);
            setBurst(true);
            window.setTimeout(() => setBurst(false), 180);
          }}
        >
          Нажми на меня <span>+1</span>
        </button>
      </div>
      <button
        className="clicker-demo__reset"
        type="button"
        onClick={() => {
          setScore(0);
          setBurst(false);
        }}
      >
        Сбросить кликер
      </button>
    </div>
  );
}

function InfoPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="mechanic-info">
      <div className="mechanic-info__meta">
        <span className="mechanic-info__badge">О МЕХАНИКЕ</span>
      </div>
      <div className="mechanic-info__body">
        <h4>{title}</h4>
        <p>{description}</p>
        <ul>
          <li>Брендируем под ваш стиль и задачу</li>
          <li>Связываем с баллами, рейтингом и наградами</li>
          <li>Встраиваем в общий сценарий события</li>
        </ul>
      </div>
      <ArrowButton href="#configurator">Обсудить эту механику</ArrowButton>
    </div>
  );
}

export default function Mechanics() {
  const [active, setActive] = useState(0);
  const current = mechanics[active];
  const hasDemo = active < DEMO_COUNT;
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    screenRef.current?.scrollTo({ top: 0 });
  }, [active]);

  return (
    <section
      className="mechanics section-shell"
      id="mechanics"
      aria-labelledby="mechanics-heading"
    >
      <div className="mechanics__heading">
        <div>
          <h2 className="section-title" id="mechanics-heading">
            Попробуйте <span>готовые механики</span>
          </h2>
          <p className="section-lead">
            Берём проверенную игровую основу, брендируем и связываем её с
            баллами, рейтингом и вашей задачей
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
          role="group"
          aria-label="Выберите игровую механику"
        >
          {mechanics.map((item, index) => (
            <button
              className={`mechanic-card${index === active ? ' is-active' : ''}`}
              key={item.title}
              type="button"
              aria-pressed={index === active}
              onClick={() => setActive(index)}
            >
              <span className="mechanic-card__top">
                <IconTile>
                  <img src={iconForMechanic(item.icon)} alt="" />
                </IconTile>
                {index < DEMO_COUNT && <span className="demo-badge">DEMO</span>}
              </span>
              <strong>{item.title}</strong>
              <span className="mechanic-card__description">
                {item.description}
              </span>
            </button>
          ))}
          <div className="mechanics-more">
            <span className="eyebrow-pill">И это не всё</span>
            <h3>
              Покажем другие механики
              <br />
              под вашу задачу
            </h3>
            <ArrowButton href="#configurator">Узнать больше</ArrowButton>
          </div>
        </div>
        <aside
          className="quiz-demo"
          aria-label={`Панель: Как работает ${current.title}`}
        >
          <div className="quiz-demo__head">
            <div>
              <h3>
                Как работает{' '}
                {/^[A-Za-z]/.test(current.title)
                  ? current.title
                  : current.title.toLocaleLowerCase('ru-RU')}
              </h3>
              <p>{current.description}</p>
            </div>
            <img
              className="quiz-demo__joystick"
              src={figmaAssets.heroCarouselIcons.gamepad}
              alt=""
              aria-hidden="true"
            />
          </div>
          <div className="quiz-demo__screen" ref={screenRef} key={current.icon}>
            {!hasDemo && (
              <InfoPanel title={current.title} description={current.description} />
            )}
            {hasDemo && current.icon === 'quiz' && <QuizDemo />}
            {hasDemo && current.icon === 'wheel' && <WheelDemo />}
            {hasDemo && current.icon === 'memory' && <MemoryDemo />}
            {hasDemo && current.icon === 'clicker' && <ClickerDemo />}
          </div>
        </aside>
      </div>
    </section>
  );
}
