import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login');
  await page.type('input[type="email"]', 'coach@academy.test');
  await page.type('input[type="password"]', 'Coach@123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname.includes('/coach/dashboard'));

  await page.goto('http://localhost:3000/coach/sessions');
  await new Promise((r) => setTimeout(r, 1000));

  console.log('Clicking Open Session button...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((btn) => btn.textContent.includes('Open Session'));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  console.log('Submitting form...');
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) {
      const submit = form.querySelector('button[type="submit"]');
      if (submit) submit.click();
    }
  });

  await page.waitForFunction(() => window.location.pathname.startsWith('/coach/sessions/'), { timeout: 10000 });
  console.log('Navigated to:', page.url());

  await browser.close();
})();
