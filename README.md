# Virale AI

Интерактивный клиентский MVP SaaS-платформы для автоматизации продаж и коммуникаций в Instagram, Telegram, TikTok и WhatsApp.

## Что уже работает

- русскоязычный адаптивный лендинг с тарифами, FAQ и демо-входом;
- единый Inbox с AI/оператор режимами и отправкой сообщений;
- визуальный конструктор автоворонок с интерактивным симулятором;
- CRM-канбан, контакты, рассылки, AI-агенты и база знаний;
- библиотека шаблонов, мини-курс и настройки биллинга;
- реальная email-регистрация, защищённые сессии и создание отдельного workspace в PostgreSQL;
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

Укажите локальный `DATABASE_URL` и отдельный `AUTH_SECRET` в обоих env-файлах перед запуском.

Откройте `http://localhost:3000`.

## Проверка

```bash
pnpm typecheck
pnpm build
```

## Важная граница MVP

Без `DATABASE_URL` и `AUTH_SECRET` публичная версия остаётся безопасным demo-workspace. При настроенных переменных регистрация и workspace сохраняются в PostgreSQL, но сообщения и подключения социальных сетей пока остаются демонстрационными. Перед боевым запуском ещё нужны Redis, ключи каналов, платёжный провайдер и остальные production secrets.

Полный порядок работ и сравнение с ChatPlace: [`docs/CHATPLACE_PARITY.md`](docs/CHATPLACE_PARITY.md).
