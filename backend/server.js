const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());
app.use(express.json());

async function getStockPrices(tickers) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const results = {};

    for (const ticker of tickers) {
        try {
            await page.goto(`https://finance.yahoo.com/quote/${ticker}/`, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            const price = await page.$eval('fin-streamer.livePrice span', (el) => el.innerText);

            // Ajuste para manejar formato de miles y decimales
            const priceFormatted = parseFloat(price.replace(/\./g, '').replace(',', '.'));
            results[ticker] = priceFormatted;
        } catch (error) {
            results[ticker] = 'Error al obtener precio';
            console.error(`Error al obtener el precio de ${ticker}:`, error.message);
        }
    }

    await browser.close();
    return results;
}

const mockStockData = {
    'HABITAT.SN': { shares: 54, costBasis: 810 },
    'LIPIGAS.SN': { shares: 73, costBasis: 3600 },
    'BCI.SN': { shares: 20, costBasis: 1200 },
    'ZOFRI.SN': { shares: 100, costBasis: 900 }
};

app.get('/api/portfolio', async (req, res) => {
    try {
        const tickers = Object.keys(mockStockData);
        const prices = await getStockPrices(tickers);
        res.json({ prices, holdings: mockStockData });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los precios' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
