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

  await page.goto('http://localhost:3000/coach/matches');
  await new Promise((r) => setTimeout(r, 1000));

  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent.includes('Record Match')
    );
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 2000));

  const text = await page.evaluate(() => {
    const modal = document.querySelector('form');
    return modal ? modal.innerText : 'NO FORM';
  });
  console.log('Form Text:\n', text);

  const saveDisabled = await page.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Save Match')
    );
    return saveBtn ? saveBtn.disabled : 'NO SAVE BTN';
  });
  console.log('Is Save Button Disabled:', saveDisabled);

  await browser.close();
})();
