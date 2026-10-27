/// <reference types="astro/client" />

interface ImportMetaEnv {
  /**
   * Куда отправлять заявки с формы «Обсудить проект»: webhook CRM, Formspree, прокси к Telegram-боту.
   * Принимает POST с JSON (см. LeadPayload в src/lib/contact.ts). Без значения форма работает
   * в демо-режиме и ничего не отправляет.
   */
  readonly PUBLIC_FORM_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
