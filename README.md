# Virale AI

Интерактивный клиентский MVP SaaS-платформы для автоматизации продаж и коммуникаций в Instagram, Telegram, TikTok и WhatsApp.

## Что уже работает

- русскоязычный адаптивный лендинг с тарифами, FAQ и демо-входом;
- единый Inbox с AI/оператор режимами, сохранённой историей и отправкой сообщений;
- Telegram-вложения из Inbox: фото, MP4 и документы до 4 МБ с сохранением метаданных и статуса доставки;
- визуальный конструктор автоворонок с редактируемыми триггерами, сообщениями, условиями, паузами, тегами, переменными, AI/CRM/webhook-действиями и интерактивным симулятором;
- CRM-канбан, контакты, рассылки, AI-агенты и база знаний;
- библиотека шаблонов, мини-курс и настройки биллинга;
- реальная email-регистрация, защищённые сессии и создание отдельного workspace в PostgreSQL;
- persistent контакты и CRM-сделки с изоляцией данных по workspace;
- пользовательские поля и теги контактов, сохранённые сегменты, CSV import/export, поиск/объединение дублей и выбор сегмента в рассылках;
- команда с безопасными одноразовыми приглашениями, ролями, переключением workspace и назначением менеджеров в Inbox;
- реальное подключение Telegram Bot API: зашифрованный токен, подписанный webhook, входящие сообщения и ответы из Inbox;
- сохранение, версионирование и публикация графов автоматизаций с журналом запусков и шагов;
- запуск Telegram-сценариев по кодовому слову: автоответ, теги, переменные, условия и создание CRM-сделки;
- редактируемый блок внешнего webhook/CRM: зашифрованная Bearer/HMAC-авторизация, защита от SSRF и DNS-rebinding, ограниченные ответы, idempotency key и retry временных ошибок;
- PostgreSQL outbox и защищённый Vercel Cron: быстрый webhook, возобновление задержек, блокировка двойной обработки и retry с идемпотентными сообщениями/сделками;
- реальные AI-агенты на Responses API: настройки, память диалога, база знаний через file search, тестовый чат, привязка к Telegram и передача оператору;
- 14-дневный Pro-trial, тарифы в KZT, реальные usage-счётчики, серверные квоты и заявки на подключение платного плана;
- реальные analytics и monitoring, audit log, health-check, rate limits, security headers и защищённая форма privacy-запросов;
- Telegram-рассылки по тегам: доказуемое согласие, оценка аудитории, планирование, отмена, durable delivery queue, retry и автоматический opt-out по команде клиента;
- политика конфиденциальности/условия, подтверждаемое согласие, owner JSON-export, backup script и production runbook;
- monorepo для web, API gateway, webhook gateway, workers и общих пакетов;
- автоматическая production-сборка на Vercel из ветки `main`.

## Локальный запуск

```bash
pnpm install --frozen-lockfile
createdb virale_ai_development
cp .env.example apps/web/.env.local
cp .env.example packages/database/.env
pnpm --filter @chatplace/database exec prisma migrate deploy --schema prisma/schema.prisma
pnpm --filter web dev
```

Укажите локальный `DATABASE_URL`, `AUTH_SECRET`, `CHANNEL_ENCRYPTION_KEY`, `OPENAI_API_KEY` и `CRON_SECRET` перед запуском. Telegram webhook подключается только на публичном HTTPS-домене. Модель можно переопределить через `OPENAI_MODEL`.

Откройте `http://localhost:3000`.

## Проверка

```bash
pnpm test
pnpm typecheck
pnpm build
```

## Важная граница MVP

Без `DATABASE_URL`, `AUTH_SECRET`, `CHANNEL_ENCRYPTION_KEY`, `OPENAI_API_KEY` и `CRON_SECRET` публичная версия остаётся безопасным demo-workspace. После настройки доступны реальные аккаунты, контакты, CRM, Telegram, надёжные автоматизации, AI-агенты с базой знаний, Telegram-рассылки и generic HTTPS webhook/CRM actions. До полного запуска ещё нужны Instagram/WhatsApp/TikTok credentials, provider-specific CRM OAuth, платёжный провайдер и production-наблюдаемость. При росте нагрузки PostgreSQL outbox можно вынести в Redis/BullMQ без изменения продуктового API.

Полный порядок работ и сравнение с ChatPlace: [`docs/CHATPLACE_PARITY.md`](docs/CHATPLACE_PARITY.md).
Порядок production-развёртывания, резервного копирования и восстановления: [`docs/PRODUCTION_RUNBOOK.md`](docs/PRODUCTION_RUNBOOK.md).
