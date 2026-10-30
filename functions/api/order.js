// Cloudflare Pages Function: принимает заказ из корзины и пересылает его в Telegram.
// Переменные окружения (Cloudflare → Pages → Settings → Variables and Secrets):
//   TELEGRAM_BOT_TOKEN — токен бота от @BotFather (секрет, в код не добавлять);
//   TELEGRAM_CHAT_ID   — id чата или группы, куда приходят заказы.
import catalog from '../../src/data/catalog.json';

const products = new Map(catalog.map((p) => [p.slug, p]));
const clean = (value, max) => String(value ?? '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, max);
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

export async function onRequestPost({ request, env }) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json({ ok: false, error: 'not_configured' }, 503);
  if (Number(request.headers.get('content-length') || 0) > 20000) return json({ ok: false, error: 'too_large' }, 413);

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }
  // Поле-ловушка: человек его не видит и не заполняет.
  if (clean(data.website, 200)) return json({ ok: true, id: 'IH-0' });

  const name = clean(data.name, 80);
  const phone = clean(data.phone, 24);
  const digits = phone.replace(/\D/g, '');
  if (name.length < 2 || digits.length < 10 || digits.length > 15) return json({ ok: false, error: 'invalid' }, 422);

  const items = (Array.isArray(data.items) ? data.items : [])
    .slice(0, 20)
    .map((i) => ({ product: products.get(String(i.slug)), qty: Math.max(1, Math.min(99, Number.parseInt(i.qty, 10) || 1)) }))
    .filter((i) => i.product);
  if (!items.length) return json({ ok: false, error: 'empty' }, 422);

  // Цены считаем на сервере, а не берём из браузера.
  const money = (n) => `${n.toLocaleString('ru-RU')} ₽`;
  const total = items.reduce((sum, i) => sum + (i.product.price ?? 0) * i.qty, 0);
  const id = `IH-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const text = [
    `🛒 Заказ ${id} с infrahunt.ru`,
    '',
    ...items.map((i) => `• ${i.product.name} × ${i.qty} — ${i.product.price ? money(i.product.price * i.qty) : 'цена по запросу'}`),
    '',
    `Итого: ${money(total)}${items.some((i) => !i.product.price) ? ' + позиции по запросу' : ''}`,
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    clean(data.city, 80) ? `Город: ${clean(data.city, 80)}` : null,
    clean(data.comment, 1000) ? `Комментарий: ${clean(data.comment, 1000)}` : null,
  ].filter((line) => line !== null).join('\n');

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
