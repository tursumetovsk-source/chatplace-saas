# Virale AI

Интерактивный клиентский MVP SaaS-платформы для автоматизации продаж и коммуникаций в Instagram, Telegram, TikTok и WhatsApp.

## Что уже работает

- русскоязычный адаптивный лендинг с тарифами, FAQ и демо-входом;
- единый Inbox с AI/оператор режимами, сохранённой историей и отправкой сообщений;
- визуальный конструктор автоворонок с интерактивным симулятором;
- CRM-канбан, контакты, рассылки, AI-агенты и база знаний;
- библиотека шаблонов, мини-курс и настройки биллинга;
- реальная email-регистрация, защищённые сессии и создание отдельного workspace в PostgreSQL;
- persistent контакты и CRM-сделки с изоляцией данных по workspace;
- реальное подключение Telegram Bot API: зашифрованный токен, подписанный webhook, входящие сообщения и ответы из Inbox;
- сохранение, версионирование и публикация графов автоматизаций с журналом запусков и шагов;
- запуск Telegram-сценариев по кодовому слову: автоответ, теги, переменные, условия и создание CRM-сделки;
- реальные AI-агенты на Responses API: настройки, память диалога, база знаний через file search, тестовый чат, привязка к Telegram и передача оператору;
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

Укажите локальный `DATABASE_URL`, `AUTH_SECRET`, `CHANNEL_ENCRYPTION_KEY` и `OPENAI_API_KEY` перед запуском. Telegram webhook подключается только на публичном HTTPS-домене. Модель можно переопределить через `OPENAI_MODEL`.

Откройте `http://localhost:3000`.

## Проверка

```bash
pnpm typecheck
pnpm build
```

## Важная граница MVP

Без `DATABASE_URL`, `AUTH_SECRET`, `CHANNEL_ENCRYPTION_KEY` и `OPENAI_API_KEY` публичная версия остаётся безопасным demo-workspace. После настройки доступны реальные аккаунты, контакты, CRM, Telegram и AI-агенты с базой знаний. До полного запуска ещё нужны Redis/очереди, Instagram/WhatsApp/TikTok credentials, платёжный провайдер и production-наблюдаемость.

Полный порядок работ и сравнение с ChatPlace: [`docs/CHATPLACE_PARITY.md`](docs/CHATPLACE_PARITY.md).
