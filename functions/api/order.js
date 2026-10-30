// Cloudflare Pages Function: принимает заявки с сайта и пересылает их в Telegram.
// Переменные окружения (Cloudflare → Pages → Settings → Variables and Secrets):
//   TELEGRAM_BOT_TOKEN — токен бота от @BotFather (секрет, в код не добавлять);
//   TELEGRAM_CHAT_ID   — id чата или группы, куда приходят заявки.
import catalog from '../../src/data/catalog.json';

const products = new Map(catalog.map((p) => [p.slug, p]));
const SITE = 'https://infrahunt.ru';
const TYPES = {
  cart: '🛒 Заказ из корзины',
  quick: '⚡ Покупка в 1 клик',
  price: '💬 Запрос цены',
  callback: '📞 Заказ звонка',
};
const MIN_FILL_MS = 1200; // Боты отправляют форму за миллисекунды; человеку даже с автозаполнением нужно больше секунды.

const clean = (value, max) => String(value ?? '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, max);
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const money = (n) => `${n.toLocaleString('ru-RU')} ₽`;

// Номер для ссылки wa.me: только цифры, российские 8… и 10-значные приводим к 7….
function whatsappNumber(digits) {
  if (digits.length === 11 && digits.startsWith('8')) return `7${digits.slice(1)}`;
  if (digits.length === 10) return `7${digits}`;
  return digits;
}

// Принимаем только путь на нашем сайте, чтобы в сообщение не попала чужая ссылка.
function pageUrl(value) {
  const path = clean(value, 200);
  return /^\/[\w\-/.%?=&]*$/.test(path) ? SITE + path : null;
}

export async function onRequestPost({ request, env }) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json({ ok: false, error: 'not_configured' }, 503);
  if (Number(request.headers.get('content-length') || 0) > 20000) return json({ ok: false, error: 'too_large' }, 413);

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }
  // Ловушки для ботов: скрытое поле и слишком быстрое заполнение. Боту отвечаем «успехом», чтобы не подбирал обход.
  if (clean(data.website, 200) || Number(data.elapsed) < MIN_FILL_MS) return json({ ok: true, id: 'IH-0' });

  const type = Object.hasOwn(TYPES, data.type) ? data.type : 'cart';
  const name = clean(data.name, 80);
  const phone = clean(data.phone, 24);
  const digits = phone.replace(/\D/g, '');
  if (name.length < 2 || digits.length < 10 || digits.length > 15) return json({ ok: false, error: 'invalid' }, 422);

  const items = (Array.isArray(data.items) ? data.items : [])
    .slice(0, 20)
    .map((i) => ({ product: products.get(String(i.slug)), qty: Math.max(1, Math.min(99, Number.parseInt(i.qty, 10) || 1)) }))
    .filter((i) => i.product);
  if (!items.length && type !== 'callback') return json({ ok: false, error: 'empty' }, 422);

  // Цены считаем на сервере, а не берём из браузера.
  const total = items.reduce((sum, i) => sum + (i.product.price ?? 0) * i.qty, 0);
  const id = `IH-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const city = clean(data.city, 80);
  const comment = clean(data.comment, 1000);
  const page = pageUrl(data.page);
  const source = clean(data.source, 160);
  const text = [
    `${TYPES[type]} · ${id}`,
    items.length ? '' : null,
    ...items.map((i) => `• ${i.product.name} × ${i.qty} — ${i.product.price ? money(i.product.price * i.qty) : 'цена по запросу'}`),
    total ? `Итого: ${money(total)}${items.some((i) => !i.product.price) ? ' + позиции по запросу' : ''}` : null,
    '',
    `👤 ${name}`,
    `📱 ${phone}`,
    `💬 Написать в WhatsApp: https://wa.me/${whatsappNumber(digits)}`,
    city ? `🏙 ${city}` : null,
    comment ? `📝 ${comment}` : null,
    '',
    page ? `Страница: ${page}` : null,
    source ? `Откуда пришёл: ${source}` : null,
  ].filter((line) => line !== null).join('\n').replace(/\n{3,}/g, '\n\n').trim();

  const telegram = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
  }).catch(() => null);
  if (!telegram || !telegram.ok) return json({ ok: false, error: 'telegram_failed' }, 502);
  return json({ ok: true, id });
}

export function onRequest() {
  return json({ ok: false, error: 'method_not_allowed' }, 405);
}
