// Показывает, какие поля уходят из форм на опубликованном сайте, не отправляя заявку: запрос перехватывается и отменяется.
const { chromium } = require('playwright');
const B = process.argv[2] || 'https://jump-mellow-coyote.tilda.ws';
const fields = (body) => Object.fromEntries([...new URLSearchParams(body)].filter(([k]) => !/^(formservices|tildaspec|tilda|form-spec|formskey)/.test(k)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const caught = [];
  await p.route('**/procces/**', (route) => { caught.push(fields(route.request().postData() || '')); route.abort(); });

  await p.goto(B + '/product/rikanv-kaban-650-lrf', { waitUntil: 'networkidle' });
  await p.click('.buy [data-lead="quick"]'); await p.waitForTimeout(300);
  await p.fill('#lead-dialog input[name="Имя"]', 'Проверка полей');
  await p.fill('#lead-dialog input[name="Телефон"]', '+7 900 000-00-09');
  await p.check('#lead-dialog input[type=checkbox]');
  await p.click('[data-lead-submit]'); await p.waitForTimeout(2500);
  await p.evaluate(() => document.getElementById('lead-dialog').close());

  await p.click('.buy [data-add-cart]');
  await p.goto(B + '/product/rikanv-sinica-630', { waitUntil: 'networkidle' });
  await p.click('.buy [data-add-cart]').catch(() => {});
  await p.goto(B + '/cart', { waitUntil: 'networkidle' });
  await p.fill('#ih-cart-form input[name="Имя"]', 'Проверка полей');
  await p.fill('#ih-cart-form input[name="Телефон"]', '+7 900 000-00-09');
  await p.check('#ih-cart-form input[type=checkbox]');
  await p.click('[data-submit]'); await p.waitForTimeout(2500);

  caught.forEach((c, i) => console.log(`форма ${i + 1}:`, JSON.stringify(c, null, 1)));
  await b.close();
})();
