type SiteInfo = {
  legalName: string;
  legalAddress: string;
  taxId: string;
  registrationNumber: string;
  policyUrl: string;
  contactsUrl: string;
  email: string;
  telegram: string;
  phone: string;
};

/**
 * Данные подвала и политики: юридическое лицо и контакты.
 *
 * Название организации, адрес и ссылка на политику взяты со страницы оператора персональных данных
 * https://deep-agency.ru/policy/. Почту, Telegram и телефон для связи по новым проектам заказчик ещё
 * не назвал, поэтому поля ниже пустые, а пустое поле в подвале не показывается — вместо выдуманных
 * контактов в подвале стоит ссылка на страницу контактов основного сайта. Личные почты и телефоны
 * сотрудников со страницы контактов на лендинг не переносим.
 * ИНН и ОГРН на странице политики не указаны — когда будут подтверждены, впишите сюда.
 */
export const siteInfo: SiteInfo = {
  /** Как называется организация в подвале и в тексте согласия. */
  legalName: 'ООО «Адекватное Агентство»',
  legalAddress:
    '129226, г. Москва, ул. Сельскохозяйственная, д. 17, корп. 1, помещ. 9П',
  /** ИНН (оставьте пустым, пока не подтверждён). */
  taxId: '',
  /** ОГРН (оставьте пустым, пока не подтверждён). */
  registrationNumber: '',
  /** Политика обработки персональных данных на основном сайте. */
  policyUrl: 'https://deep-agency.ru/policy/',
  /** Страница контактов основного сайта. */
  contactsUrl: 'https://deep-agency.ru/contacts/',
  /** Рабочая почта для новых проектов, например `hello@…` (пусто — не показывать). */
  email: '',
  /** Telegram для связи: `@имя` или полная ссылка `https://t.me/имя` (пусто — не показывать). */
  telegram: '',
  /** Телефон в любом читаемом виде, например `+7 900 000-00-00` (пусто — не показывать). */
  phone: '',
};

/** Что именно показываем в блоке «Связаться»: только заполненные поля. */
export function footerContacts() {
  const items: { label: string; value: string; href: string }[] = [];
  if (siteInfo.email) {
    items.push({
      label: 'Почта',
      value: siteInfo.email,
      href: `mailto:${siteInfo.email}`,
    });
  }
  if (siteInfo.telegram) {
    const handle = siteInfo.telegram
      .replace(/^https?:\/\/t\.me\//, '')
      .replace(/^@/, '');
    items.push({
      label: 'Telegram',
      value: `@${handle}`,
      href: `https://t.me/${handle}`,
    });
  }
  if (siteInfo.phone) {
    items.push({
      label: 'Телефон',
      value: siteInfo.phone,
      href: `tel:${siteInfo.phone.replace(/[^\d+]/g, '')}`,
    });
  }
  return items;
}

/** «ИНН 7700000000 · ОГРН 1100000000000» — только то, что заполнено. */
export function registrationLine() {
  return [
    siteInfo.taxId ? `ИНН ${siteInfo.taxId}` : '',
    siteInfo.registrationNumber ? `ОГРН ${siteInfo.registrationNumber}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}
