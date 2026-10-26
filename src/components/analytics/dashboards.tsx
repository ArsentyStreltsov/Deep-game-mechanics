/**
 * Пять панелей аналитики — по одной на задачу. Состав виджетов у каждой свой: это не одна и та же
 * панель с другими цифрами, а то, что действительно смотрит организатор такого проекта.
 * Данные — демо (src/data/analytics.ts); «живые» виджеты подписаны на общий тик из charts.tsx.
 */
import { useMemo } from 'react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import {
  buildEvents,
  buildExternal,
  buildHr,
  buildLoyalty,
  buildTrade,
  periods,
  type FunnelStep,
  type KpiData,
  type PeriodId,
  type ScenarioId,
} from '@/data/analytics';
import { WEEKDAYS, fmt, split } from '@/lib/demo-data';
import {
  AreaChart,
  BarList,
  Card,
  Columns,
  Funnel,
  IconCheck,
  IconClock,
  IconCross,
  IconWarn,
  Kpi,
  Leaderboard,
  LiveStream,
  Meter,
  ReceiptFeed,
  StackBar,
  Votes,
  liveBonus,
  useTick,
  type BarRow,
  type Segment,
} from './charts';

type DashProps = { n: PeriodId; vs: string };

/** «Вс, сегодня» / «Сб, вчера» / «Пт, 3 дн. назад» — подпись дня в подсказке. Последний день ряда — воскресенье. */
function dayTitle(n: number, index: number) {
  const daysAgo = n - 1 - index;
  const weekday = WEEKDAYS[(((6 - daysAgo) % 7) + 7) % 7];
  if (daysAgo === 0) return `${weekday}, сегодня`;
  if (daysAgo === 1) return `${weekday}, вчера`;
  return `${weekday}, ${daysAgo} дн. назад`;
}

/** Длина столбика относительно самого длинного, 0…100. */
function relative(values: readonly number[]) {
  const top = Math.max(...values);
  return values.map((value) => (top > 0 ? (value / top) * 100 : 0));
}

function worstDrop(steps: FunnelStep[]) {
  let worst = { label: steps[1]?.label ?? '', drop: 0 };
  for (let i = 1; i < steps.length; i += 1) {
    const drop = steps[i - 1].share - steps[i].share;
    if (drop > worst.drop) worst = { label: steps[i].label, drop };
  }
  return worst;
}

/** Сколько «живых» единиц накопилось к текущему тику у плитки с `live`. */
function useBonus(kpi: KpiData) {
  const tick = useTick();
  return kpi.live ? liveBonus(kpi.id, kpi.live, tick) : 0;
}

/* ───────────── HR и внутриком ───────────── */

function HrDashboard({ n, vs }: DashProps) {
  const data = useMemo(() => buildHr(n), [n]);
  const { steps } = data.onboarding;
  const worst = worstDrop(steps);
  return (
    <>
      {data.kpis.map((kpi) => (
        <Kpi key={kpi.id} data={kpi} vs={vs} />
      ))}
      <Card
        w={7}
        cap="onboarding"
        title="Путь новичка в программе"
        sub="Сколько человек дошло до каждого шага"
      >
        <Funnel
          steps={steps}
          name="Воронка онбординга"
          tone="warn"
          note={
            <>
              Больше всего людей уходит на шаге «{worst.label}»: −
              {fmt(worst.drop, worst.drop % 1 ? 1 : 0)} п.п. к предыдущему.
            </>
          }
        />
      </Card>
      <Card
        w={5}
        cap="teams"
        live
        title="Рейтинг офисов"
        sub="Баллы за период — места меняются по ходу игры"
      >
        <Leaderboard rows={data.offices} name="Рейтинг офисов по баллам" />
      </Card>
      <Card
        w={5}
        cap="learning"
        title="Прохождение обучения"
        sub="Доля новичков, прошедших модуль"
      >
        <Columns
          items={data.modules}
          name="Доля новичков, прошедших модуль"
          unit="Человек"
          caption="Модули обучения — по порядку прохождения"
        />
      </Card>
      <Card
        w={7}
        cap="engagement"
        title="Активность по дням"
        sub="Сколько человек заходили в платформу"
      >
        <AreaChart
          chart={data.activity}
          name="Заходы в платформу по дням"
          unit="заходов"
          titleFor={(i) => dayTitle(n, i)}
        />
      </Card>
    </>
  );
}

/* ───────────── Мероприятия ───────────── */

