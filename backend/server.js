import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = 5000;

async function getStockPrice(url) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    const price = await page.evaluate(() => {
      const priceElement = document.querySelector('div[data-test="instrument-price-last"]');
      return priceElement ? priceElement.textContent : 'Price not found';
    });
    
    return price;
  } catch (error) {
    console.error('Error fetching stock price:', error);
    return 'Error fetching price';
  } finally {
    await browser.close();
  }
}

app.get('/prices', async (req, res) => {
  try {
    const stocks = {
      habitat: 'https://www.investing.com/equities/a.f.p.-habitat',
      lipigas: 'https://www.investing.com/equities/empresas-lipigas-sa',
      tesla: 'https://www.investing.com/equities/tesla-motors'
    };

    const prices = {
      habitat: await getStockPrice(stocks.habitat),
      lipigas: await getStockPrice(stocks.lipigas),
      tesla: await getStockPrice(stocks.tesla)
    };

    res.json(prices);
  } catch (error) {
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