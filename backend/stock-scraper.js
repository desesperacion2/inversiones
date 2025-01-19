import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

// Configure chromium
chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

// Serverless handler
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser = null;

  try {
    // Launch browser with minimal configuration
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // Set a reasonable timeout
    page.setDefaultNavigationTimeout(15000);
    
    // Configure minimal browser settings
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['image', 'stylesheet', 'font', 'script'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Function to get price with retry
    async function getPrice(url, retries = 2) {
      for (let i = 0; i < retries; i++) {
        try {
          await page.goto(url, { waitUntil: 'networkidle0' });
          
          // Try multiple selectors quickly
          const price = await page.evaluate(() => {
            const selectors = [
              '[data-test="instrument-price-last"]',
              '#last_last',
              '.text-5xl',
              '.text-2xl'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element) return element.textContent.trim();
            }
            return null;
          });
          
          if (price) return price;
        } catch (err) {
          console.error(`Attempt ${i + 1} failed for ${url}:`, err);
          if (i === retries - 1) throw err;
        }
      }
      throw new Error('Failed to get price after retries');
    }

    // Get prices concurrently
    const [habitat, tesla, lipigas] = await Promise.all([
      getPrice('https://www.investing.com/equities/a.f.p.-habitat').catch(() => 'Error'),
      getPrice('https://www.investing.com/equities/tesla-motors').catch(() => 'Error'),
      getPrice('https://www.investing.com/equities/empresas-lipigas-sa').catch(() => 'Error')
    ]);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      prices: { habitat, tesla, lipigas }
    });

  } catch (error) {
    console.error('Scraping failed:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch stock prices',
      details: error.message 
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}