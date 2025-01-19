import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import express from 'express';

puppeteer.use(StealthPlugin());

const app = express();
const PORT = 5000;

async function scrapeStockPrice(url, retries = 3) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 120000 // Increased timeout to 2 minutes
    });

    // Add a delay before interacting with the page
    await page.waitForTimeout(5000);

    // Handle cookie consent if present
    try {
      await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
      await page.click('#onetrust-accept-btn-handler');
    } catch (e) {
      console.log('No cookie banner found or already accepted');
    }

    const priceSelectors = [
      '[data-test="instrument-price-last"]',
      '#last_last',
      '.text-5xl',
      '.text-2xl'
    ];

    let price = null;
    for (const selector of priceSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        price = await page.$eval(selector, element => element.textContent.trim());
        if (price) break;
      } catch (e) {
        console.log(`Selector ${selector} not found, trying next...`);
      }
    }

    if (!price) {
      throw new Error('Price not found with any selector');
    }

    return price;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    if (retries > 0) {
      console.log(`Retrying... (${retries} attempts left)`);
      return scrapeStockPrice(url, retries - 1);
    }
    return 'Error fetching price';
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

app.get('/stocks', async (req, res) => {
  try {
    const stocks = {
      habitat: await scrapeStockPrice('https://www.investing.com/equities/a.f.p.-habitat'),
      tesla: await scrapeStockPrice('https://www.investing.com/equities/tesla-motors'),
      lipigas: await scrapeStockPrice('https://www.investing.com/equities/empresas-lipigas-sa')
    };
    
    res.json({
      timestamp: new Date().toISOString(),
      prices: stocks
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock prices' });
  }
});

app.listen(PORT, () => {
  console.log(`Stock price server running on http://localhost:${PORT}`);
  console.log('Access /stocks endpoint to get current prices');
});