function QrBars({
  points,
  kpi,
}: {
  points: { label: string; value: number }[];
  kpi: KpiData;
}) {
  const bonus = useBonus(kpi);
  const extra = split(
    bonus,
    points.map((point) => point.value),
  );
  const values = points.map((point, i) => point.value + extra[i]);
  const share = relative(values);
  const rows: BarRow[] = points.map((point, i) => ({
    key: point.label,
    label: point.label,
    value: values[i],
    share: share[i],
  }));
  return <BarList rows={rows} name="Сканирования QR по точкам площадки" />;
}

function EventsDashboard({ n, vs }: DashProps) {
  const data = useMemo(() => buildEvents(n), [n]);
  const [reg, qr, quiz] = data.kpis;
  const channels: BarRow[] = data.channels.map((channel, i) => ({
    key: channel.label,
    label: channel.label,
    value: channel.share,
    share: relative(data.channels.map((item) => item.share))[i],
    cap: channel.cap,
  }));
  return (
    <>
      <Card
        w={7}
        cap="live"
        live
        title="Прямой эфир"
        sub="Онлайн-трансляция из зала"
      >
        <LiveStream
          online={data.live.online}
          peak={data.live.peak}
          viewers={data.live.viewers}
          reactions={data.live.reactions}
          accentLabel="Сейчас в эфире"
        />
      </Card>
      <Card w={5} cap="votes" live title="Голосование в зале и онлайн">
        <Votes
          question={data.vote.question}
          options={data.vote.options}
          weights={[45, 40, 15]}
          name="Результаты голосования"
        />
      </Card>
      <Kpi data={reg} vs={vs} w={4} />
      <Kpi data={qr} vs={vs} w={4} />
      <Kpi data={quiz} vs={vs} w={4} />
      <Card
        w={7}
        cap="qr"
        title="Сканирования QR по точкам площадки"
        sub="Где участники чаще всего берут задания"
      >
        <QrBars points={data.qr} kpi={qr} />
      </Card>
      <Card
        w={5}
        cap="telegram live qr"
        title="Откуда приходят участники"
        sub="Доля участников по каналам"
      >
        <BarList rows={channels} name="Каналы входа" valueSuffix="%" />
      </Card>
    </>
  );
}

/* ───────────── Лояльность и клубы ───────────── */

function RewardBars({
  rewards,
  kpi,
}: {
  rewards: { label: string; issued: number; stock: number; weight: number }[];
  kpi: KpiData;
}) {
  const bonus = useBonus(kpi);
  const extra = split(
    bonus,
    rewards.map((reward) => reward.weight),
  );
  const issued = rewards.map((reward, i) => reward.issued + extra[i]);
  const share = relative(issued);
  const rows: BarRow[] = rewards.map((reward, i) => {
    const left = Math.max(0, reward.stock - extra[i]);
    const low = left < 20;
    return {
      key: reward.label,
      label: reward.label,
      value: issued[i],
      share: share[i],
      note: low ? (
        <span className="dash-warn">
          <IconWarn size={12} />
          осталось {fmt(left)}
        </span>
      ) : (
        <>осталось {fmt(left)}</>
      ),
    };
  });
  return <BarList rows={rows} name="Награды: выдано и остаток" />;
}

function LoyaltyDashboard({ n, vs }: DashProps) {
  const data = useMemo(() => buildLoyalty(n), [n]);
  const issuedKpi = data.kpis[3];
  const levelSegments: Segment[] = data.levels.map((level, i) => ({
    id: level.label,
    label: level.label,
    share: level.share,
    count: level.count,
    color: `color-mix(in srgb, var(--accent), #fff ${i * 18}%)`,
  }));
  const retention = useMemo(
    () => ({
      values: data.retention,
      ticks: [
        { index: 0, label: 'старт' },
        { index: 2, label: '2 нед.' },
        { index: 4, label: '4 нед.' },
        { index: 6, label: '6 нед.' },
        { index: 8, label: '8 нед.' },
      ],
      marks: [],
    }),
    [data.retention],
  );
  return (
    <>
      {data.kpis.map((kpi) => (
        <Kpi key={kpi.id} data={kpi} vs={vs} />
      ))}
      <Card
        w={7}
        cap="clubs levels"
        title="Участники и статусы"
        sub="Закрытый клуб: кто на каком уровне"
      >
        <div className="dash-hero">
          <strong>
            <AnimatedNumber value={data.members} />
          </strong>
          <span>участников в клубе</span>
        </div>
        <StackBar
          segments={levelSegments}
          name="Участники по статусам"
          unit="Человек"
        />
        <p className="dash-note">
          За период статус повысили <b>{fmt(data.levelUps)}</b> человек.
        </p>
      </Card>
      <Card
        w={5}
        cap="programs"
        title="Возвраты в платформу"
        sub="Сколько участников активны через N недель"
      >
        <AreaChart
          chart={retention}
          name="Доля активных участников по неделям после вступления"
          unit="участников активны"
          max={100}
          suffix="%"
          pulse={false}
          titleFor={(i) =>
            i === 0 ? 'Неделя вступления' : `${i}-я неделя после вступления`
          }
        />
      </Card>
      <Card
        w={12}
        cap="shop"
        live
        title="Витрина наград"
        sub="Что выбирают и сколько осталось"
      >
        <RewardBars rewards={data.rewards} kpi={issuedKpi} />
      </Card>
    </>
  );
}

