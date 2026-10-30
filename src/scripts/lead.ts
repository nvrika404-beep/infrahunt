// Отправка заявок с сайта: корзина, покупка в 1 клик, запрос цены, заказ звонка.
export type LeadType = 'cart' | 'quick' | 'price' | 'callback';
export interface LeadPayload {
  type: LeadType;
  name: string;
  phone: string;
  city?: string;
  comment?: string;
  website?: string; // поле-ловушка
  items?: { slug: string; qty: number }[];
  elapsed: number; // сколько миллисекунд человек заполнял форму
}

const SOURCE_KEY = 'ih-source';

// Запоминаем, откуда пришёл посетитель в первый раз: метки UTM или сайт-источник.
export function rememberSource() {
  try {
    if (localStorage.getItem(SOURCE_KEY)) return;
    const params = new URLSearchParams(location.search);
    const utm = ['utm_source', 'utm_medium', 'utm_campaign'].map((k) => params.get(k)).filter(Boolean).join(' / ');
    let source = utm;
    if (!source && document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '');
      if (host && host !== location.hostname) source = host;
    }
    localStorage.setItem(SOURCE_KEY, source || 'прямой заход');
  } catch {
    /* Без хранилища просто не узнаем источник. */
  }
}

function source() {
  try {
    return localStorage.getItem(SOURCE_KEY) ?? '';
  } catch {
    return '';
  }
}

export const phoneDigits = (phone: string) => phone.replace(/\D/g, '');

// Приводим российский номер к виду +7 900 123-45-67, остальные оставляем как ввели.
export function formatPhone(value: string) {
  let d = phoneDigits(value);
  if (d.length === 11 && (d.startsWith('8') || d.startsWith('7'))) d = d.slice(1);
  if (d.length !== 10) return value.trim();
  return `+7 ${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}`;
}

export function validate(name: string, phone: string, consent: boolean) {
  const digits = phoneDigits(phone);
  if (name.trim().length < 2) return 'Укажите имя.';
  if (digits.length < 10 || digits.length > 15) return 'Проверьте номер телефона.';
  if (!consent) return 'Нужно согласие на обработку данных.';
  return '';
}

const GOALS: Record<LeadType, string> = { cart: 'order', quick: 'quick_order', price: 'price_request', callback: 'callback' };

export async function sendLead(payload: LeadPayload): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const response = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, page: location.pathname, source: source() }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) return { ok: false, error: result.error || `http_${response.status}` };
    const ym = (window as unknown as { ym?: (...args: unknown[]) => void }).ym;
    const counter = Number(import.meta.env.PUBLIC_YANDEX_METRIKA_ID);
    if (ym && counter) ym(counter, 'reachGoal', GOALS[payload.type]);
    return { ok: true, id: result.id };
  } catch {
    return { ok: false, error: 'network' };
  }
}
