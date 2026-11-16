// Проверка поведения на черновиках Тильды.
const { chromium } = require('playwright');
const B = 'http://localhost:4400/';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => { if (!/\$ is not defined/.test(e.message)) errs.push(e.message); });
  const ok = (name, cond) => console.log(cond ? 'PASS' : 'FAIL', name);

  // Товар: корзина, сравнение, закрепление, окно «Купить в 1 клик», галерея, видео
  await p.goto(B + 'product__rikanv-kaban-650-lrf.html', { waitUntil: 'networkidle' });
  await p.click('.buy [data-add-cart]'); await p.waitForTimeout(300);
  ok('корзина: счётчик в шапке', (await p.textContent('[data-cart-count]')) === '1');
  ok('тост после добавления', await p.isVisible('.toast.is-visible'));
  await p.click('.buy [data-toggle-compare]'); await p.waitForTimeout(200);
  ok('сравнение: счётчик', (await p.textContent('[data-compare-count]')) === '1');
  ok('шапка закреплена (fixed)', await p.evaluate(() => getComputedStyle(document.querySelector('.header')).position === 'fixed'));
  await p.evaluate(() => scrollTo(0, 1800)); await p.waitForTimeout(400);
  ok('вкладки закрепились под шапкой', await p.evaluate(() => {
    const t = document.querySelector('.tabs');
    return t.classList.contains('is-stuck') && Math.abs(t.getBoundingClientRect().top - parseFloat(getComputedStyle(t).top)) < 3;
  }));
  ok('нижняя панель покупки появилась', await p.evaluate(() => document.querySelector('[data-sticky]').classList.contains('is-visible')));
  ok('шапка видна при прокрутке', await p.evaluate(() => document.querySelector('.header').getBoundingClientRect().top === 0));
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
  await p.click('.buy [data-lead="quick"]'); await p.waitForTimeout(400);
  ok('окно «Купить в 1 клик» открылось', await p.isVisible('#lead-dialog'));
  ok('в окне товар', (await p.textContent('[data-lead-name]')).includes('Kaban 650'));
  ok('скрытые поля заполнены', await p.evaluate(() =>
    document.querySelector('[data-lead-f="type"]').value.includes('1 клик') && document.querySelector('[data-lead-f="product"]').value.includes('Kaban')));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  const thumbs = await p.$$('[data-thumb]');
  if (thumbs[1]) { await thumbs[1].click(); await p.waitForTimeout(900); }
  ok('галерея листается', await p.evaluate(() => (document.querySelector('[data-counter]')?.textContent ?? '').startsWith('2')));
  await p.locator('#video .clip').nth(2).click(); await p.waitForTimeout(1500);
  ok('окно видео с плеером Telegram', await p.evaluate(() =>
    document.getElementById('media-dialog').open && !!document.querySelector('.md-stage iframe[src*="t.me/clubRiKA/16827?embed=1&mode=tme&single=1"]')));
  await p.keyboard.press('Escape');

  // Главная: слайдер, мега-меню, заказ звонка
  await p.goto(B + 'index.html', { waitUntil: 'networkidle' });
  const t0 = await p.evaluate(() => document.querySelector('[data-track]').scrollLeft);
  await p.click('[data-dot] >> nth=1'); await p.waitForTimeout(900);
  ok('слайдер переключается', t0 !== await p.evaluate(() => document.querySelector('[data-track]').scrollLeft));
  await p.hover('.nav-catalog'); await p.waitForTimeout(400);
  ok('мега-меню каталога', await p.evaluate(() => getComputedStyle(document.querySelector('.mega')).visibility === 'visible'));
  await p.mouse.move(5, 600);
  await p.click('.topbar [data-lead="callback"]'); await p.waitForTimeout(300);
  ok('«Перезвоните мне» открывает окно', (await p.textContent('[data-lead-title]')) === 'Заказать звонок');
  await p.keyboard.press('Escape');

  // Каталог: подсветка меню и фильтр
  await p.goto(B + 'catalog.html', { waitUntil: 'networkidle' });
  await p.click('[data-filter="binokli"]').catch(() => {}); await p.waitForTimeout(200);
  ok('фильтр каталога', await p.evaluate(() => [...document.querySelectorAll('[data-catalog] .cell')].filter((c) => !c.hidden).length === 2));

  // Корзина и сравнение
  await p.goto(B + 'cart.html', { waitUntil: 'networkidle' });
  ok('корзина показывает товар', await p.evaluate(() => document.querySelectorAll('[data-items] .row').length === 1));
  ok('форма корзины подключена к Тильде', await p.evaluate(() => document.querySelector('#ih-cart-form').classList.contains('js-form-proccess')));
  await p.goto(B + 'compare.html', { waitUntil: 'networkidle' });
  ok('сравнение строит таблицу', await p.evaluate(() => document.querySelectorAll('.table-wrap thead th').length >= 2));

  // Видео-страница: фильтр
  await p.goto(B + 'video.html', { waitUntil: 'networkidle' });
  const btn = await p.$$('[data-media-filter]');
  await btn[1].click(); await p.waitForTimeout(200);
  ok('фильтр видео', await p.evaluate(() => [...document.querySelectorAll('.clip,.review,.photo')].some((e) => e.hidden)));

  // Контакты: копирование
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  await p.goto(B + 'kontakty.html', { waitUntil: 'networkidle' });
  await p.click('[data-copy] >> nth=0'); await p.waitForTimeout(300);
  ok('копирование реквизитов + тост', await p.isVisible('.toast.is-visible'));

  // Мобильное меню
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(B + 'index.html', { waitUntil: 'networkidle' });
  await m.click('[data-burger]'); await m.waitForTimeout(300);
  ok('бургер открывает меню', await m.isVisible('#drawer'));
  console.log('errors', errs);
  await b.close();
})();