/* ───────────── Спецпроекты ───────────── */

function ExternalDashboard({ n, vs }: DashProps) {
  const data = useMemo(() => buildExternal(n), [n]);
  const reg = data.route[1];
  const finish = data.route[3];
  const gameRows: BarRow[] = data.games.map((game, i) => ({
    key: game.label,
    label: game.label,
    value: game.share,
    share: relative(data.games.map((item) => item.share))[i],
    note: `${fmt(game.sessions)} сессий`,
  }));
  const teamRows: BarRow[] = data.challenge.teams.map((team, i) => ({
    key: team.label,
    label: team.label,
    value: team.points,
    share: relative(data.challenge.teams.map((item) => item.points))[i],
  }));
  const contestRows: BarRow[] = data.contest.map((entry, i) => ({
    key: entry.name,
    label: (
      <>
        <span className="dash-rank">{i + 1}</span>
        {entry.name}
      </>
    ),
    value: entry.score,
    share: relative(data.contest.map((item) => item.score))[i],
  }));
  return (
    <>
      {data.kpis.map((kpi) => (
        <Kpi key={kpi.id} data={kpi} vs={vs} />
      ))}
      <Card
        w={7}
        cap="promo"
        title="Маршрут участника"
        sub="От страницы кампании до приза"
      >
        <Funnel
          steps={data.route}
          name="Маршрут участника в кампании"
          note={
            <>
              До финала доходят{' '}
              {fmt(Math.round((finish.share / reg.share) * 100))}%
              зарегистрировавшихся.
            </>
          }
        />
      </Card>
      <Card
        w={5}
        cap="promo"
        title="Какие игры работают"
        sub="Доля игровых сессий"
      >
        <BarList
          rows={gameRows}
          name="Игровые сессии по механикам"
          valueSuffix="%"
        />
      </Card>
      <Card
        w={7}
        cap="brand"
        title="Охват по дням"
        sub="Сколько новых участников приходит в кампанию"
      >
        <AreaChart
          chart={data.reach}
          name="Участники кампании по дням"
          unit="участников"
          titleFor={(i) => dayTitle(n, i)}
        />
      </Card>
      <Card
        w={5}
        cap="challenges"
        title="Командный челлендж"
        sub="Общая цель кампании"
      >
        <Meter
          big
          label="Баллов собрано всеми командами"
          value={data.challenge.reached}
          total={data.challenge.goal}
        />
        <BarList rows={teamRows} name="Баллы по командам" />
      </Card>
      <Card
        w={12}
        cap="contests"
        title="Конкурс: лидеры"
        sub="Топ-5 участников по баллам"
      >
        <BarList
          rows={contestRows}
          name="Топ участников конкурса"
          emphasis={false}
        />
      </Card>
    </>
  );
}

/* ───────────── Трейд-маркетинг ───────────── */

