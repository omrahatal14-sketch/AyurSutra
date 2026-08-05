// ─── MCIM Doctor Licence Scraper Engine ────────────────────────────────────
// Isolated utility: Scrapes http://mcimindia.co.in/FindDoctor using Playwright
// Does NOT touch any existing routes or modules.

const { chromium } = require('playwright');

const MCIM_URL = 'http://mcimindia.co.in/FindDoctor';
const SCRAPE_TIMEOUT = 20000; // 20 seconds max per scrape attempt

// ─── Selectors (ASP.NET WebForms IDs from the live MCIM site) ─────────────
const SEL = {
  searchType:    '#ctl00_ContentPlaceHolder1_ddType',
  searchInput:   '#ctl00_ContentPlaceHolder1_txtValue',
  captchaInput:  '#ctl00_ContentPlaceHolder1_txtStopSpam',
  captchaRefresh:'#ctl00_ContentPlaceHolder1_btnResetCaptcha',
  searchButton:  '#ctl00_ContentPlaceHolder1_btnSearch',
};

/**
 * Scrapes MCIM FindDoctor page for a given registration number.
 * Completely isolated — launches its own browser, does its work, closes it.
 *
 * @param {string|number} regNo - MCIM Registration Number (numeric only)
 * @returns {Promise<{registrationNumber: string, fullName: string, qualification: string, status: string}>}
 * @throws {Error} If no records found or page times out
 */
async function scrapeMCIMDoctor(regNo) {
  let browser = null;

  try {
    try {
      browser = await chromium.launch({ headless: true, channel: 'chrome' });
    } catch (e) {
      console.log("[MCIM Scraper] Chrome not found, falling back to msedge...");
      browser = await chromium.launch({ headless: true, channel: 'msedge' });
    }
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    page.setDefaultTimeout(SCRAPE_TIMEOUT);

    // ── 1. Navigate to the FindDoctor page ──────────────────────────────
    await page.goto(MCIM_URL, { waitUntil: 'networkidle', timeout: SCRAPE_TIMEOUT });

    // ── 2. Select "Find by Registration No (Only Number)" from dropdown ─
    // ASP.NET AutoPostBack: changing the dropdown triggers a page reload, so we must wait for it.
    await page.waitForSelector(SEL.searchType, { state: 'visible' });
    await Promise.all([
      page.selectOption(SEL.searchType, { index: 2 }),
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: SCRAPE_TIMEOUT }).catch(() => {})
    ]);

    // ── 3. Fill in the Registration Number ──────────────────────────────
    await page.waitForSelector(SEL.searchInput, { state: 'visible' });
    await page.fill(SEL.searchInput, String(regNo));

    // ── 4. Solve the math captcha ───────────────────────────────────────
    // The captcha shows a simple addition like "6 + 5 =" next to the input.
    // We extract the equation text from the parent container and evaluate it.
    const captchaSolution = await page.evaluate((captchaSelector) => {
      const input = document.querySelector(captchaSelector);
      if (!input) return null;

      // Walk up to find the container with the equation text
      const container = input.closest('div') || input.parentElement;
      if (!container) return null;

      const fullText = container.textContent || '';
      // Match patterns like "6 + 5", "12 + 3", etc.
      const match = fullText.match(/(\d+)\s*\+\s*(\d+)/);
      if (!match) return null;

      return parseInt(match[1], 10) + parseInt(match[2], 10);
    }, SEL.captchaInput);

    if (captchaSolution === null) {
      throw new Error('Could not parse the math captcha equation from MCIM page.');
    }

    await page.fill(SEL.captchaInput, String(captchaSolution));

    // ── 5. Click Search and wait for response ───────────────────────────
    await Promise.all([
      page.click(SEL.searchButton),
      page.waitForLoadState('networkidle', { timeout: SCRAPE_TIMEOUT }).catch(() => {}),
    ]);

    // Small extra wait for ASP.NET postback rendering
    await page.waitForTimeout(2000);

    // ── 6. Parse the results table ──────────────────────────────────────
    const doctorData = await page.evaluate(() => {
      // MCIM uses ASP.NET GridView; look for any visible data table
      const tables = document.querySelectorAll('table.gvtable, table.dataTable, table[id*="gvData"], table[id*="GridView"]');
      let resultTable = null;

      for (const t of tables) {
        const rows = t.querySelectorAll('tr');
        // We need at least a header row + 1 data row
        if (rows.length >= 2) {
          resultTable = t;
          break;
        }
      }

      if (!resultTable) return null;

      const rows = resultTable.querySelectorAll('tr');
      // Get header texts to determine column mapping
      const headerCells = Array.from(rows[0].querySelectorAll('th, td'))
        .map(cell => cell.textContent.trim().toLowerCase());

      // Parse the first data row
      const dataRow = rows[1];
      const cells = Array.from(dataRow.querySelectorAll('td')).map(td => td.textContent.trim());

      if (cells.length === 0) return null;

      // Build result by mapping known column names, or fall back to positional
      const findCol = (keywords) => {
        const idx = headerCells.findIndex(h =>
          keywords.some(kw => h.includes(kw))
        );
        return idx >= 0 && idx < cells.length ? cells[idx] : '';
      };

      return {
        registrationNumber: findCol(['reg', 'registration', 'number', '#']) || cells[0] || '',
        fullName:           findCol(['name', 'doctor']) || cells[1] || '',
        qualification:      findCol(['qualification', 'degree', 'qual']) || cells[2] || '',
        status:             findCol(['status', 'active', 'state']) || cells[3] || '',
      };
    });

    // ── 7. Validate we got real data ────────────────────────────────────
    if (!doctorData || (!doctorData.fullName && !doctorData.registrationNumber)) {
      // Check if there's a "no records" message on the page
      const pageText = await page.textContent('body');
      if (pageText.toLowerCase().includes('no record') || pageText.toLowerCase().includes('not found')) {
        throw new Error(`No MCIM record found for registration number: ${regNo}`);
      }
      throw new Error(`Could not extract doctor data from MCIM for regNo: ${regNo}. The page structure may have changed.`);
    }

    // Ensure regNo is populated even if the table didn't have it
    if (!doctorData.registrationNumber) {
      doctorData.registrationNumber = String(regNo);
    }

    console.log(`[MCIM Scraper] Successfully scraped data for regNo: ${regNo}`);
    return doctorData;

  } catch (error) {
    console.error(`[MCIM Scraper] Error for regNo ${regNo}:`, error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { scrapeMCIMDoctor };
