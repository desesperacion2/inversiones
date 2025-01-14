import express from 'express';
import { createBrowser } from './config.js';

const app = express();
const PORT = process.env.PORT || 5000;

async function getStockPrice(url, retries = 3) {
  let browser;
  try {
    console.log(`Creating browser for ${url}...`);
    browser = await createBrowser();
    
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );
    
    await page.setDefaultNavigationTimeout(120000); // Increase timeout to 2 minutes
    await page.setDefaultTimeout(120000);
    
    console.log(`Navigating to ${url}`);
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 120000
    });
    
    // Wait for the price element to be visible
    await page.waitForSelector('div[data-test="instrument-price-last"]', { timeout: 60000 });
    
    const price = await page.evaluate(() => {
      const priceElement = document.querySelector('div[data-test="instrument-price-last"]');
      return priceElement ? priceElement.textContent.trim() : 'Price not found';
    });
    console.log(`Price found for ${url}: ${price}`);
    return price;
  } catch (error) {
    console.error(`Error fetching stock price for ${url}:`, error);
    if (retries > 0) {
      console.log(`Retrying... (${retries} attempts left)`);
      return getStockPrice(url, retries - 1);
    }
    return 'Error fetching price';
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

app.get('/prices', async (req, res) => {
  try {
    const stocks = {
      habitat: 'https://www.investing.com/equities/a.f.p.-habitat',
      lipigas: 'https://www.investing.com/equities/empresas-lipigas-sa',
      tesla: 'https://www.investing.com/equities/tesla-motors',
    };

    console.log('Fetching stock prices...');
    const prices = {};
    for (const [name, url] of Object.entries(stocks)) {
      prices[name] = await getStockPrice(url);
    }
    console.log('Prices fetched:', prices);

    res.json(prices);
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ error: 'Failed to fetch stock prices' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Test the scraper
const testScraper = async () => {
  console.log('Testing scraper...');
  const testUrl = 'https://www.investing.com/equities/tesla-motors';
  const price = await getStockPrice(testUrl);
  console.log('Tesla stock price:', price);
};

testScraper();