function TradeStatus({
  statuses,
  reasons,
  kpi,
}: {
  statuses: {
    id: 'ok' | 'wait' | 'bad';
    label: string;
    share: number;
    count: number;
  }[];
  reasons: { label: string; share: number }[];
  kpi: KpiData;
}) {
  const bonus = useBonus(kpi);
  const extra = split(
    bonus,
    statuses.map((status) => status.count),
  );
  const icon = {
    ok: <IconCheck />,
    wait: <IconClock />,
    bad: <IconCross />,
  } as const;
  const color = {
    ok: 'var(--good)',
    wait: 'var(--pending)',
    bad: 'var(--bad)',
  } as const;
  const segments: Segment[] = statuses.map((status, i) => ({
    id: status.id,
    label: status.label,
    share: status.share,
    count: status.count + extra[i],
    color: color[status.id],
    icon: (
      <span className="dash-stack__icon" data-status={status.id}>
        {icon[status.id]}
      </span>
    ),
  }));
  const rejected = segments.find((segment) => segment.id === 'bad')?.count ?? 0;
  const counts = split(
    rejected,
    reasons.map((reason) => reason.share),
  );
  const share = relative(counts);
  const rows: BarRow[] = reasons.map((reason, i) => ({
    key: reason.label,
    label: reason.label,
    value: counts[i],
    share: share[i],
    note: `${reason.share}% отклонённых`,
  }));
  return (
    <>
      <StackBar segments={segments} name="Статусы чеков" unit="Чеков" />
      <div className="dash-reasons">
        <h4>Почему отклоняем</h4>
        <BarList rows={rows} name="Причины отклонения чеков" />
      </div>
    </>
  );
}

function SkuBars({
  sku,
  statuses,
  kpi,
}: {
  sku: { label: string; share: number; value: number }[];
  statuses: { share: number; count: number }[];
  kpi: KpiData;
}) {
  const bonus = useBonus(kpi);
  const accepted = split(
    bonus,
    statuses.map((status) => status.count),
  )[0];
  const extra = split(
    accepted,
    sku.map((item) => item.value),
  );
  const values = sku.map((item, i) => item.value + extra[i]);
  const share = relative(values);
  const rows: BarRow[] = sku.map((item, i) => ({
    key: item.label,
    label: item.label,
    value: values[i],
    share: share[i],
    note: `${item.share}% принятых`,
  }));
  return <BarList rows={rows} name="Позиции акции в принятых чеках" />;
}

function TradeDashboard({ n, vs }: DashProps) {
  const data = useMemo(() => buildTrade(n), [n]);
  const receiptsKpi = data.kpis[0];
  const { fund } = data;
  return (
    <>
      {data.kpis.map((kpi) => (
        <Kpi key={kpi.id} data={kpi} vs={vs} />
      ))}
      <Card
        w={5}
        cap="receipts"
        live
        title="Проверка чеков"
        sub="Чеки приходят и проверяются прямо сейчас"
      >
        <ReceiptFeed name="Последние чеки" />
      </Card>
      <Card
        w={7}
        cap="receipts"
        title="Статусы чеков"
        sub="Что стало с загруженными чеками за период"
      >
        <TradeStatus
          statuses={data.statuses}
          reasons={data.reasons}
          kpi={receiptsKpi}
        />
      </Card>
      <Card w={5} cap="fund" title="Призовой фонд" sub="За всю акцию">
        <Meter
          big
          label="Призов выдано"
          value={fund.issued}
          total={fund.total}
        />
        <div className="dash-tiers">
          {fund.tiers.map((tier) => (
            <Meter
              key={tier.label}
              label={tier.label}
              value={tier.issued}
              total={tier.total}
            />
          ))}
        </div>
      </Card>
      <Card
        w={7}
        cap="control"
        title="Позиции акции в чеках"
        sub="Какие SKU покупают чаще всего"
      >
        <SkuBars sku={data.sku} statuses={data.statuses} kpi={receiptsKpi} />
      </Card>
      <Card
        w={12}
        cap="control points"
        title="Чеки по дням"
        sub="Сколько чеков загружали в день"
      >
        <AreaChart
          chart={data.daily}
          name="Загрузка чеков по дням"
          unit="чеков"
          titleFor={(i) => dayTitle(n, i)}
        />
      </Card>
    </>
  );
}

/* ───────────── Выбор панели ───────────── */

export function Dashboard({
  scenario,
  period,
}: {
  scenario: ScenarioId;
  period: PeriodId;
}) {
  const vs = periods.find((item) => item.id === period)?.vs ?? '';
  switch (scenario) {
    case 'hr':
      return <HrDashboard n={period} vs={vs} />;
    case 'events':
      return <EventsDashboard n={period} vs={vs} />;
    case 'loyalty':
      return <LoyaltyDashboard n={period} vs={vs} />;
    case 'external':
      return <ExternalDashboard n={period} vs={vs} />;
    case 'trade':
      return <TradeDashboard n={period} vs={vs} />;
  }
}
