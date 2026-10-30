// Видео и фото: кадры с приборов из Telegram-канала RikaNV (t.me/clubRiKA) и официальные видеообзоры.
// line — линейка, product — конкретная модель (если известна). Ссылка post ведёт на исходный пост.

const tg = (id: number) => `https://t.me/clubRiKA/${id}`;

export interface Clip {
  id: string;
  title: string;
  line: string;
  product?: string;
  w: number;
  h: number;
  duration: number;
  date: string;
  post?: string; // пост в Telegram, если ролик оттуда
}

export const clips: Clip[] = [
  { id: 'kaban-650-boar-shot', title: 'Выход кабана и выстрел на 92 м — Kaban 650 LRF, окно PiP', line: 'kaban', product: 'kaban-650-lrf', w: 960, h: 720, duration: 39, date: '2026-10-30' },
  { id: 'kaban-650-boar-28m', title: 'Кабан на 28 м: палитры «красный» и «белый горячий» — Kaban 650 LRF', line: 'kaban', product: 'kaban-650-lrf', w: 960, h: 720, duration: 40, date: '2026-10-30' },
  { id: '16825-v2', title: 'Лось в прицеле Kaban 650 LRF — Евгений Голубев, конкурс «Золотой олень»', line: 'kaban', product: 'kaban-650-lrf', w: 848, h: 624, duration: 30, date: '2026-10-28', post: tg(16825) },
  { id: '16649-v3', title: 'Kaban 650 LRF PRO на полигоне: замер 1006 м и автобаллистика', line: 'kaban', product: 'kaban-650-lrf-pro', w: 848, h: 624, duration: 30, date: '2026-10-20', post: tg(16649) },
  { id: '16564-v0', title: 'Kaban 650 LRF PRO в городе: замеры среди множества тепловых объектов', line: 'kaban', product: 'kaban-650-lrf-pro', w: 848, h: 624, duration: 30, date: '2026-10-15', post: tg(16564) },
  { id: '16841-v0', title: 'Стадо косуль — Moskit 650 LRF', line: 'moskit', product: 'moskit-650-lrf', w: 848, h: 624, duration: 26, date: '2026-10-29', post: tg(16841) },
  { id: '16735-v0', title: 'Автобаллистика Moskit 650 LRF: выстрел на 330 м', line: 'moskit', product: 'moskit-650-lrf', w: 848, h: 624, duration: 35, date: '2026-10-25', post: tg(16735) },
  { id: '16666-v2', title: 'Ночная охота на лисицу с Moskit 650 LRF — Олег Крупица', line: 'moskit', product: 'moskit-650-lrf', w: 960, h: 720, duration: 30, date: '2026-10-21', post: tg(16666) },
  { id: '16611-v1', title: 'Косули на поле — Moskit 650 LRF', line: 'moskit', product: 'moskit-650-lrf', w: 848, h: 624, duration: 30, date: '2026-10-18', post: tg(16611) },
  { id: '16611-v0', title: 'Палитра «красный» — Moskit 650 LRF', line: 'moskit', product: 'moskit-650-lrf', w: 848, h: 624, duration: 20, date: '2026-10-18', post: tg(16611) },
  { id: '16275-v1', title: 'Волк в прицеле Dovod PRO — кадры с реальной охоты', line: 'dovod-pro', w: 848, h: 848, duration: 27, date: '2026-10-03', post: tg(16275) },
  { id: '16266-v0', title: 'Dovod PRO: работа дальномера, Максим Резников', line: 'dovod-pro', w: 848, h: 848, duration: 27, date: '2026-10-02', post: tg(16266) },
  { id: '16494-v0', title: 'Ночной этап турнира в Якутии: мишень на 2300 м, стрелки RikaNV с насадкой Ehidna', line: 'ehidna', product: 'ehidna-g-ec-1', w: 960, h: 540, duration: 30, date: '2026-10-11', post: tg(16494) },
  { id: '16773-v2', title: 'Мультиспектральный бинокль Snegir 1280 на охоте — Александр Шкапцов', line: 'snegir', product: 'snegir-1280', w: 960, h: 540, duration: 21, date: '2026-10-26', post: tg(16773) },
];

export interface Photo {
  id: string;
  title: string;
  line?: string;
  w: number;
  h: number;
  post: string;
}

export const photos: Photo[] = [
  { id: '16680-p1', title: 'Волчица, выстрел на 350 м — Kaban 650 LRF', line: 'kaban', w: 800, h: 600, post: tg(16680) },
  { id: '16581-p0', title: 'Дуплет по кабанам — Kaban 650 LRF', line: 'kaban', w: 800, h: 600, post: tg(16581) },
  { id: '16627-p0', title: 'Волк — Moskit 650 LRF, Олег Крупица', line: 'moskit', w: 600, h: 800, post: tg(16627) },
  { id: '16717-p0', title: 'Трофейный самец косули — Kaban 650 LRF', line: 'kaban', w: 450, h: 800, post: tg(16717) },
  { id: '16854-p2', title: 'Лиса — приборы RikaNV и гладкоствольное ружьё', w: 800, h: 600, post: tg(16854) },
  { id: '16808-p1', title: 'Kaban и Moskit: быстросъёмный кронштейн теперь в комплекте', line: 'kaban', w: 800, h: 600, post: tg(16808) },
  { id: '16111-p0', title: 'Первая добыча с Kaban 650 LRF', line: 'kaban', w: 600, h: 800, post: tg(16111) },
  { id: '16707-p1', title: 'Kaban 650 LRF PRO на испытаниях в горах', line: 'kaban', w: 800, h: 450, post: tg(16707) },
  { id: '16727-p0', title: 'Кабан — Kaban 650 LRF', line: 'kaban', w: 579, h: 800, post: tg(16727) },
  { id: '16793-p3', title: 'Команда RikaNV переходит на новинки', line: 'kaban', w: 800, h: 600, post: tg(16793) },
  { id: '16850-p0', title: 'Волк — охотник команды RikaNV из Беларуси', w: 600, h: 800, post: tg(16850) },
  { id: '16564-p0', title: 'Иван Клипацкий тестирует Kaban 650 LRF PRO', line: 'kaban', w: 600, h: 800, post: tg(16564) },
];

