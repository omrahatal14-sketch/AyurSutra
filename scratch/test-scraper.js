const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('http://mcimindia.co.in/FindDoctor', { waitUntil: 'networkidle' });
    
    await Promise.all([
      page.selectOption('#ctl00_ContentPlaceHolder1_ddType', { index: 2 }),
      page.waitForNavigation({ waitUntil: 'networkidle' }).catch(()=>{})
    ]);
    
    await page.fill('#ctl00_ContentPlaceHolder1_txtValue', '12345');
    
    const captchaSolution = await page.evaluate(() => {
      const input = document.querySelector('#ctl00_ContentPlaceHolder1_txtStopSpam');
      if(!input) return null;
      const text = (input.closest('div') || input.parentElement).textContent;
      const match = text.match(/(\d+)\s*\+\s*(\d+)/);
      if(!match) return null;
      return parseInt(match[1]) + parseInt(match[2]);
    });
    
    await page.fill('#ctl00_ContentPlaceHolder1_txtStopSpam', String(captchaSolution));
    
    await Promise.all([
      page.click('#ctl00_ContentPlaceHolder1_btnSearch'),
      page.waitForLoadState('networkidle').catch(()=>{})
    ]);
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'scratch/test2.png', fullPage: true });
    
    const html = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('table')).map(t => ({
            id: t.id,
            className: t.className,
            rows: t.querySelectorAll('tr').length,
            html: t.outerHTML.substring(0, 1000)
        }));
    });
    console.log(JSON.stringify(html, null, 2));
    
  } finally {
    await browser.close();
  }
})();
