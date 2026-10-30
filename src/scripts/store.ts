// Корзина и сравнение живут в браузере посетителя (localStorage). Сервер их не хранит.
type CartItem = { slug: string; qty: number };

const CART = 'ih-cart';
const COMPARE = 'ih-compare';
export const COMPARE_LIMIT = 4;

function read<T>(key: string, fallback: T): T {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Приватный режим: корзина работает до перезагрузки страницы. */
  }
  window.dispatchEvent(new CustomEvent('ih:store'));
}

export const store = {
  cart: () => read<CartItem[]>(CART, []).filter((i) => i && typeof i.slug === 'string' && i.qty > 0),
  setCart: (items: CartItem[]) => write(CART, items),
  addToCart(slug: string, qty = 1) {
    const items = store.cart();
    const found = items.find((i) => i.slug === slug);
    if (found) found.qty = Math.min(99, found.qty + qty);
    else items.push({ slug, qty });
    store.setCart(items);
  },
  compare: () => read<string[]>(COMPARE, []).filter((s) => typeof s === 'string').slice(0, COMPARE_LIMIT),
  setCompare: (slugs: string[]) => write(COMPARE, slugs.slice(0, COMPARE_LIMIT)),
  toggleCompare(slug: string): 'added' | 'removed' | 'full' {
    const slugs = store.compare();
    if (slugs.includes(slug)) {
      store.setCompare(slugs.filter((s) => s !== slug));
      return 'removed';
    }
    if (slugs.length >= COMPARE_LIMIT) return 'full';
    store.setCompare([...slugs, slug]);
    return 'added';
  },
};

let toastTimer = 0;
export function toast(html: string) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.innerHTML = html;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('is-visible'), 3200);
}

function refresh() {
  const cartCount = store.cart().reduce((sum, i) => sum + i.qty, 0);
  const compare = store.compare();
  document.querySelectorAll<HTMLElement>('[data-cart-count]').forEach((el) => {
    el.textContent = String(cartCount);
    el.hidden = cartCount === 0;
  });
  document.querySelectorAll<HTMLElement>('[data-compare-count]').forEach((el) => {
    el.textContent = String(compare.length);
    el.hidden = compare.length === 0;
  });
  document.querySelectorAll<HTMLButtonElement>('[data-toggle-compare]').forEach((btn) => {
    const active = compare.includes(btn.dataset.toggleCompare!);
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
    const label = btn.querySelector('[data-label]');
    if (label) label.textContent = active ? 'В сравнении' : 'Сравнить';
  });
}

// Обработчики вешаем один раз, даже если модуль подключён на странице дважды.
const w = window as typeof window & { __ihStore?: boolean };
if (!w.__ihStore) {
  w.__ihStore = true;
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const add = target.closest<HTMLElement>('[data-add-cart]');
    if (add) {
      event.preventDefault();
      store.addToCart(add.dataset.addCart!);
      toast(`Добавлено в корзину <a href="/cart/">Оформить</a>`);
      return;
    }
    const preset = target.closest<HTMLAnchorElement>('[data-compare-set]');
    if (preset) {
      store.setCompare(preset.dataset.compareSet!.split(','));
      return; // Ссылка сама откроет страницу сравнения.
    }
    const cmp = target.closest<HTMLElement>('[data-toggle-compare]');
    if (cmp) {
      event.preventDefault();
      const result = store.toggleCompare(cmp.dataset.toggleCompare!);
      if (result === 'added') toast(`Добавлено к сравнению <a href="/compare/">Сравнить</a>`);
      if (result === 'full') toast(`Сравнивать можно до ${COMPARE_LIMIT} приборов <a href="/compare/">Открыть</a>`);
    }
  });

  // Тепловое пятно на карточках следует за курсором.
  document.addEventListener('pointermove', (event) => {
    const card = (event.target as HTMLElement).closest<HTMLElement>('[data-glow]');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--my', `${event.clientY - rect.top}px`);
  });

  window.addEventListener('ih:store', refresh);
  window.addEventListener('storage', refresh);
  refresh();
}