export interface Review {
  youtube: string;
  title: string;
  author: string;
  line: string;
  product?: string;
  rutube?: string;
  vk?: string;
  date?: string; // дата публикации, если известна точно
}

// Официальные обзоры — как на test.rika-nv.ru/#reviews, плюс выпуски канала youtube.com/@RikaNV.
export const reviews: Review[] = [
  { youtube: '9mudS-DqfW8', title: 'Полный гид по RikaNV Kaban 650 LRF: настройки, меню и секреты от Ивана Клипацкого', author: 'RikaNV', line: 'kaban', product: 'kaban-650-lrf', rutube: '00a8283d5bccb874564c43b8266b1e47', vk: 'video-135836210_456246247', date: '2026-09-24' },
  { youtube: 'EVAayCh4rS8', title: 'RikaNV Kaban 650 LRF: убийца флагманов или компромисс? Разбор от Ивана Клипацкого', author: 'RikaNV', line: 'kaban', product: 'kaban-650-lrf' },
  { youtube: 'h5lLimnzhUc', title: 'RikaNV Kaban 650 LRF: первые впечатления и пристрелка', author: 'Саня на охоте', line: 'kaban', product: 'kaban-650-lrf' },
  { youtube: 'm4PYfPBPy80', title: 'Охота на лисицу с RikaNV Kaban 650 LRF в сильную влажность', author: 'Саня на охоте', line: 'kaban', product: 'kaban-650-lrf' },
  { youtube: 'nLCKB160p9E', title: 'Охота на лисицу с RikaNV Kaban 650 LRF: работаем на результат', author: 'Саня на охоте', line: 'kaban', product: 'kaban-650-lrf' },
  { youtube: 'hewjeDHhYbo', title: 'Охота на крупного кабана с .223 Rem и прицелом RikaNV Kaban 650 LRF', author: 'Саня на охоте', line: 'kaban', product: 'kaban-650-lrf' },
  { youtube: 'icvMXAZno3g', title: 'RikaNV Moskit 650 LRF против 300 метров: экзамен в тире с экспертами', author: 'RikaNV', line: 'moskit', product: 'moskit-650-lrf', vk: 'video-135836210_456246348', date: '2026-10-08' },
  { youtube: 'NDHBFtbc3O0', title: 'Первый тест RikaNV Strekoza: Евгений Голубев замеряет 300 метров', author: 'RikaNV', line: 'strekoza' },
  { youtube: 'xJ95-S7H7XQ', title: 'RikaNV Strekoza BRF-2000: баллистика в смартфоне и первый обзор с Иваном Клипацким', author: 'RikaNV', line: 'strekoza', product: 'strekoza-brf-2000', rutube: 'a48f3372797f4ea9d8d939f4c1d494b8', vk: 'video-135836210_456246429', date: '2026-10-20' },
  { youtube: '_QK3hmjX774', title: '1500 метров: сможет ли RikaNV Strekoza BRF-2000? Тест на полигоне', author: 'RikaNV', line: 'strekoza', product: 'strekoza-brf-2000', rutube: '5e834e799b2539ef9538920870bd1c78', vk: 'video-135836210_456246448', date: '2026-10-22' },
  { youtube: 'fRda2QyITLE', title: 'Сборная России и RikaNV Strekoza BRF-4000 на Кубке IRLSF в горах Киргизии', author: 'RikaNV', line: 'strekoza', product: 'strekoza-brf-4000', vk: 'video-135836210_456246502', date: '2026-10-28' },
];

export const clipSrc = (c: Clip) => `/media/video/${c.id}.mp4`;
export const clipPoster = (c: Clip) => `/media/video/${c.id}.webp`;
export const photoSrc = (p: Photo) => `/media/photos/${p.id}.webp`;
export const reviewThumb = (r: Review) => `/media/reviews/${r.youtube}.webp`;
export const reviewEmbed = (r: Review) =>
  r.rutube ? `https://rutube.ru/play/embed/${r.rutube}?autoplay=1` : `https://www.youtube-nocookie.com/embed/${r.youtube}?autoplay=1&rel=0&playsinline=1`;
export const reviewLinks = (r: Review) => [
  ...(r.rutube ? [{ label: 'RuTube', href: `https://rutube.ru/video/${r.rutube}/` }] : []),
  ...(r.vk ? [{ label: 'VK Видео', href: `https://vkvideo.ru/${r.vk}` }] : []),
  { label: 'YouTube', href: `https://youtu.be/${r.youtube}` },
];

// Медиа для страницы товара: сначала про эту модель, затем про линейку.
export function mediaFor(product: string, line: string) {
  const rank = <T extends { line?: string; product?: string }>(items: T[]) => [
    ...items.filter((i) => i.product === product),
    ...items.filter((i) => i.line === line && i.product !== product),
  ];
  return { clips: rank(clips), reviews: rank(reviews), photos: rank(photos) };
}
