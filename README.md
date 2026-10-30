# InfraHunt — сайт дилера RikaNV

Каталог тепловизионной оптики RikaNV: прицелы Kaban, Moskit, Dovod PRO, монокуляр Sinica, насадка Ehidna, бинокли Snegir, дальномеры Strekoza и раздел дневной оптики «скоро».

Сайт собирается в статический HTML на [Astro](https://astro.build): каждая страница — готовый HTML, который сразу видят Яндекс и Google. Корзина и сравнение работают в браузере посетителя, заказ уходит в Telegram через Cloudflare Pages Function.

## Публикация на Cloudflare Pages (бесплатно)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → репозиторий `nvrika404-beep/infrahunt`.
2. Настройки сборки: Framework preset **Astro**, Build command `npm run build`, Build output directory `dist`. В **Environment variables** добавьте `NODE_VERSION` = `22`.
3. **Save and Deploy**. Сайт появится на адресе вида `infrahunt.pages.dev` и будет обновляться после каждого изменения в ветке `main`.

### Заказы в Telegram

1. В Telegram откройте [@BotFather](https://t.me/BotFather) → `/newbot` → получите токен.
2. Добавьте бота в чат или группу, куда должны приходить заказы, и напишите там любое сообщение.
3. Откройте `https://api.telegram.org/bot<ТОКЕН>/getUpdates` — в ответе найдите `"chat":{"id": ...}`.
4. Cloudflare → проект → **Settings → Variables and Secrets**:
   - `TELEGRAM_BOT_TOKEN` — токен, тип **Secret**;
   - `TELEGRAM_CHAT_ID` — id чата.
5. Пересоберите проект (**Deployments → Retry deployment**).

Пока бот не настроен, корзина предлагает отправить заказ в WhatsApp с готовым текстом — заявки не теряются.

### Домен infrahunt.ru

Cloudflare → проект → **Custom domains** → `infrahunt.ru` и `www.infrahunt.ru`. Cloudflare покажет, какую DNS-запись поменять у регистратора домена. Старые адреса InSales перенаправляются на новые страницы (файл `public/_redirects`), позиции в поиске сохранятся.

### Поисковики

- [Яндекс Вебмастер](https://webmaster.yandex.ru): добавьте сайт, код подтверждения положите в переменную `PUBLIC_YANDEX_VERIFICATION`. Карта сайта: `https://infrahunt.ru/sitemap-index.xml`.
- Товарный фид для Яндекса: `https://infrahunt.ru/yml.xml`.
- [Яндекс Метрика](https://metrika.yandex.ru): номер счётчика — в `PUBLIC_YANDEX_METRIKA_ID`, цель «order» срабатывает при отправке заказа.
- Google Search Console: код — в `PUBLIC_GOOGLE_VERIFICATION`.

После изменения переменных пересоберите проект.

## Как менять сайт

- **Цены и наличие**: `python3 scripts/update-prices.py` — берёт цены с rikasale.ru (или rikanv.ru, если товара там нет) и наличие с rikanv.ru. Потом отправьте изменения в GitHub.
- **Тексты товаров, разделы, линейки**: `src/data/content.ts`.
- **Контакты и реквизиты**: `src/data/site.ts`.
- **Вопросы и ответы на главной**: `src/data/faq.ts`.
- **Характеристики и фото**: `src/data/catalog.json`, фото — `public/img/products/`.

Локальный запуск: `npm install`, затем `npm run dev`.
