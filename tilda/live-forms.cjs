// Тестовые заявки на опубликованном сайте Тильды: окно «Заказать звонок» и оформление корзины.
const { chromium } = require('playwright');
const B = process.argv[2] || 'https://jump-mellow-coyote.tilda.ws';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const sent = []; p.on('request', (r) => { if (r.method() === 'POST') sent.push(r.url().split('?')[0] + ' ' + (r.postData() || '').slice(0, 600)); });
  const ok = (name, cond) => console.log(cond ? 'PASS' : 'FAIL', name);

  await p.goto(B + '/kontakty', { waitUntil: 'networkidle' });
  ok('библиотека форм Тильды загружена', await p.evaluate(() => typeof window.t_forms__initBtnClick === 'function'));
  await p.click('.head-side [data-lead="callback"]'); await p.waitForTimeout(400);
  // Пустая отправка — должны появиться ошибки под полями
  await p.click('[data-lead-submit]'); await p.waitForTimeout(800);
  ok('ошибки под пустыми полями', await p.evaluate(() => [...document.querySelectorAll('#lead-dialog .t-input-error')].some((e) => e.textContent.trim())));
  await p.fill('#lead-dialog input[name="Имя"]', 'ТЕСТ Заказ звонка (Тильда)');
  await p.fill('#lead-dialog input[name="Телефон"]', '+7 900 000-00-07');
  await p.fill('#lead-dialog textarea[name="Комментарий"]', 'Тестовая заявка после переноса на Тильду, не звонить');
  await p.check('#lead-dialog input[type=checkbox]');
  await p.click('[data-lead-submit]');
  await p.waitForSelector('[data-lead-done]:not([hidden])', { timeout: 20000 }).catch(() => {});
  ok('заявка из окна отправлена, показан номер', await p.isVisible('[data-lead-done]'));
  console.log('  номер заявки:', await p.textContent('[data-lead-id]'));

  await p.goto(B + '/product/rikanv-moskit-335-lrf', { waitUntil: 'networkidle' });
  await p.click('.buy [data-add-cart]');
  await p.goto(B + '/cart', { waitUntil: 'networkidle' });
  ok('товар в корзине', await p.evaluate(() => document.querySelectorAll('[data-items] .row').length === 1));
  await p.fill('#ih-cart-form input[name="Имя"]', 'ТЕСТ Корзина (Тильда)');
  await p.fill('#ih-cart-form input[name="Телефон"]', '+7 900 000-00-08');
  await p.fill('#ih-cart-form input[name="Город"]', 'Краснодар');
  await p.fill('#ih-cart-form textarea[name="Комментарий"]', 'Тестовый заказ после переноса на Тильду, не звонить');
  await p.check('#ih-cart-form input[type=checkbox]');
  await p.click('[data-submit]');
  await p.waitForSelector('[data-done]:not([hidden])', { timeout: 20000 }).catch(() => {});
  ok('заказ из корзины отправлен', await p.isVisible('[data-done]'));
  console.log('  номер заказа:', await p.textContent('[data-order-id]'));
  ok('корзина очищена', await p.evaluate(() => (localStorage.getItem('ih-cart') || '[]') === '[]'));
  console.log('POST-запросы:'); sent.forEach((x) => console.log('  ', decodeURIComponent(x.replace(/\+/g, ' ')).slice(0, 700))); console.log('ошибки:', errs);
  await b.close();
})();
