/**
 * Заявка с лендинга: проверка полей, отправка и событие «открыть форму».
 *
 * Форма шлёт JSON на адрес из переменной PUBLIC_FORM_ENDPOINT (webhook CRM, Formspree, прокси
 * к Telegram-боту и т. п.). Пока адрес не задан, форма работает в демо-режиме: проверяет поля,
 * показывает экран «спасибо» с пометкой «тестовая версия» и никуда ничего не отправляет.
 */

import { siteInfo } from '@/data/site';

/** Страница с политикой обработки персональных данных (оператор — ООО «Адекватное Агентство»). */
export const POLICY_URL = siteInfo.policyUrl;

/** Адрес приёма заявок задаётся при сборке: `PUBLIC_FORM_ENDPOINT=https://… npm run build`. */
const ENDPOINT = (import.meta.env.PUBLIC_FORM_ENDPOINT ?? '').trim();

/** true — заявки реально уходят на адрес из PUBLIC_FORM_ENDPOINT; false — демо-режим. */
export const formIsLive = ENDPOINT.length > 0;

/** Сколько ждём ответ сервера, прежде чем показать ошибку. */
const REQUEST_TIMEOUT_MS = 12_000;

export type ContactKind = 'email' | 'phone';

export type ContactCheck =
  { ok: true; kind: ContactKind; value: string } | { ok: false; error: string };

export type NameCheck =
  { ok: true; value: string } | { ok: false; error: string };

const EMAIL_PATTERN =
  /^[^\s@<>()[\]\\,;:"]+@(?:[a-zA-Zа-яА-ЯёЁ0-9](?:[a-zA-Zа-яА-ЯёЁ0-9-]{0,61}[a-zA-Zа-яА-ЯёЁ0-9])?\.)+[a-zA-Zа-яА-ЯёЁ]{2,}$/u;

export const CONTACT_FORMAT_HINT =
  'Проверьте формат: name@company.ru или +7 900 000-00-00';

/** Имя: минимум две буквы (одной буквы и набора цифр мало, чтобы к человеку можно было обратиться). */
export function checkName(raw: string): NameCheck {
  const value = raw.trim().replace(/\s+/g, ' ');
  if (!value) return { ok: false, error: 'Укажите, как к вам обращаться' };
  const letters = value.match(/\p{L}/gu)?.length ?? 0;
  if (letters < 2)
    return { ok: false, error: 'Введите имя — минимум две буквы' };
  if (value.length > 80) return { ok: false, error: 'Слишком длинное имя' };
  return { ok: true, value };
}

/**
 * Телефон приводим к виду +7XXXXXXXXXX. Принимаем +7…, 8…, 7… и 10 цифр мобильного без кода страны;
 * номера других стран — только с плюсом (10–15 цифр).
 */
export function parsePhone(raw: string): string | null {
  const text = raw.trim();
  if (!/^\+?[\d\s().-]+$/.test(text)) return null;
  const digits = text.replace(/\D/g, '');
  if (text.startsWith('+')) {
    if (digits.startsWith('7'))
      return digits.length === 11 ? `+${digits}` : null;
    return digits.length >= 10 && digits.length <= 15 ? `+${digits}` : null;
  }
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits[0] === '9') return `+7${digits}`;
  return null;
}

/** Почта или телефон: решаем по наличию «@», чтобы сообщение об ошибке подходило к тому, что вводили. */
export function checkContact(raw: string): ContactCheck {
  const text = raw.trim();
  if (!text) return { ok: false, error: 'Укажите почту или телефон' };
  if (text.includes('@')) {
    if (text.length <= 254 && EMAIL_PATTERN.test(text)) {
      return { ok: true, kind: 'email', value: text };
    }
    return { ok: false, error: CONTACT_FORMAT_HINT };
  }
  const phone = parsePhone(text);
  if (phone) return { ok: true, kind: 'phone', value: phone };
  return { ok: false, error: CONTACT_FORMAT_HINT };
}

/** Что пользователь собрал в конструкторе — уходит в заявку вместе с сообщением. */
export type ContactContext = {
  /** Короткая подпись для плашки в форме: «Вовлечение команды · до 500 сотрудников». */
  label: string;
  /** Подпись над текстом плашки. По умолчанию «Из конструктора». */
  kicker?: string;
  /** Откуда пришёл контекст — для аналитики заявок. */
  source: string;
  /** Подробности в виде «поле → значение», попадают в заявку как есть. */
  details?: Record<string, string>;
};

export type LeadPayload = {
  name: string;
  contact: string;
  contactKind: ContactKind;
  message: string;
  project: {
    label: string;
    source: string;
    details?: Record<string, string>;
  } | null;
  page: string;
  sentAt: string;
  consent: { accepted: true; policyUrl: string };
};

export class LeadError extends Error {
  constructor(
    message: string,
    readonly reason: 'offline' | 'timeout' | 'server' | 'network',
  ) {
    super(message);
    this.name = 'LeadError';
  }
}

/** Пауза демо-режима: чтобы состояние «Отправляем…» было видно и работало как настоящее. */
const DEMO_DELAY_MS = 900;

export async function submitLead(payload: LeadPayload): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new LeadError('Нет соединения с интернетом', 'offline');
  }
  if (!formIsLive) {
    await new Promise((resolve) => window.setTimeout(resolve, DEMO_DELAY_MS));
    return;
  }
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new LeadError(`Сервер ответил ${response.status}`, 'server');
    }
  } catch (error) {
    if (error instanceof LeadError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new LeadError('Сервер не ответил вовремя', 'timeout');
    }
    throw new LeadError('Не удалось связаться с сервером', 'network');
  } finally {
    window.clearTimeout(timer);
  }
}

/** Событие, по которому открывается окно заявки (его слушает ContactDialog). */
export const OPEN_CONTACT_EVENT = 'deep:open-contact';

export type OpenContactDetail = {
  /** Что показать в форме плашкой «Из конструктора»; null — открыть чистую форму. */
  context?: ContactContext | null;
};

export function openContact(detail: OpenContactDetail = {}) {
  window.dispatchEvent(
    new CustomEvent<OpenContactDetail>(OPEN_CONTACT_EVENT, { detail }),
  );
}
