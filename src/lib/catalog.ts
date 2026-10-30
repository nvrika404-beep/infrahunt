import raw from '../data/catalog.json';
import { categories, categoryOf, lines, productCopy, type Category, type ProductCopy } from '../data/content';

interface RawGroup { title: string; rows: [string, string][] }
interface RawImage { src: string; thumb: string; w: number; h: number }
interface RawProduct {
  slug: string; line: string; category: string; name: string; description: string;
  price: number | null; availability: string | null; groups: RawGroup[]; images: RawImage[];
  faq: [string, string][]; source: string;
}

export interface SpecGroup { title: string; rows: [string, string][] }
export interface JohnsonTable { lens: string; targets: string[]; rows: { label: string; values: string[] }[] }

export interface Product {
  slug: string;
  url: string;
  name: string;
  shortName: string;
  line: string;
  lineName: string;
  category: Category;
  price: number | null;
  priceText: string;
  availability: 'InStock' | 'BackOrder' | 'PreOrder';
  availabilityText: string;
  images: RawImage[];
  copy: ProductCopy;
  groups: SpecGroup[];
  johnson: JohnsonTable | null;
}

// Единицы с rikanv.ru записаны латиницей (50mm, 6h, ≤15mK) — приводим к русскому написанию.
export function formatValue(value: string): string {
  return value
    .replace(/(\d)\s*mrad\b/g, '$1 мрад')
    .replace(/(\d)\s*mK\b/g, '$1 мК')
    .replace(/(\d)\s*μm/g, '$1 мкм')
    .replace(/(\d)\s*mm\b/g, '$1 мм')
    .replace(/(\d)\s*Hz\b/g, '$1 Гц')
    .replace(/(\d)\s*GB\b/g, '$1 ГБ')
    .replace(/(\d)\s*J\b/g, '$1 Дж')
    .replace(/(\d)\s*D\b/g, '$1 дптр')
    .replace(/(\d)\s*h\b/g, '$1 ч')
    .replace(/(\d)\s*g\b/g, '$1 г')
    .replace(/(\d)\s*m\b/g, '$1 м')
    .replace(/(\d+)\.(\d+)\s*X\b/g, '$1,$2×')
    .replace(/(\d)\s*X\b/g, '$1×')
    .replace(/(\d)-(\d)/g, '$1–$2')
    .replace(/℃/g, ' °C')
    .replace(/^riflescope$/, 'прицел');
}

const HIDDEN_ROWS = new Set(['Форм-фактор', 'Дальность обнаружения по критерию Джонсона']);

function johnsonTable(groups: RawGroup[]): JohnsonTable | null {
  const cells = new Map<string, Map<string, string>>();
  let lens = '';
  for (const group of groups) {
    for (const [name, value] of group.rows) {
      const m = name.match(/^Критерий Джонсона: (\S+) \((.+?) ([\d,]+ м); ([\d,]+ мм)\)$/);
      if (!m) continue;
      const [, kind, target, size, focal] = m;
      lens = focal;
      const key = `${target[0].toUpperCase()}${target.slice(1)}, ${size}`;
      if (!cells.has(key)) cells.set(key, new Map());
      cells.get(key)!.set(kind, value.replace(/(\d)(?=(\d{3})+ м)/g, '$1 '));
    }
  }
  if (!cells.size) return null;
  const kinds = ['обнаружение', 'распознавание', 'идентификация'];
  return {
    lens,
    targets: kinds,
    rows: [...cells].map(([label, values]) => ({ label, values: kinds.map((k) => values.get(k) ?? '—') })),
  };
}

function priceText(price: number | null) {
  return price ? `${price.toLocaleString('ru-RU').replace(/ /g, ' ')} ₽` : 'Цена по запросу';
}

const AVAILABILITY = {
  InStock: 'В наличии',
  BackOrder: 'Под заказ',
  PreOrder: 'Скоро в продаже',
} as const;

export const products: Product[] = (raw as RawProduct[]).map((p) => {
  const availability = (p.availability === 'InStock' || p.availability === 'BackOrder' ? p.availability : 'PreOrder') as Product['availability'];
  const groups = p.groups
    .map((g) => ({
      title: g.title.replace(/ /g, ' '),
      rows: g.rows
        .filter(([n]) => !HIDDEN_ROWS.has(n) && !n.startsWith('Критерий Джонсона'))
        .map(([n, v]) => [n, formatValue(v)] as [string, string]),
    }))
    .filter((g) => g.rows.length);
  return {
    slug: p.slug,
    url: `/product/rikanv-${p.slug}/`,
    name: p.name,
    shortName: p.name.replace(/^RikaNV\s+/, ''),
    line: p.line,
    lineName: lines[p.line].name,
    category: categories.find((c) => c.slug === categoryOf[p.category])!,
    price: p.price,
    priceText: priceText(p.price),
    availability,
    availabilityText: AVAILABILITY[availability],
    images: p.images,
    copy: productCopy[p.slug],
    groups,
    johnson: johnsonTable(p.groups),
  };
});

export const productsIn = (categorySlug: string) => products.filter((p) => p.category.slug === categorySlug);
export const productBySlug = (slug: string) => products.find((p) => p.slug === slug);

// Компактные данные для корзины и сравнения в браузере.
export function clientData() {
  return products.map((p) => ({
    slug: p.slug,
    name: p.name,
    url: p.url,
    img: p.images[0]?.thumb,
    price: p.price,
    priceText: p.priceText,
    category: p.category.title,
    groups: [
      { title: 'Основное', rows: [['Цена', p.priceText], ['Наличие', p.availabilityText]] },
      ...p.groups,
    ],
  }));
}
