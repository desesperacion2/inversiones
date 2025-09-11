import { NextResponse } from 'next/server';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import puppeteer from 'puppeteer';

// Define la interfaz para el resultado del scraping
interface ScrapingResult {
  ticker: string;
  success: boolean;
  message?: string;
  price?: number;
}

// URL base de Yahoo Finance para acciones chilenas
const BASE_URL = 'https://finance.yahoo.com/quote/';
const SUFFIX = '.SN/';

export async function GET() {
  let browser = null;
  const results: ScrapingResult[] = [];
  try {
    // 1. Obtener la lista de acciones chilenas desde la colección 'stockprices'
    const stockpricesRef = collection(db, 'stockprices');
    const clStocksSnapshot = await getDocs(stockpricesRef);
    const clTickers = clStocksSnapshot.docs
      .filter(doc => doc.data().market === 'CL')
      .map(doc => doc.id);

    if (clTickers.length === 0) {
      return NextResponse.json({ message: 'No hay acciones chilenas para actualizar', success: true });
    }

    // 2. Lanzar el navegador sin cabeza
    browser = await puppeteer.launch({ 
      headless: true,
      executablePath: 'C:\\Users\\emili\\.cache\\puppeteer\\chrome\\win64-140.0.7339.82\\chrome-win64\\chrome.exe'
    });
    const page = await browser.newPage();

    // Establece un User-Agent de navegador real para evitar bloqueos
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    
    // 3. Iterar sobre cada ticker y hacer scraping de forma secuencial
    for (const ticker of clTickers) {
      const url = `${BASE_URL}${ticker}${SUFFIX}`;
      
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Espera a que el elemento del precio esté presente en el DOM
        await page.waitForSelector('span[data-testid="qsp-price"]', { timeout: 10000 });
        
        // Extrae el texto del elemento usando $eval
        const priceText = await page.$eval(
          'span[data-testid="qsp-price"]',
          (element) => element.textContent?.trim() || ''
        );

        // Quita separadores de miles y convierte a número
        const lastprice = parseFloat(priceText.replace(/,/g, ''));

        if (!isNaN(lastprice)) {
          const stockDocRef = doc(db, 'stockprices', ticker);
          await setDoc(
            stockDocRef,
            {
              lastprice: lastprice,
              updatedat: new Date().toISOString(),
              market: 'CL'
            },
            { merge: true }
          );

          results.push({ ticker, success: true, price: lastprice });
        } else {
          results.push({ ticker, success: false, message: 'El valor scrapeado no es un número' });
        }
      } catch (error: any) {
        console.error(`Error al hacer scraping para ${ticker}: ${error.message}`);
        results.push({ ticker, success: false, message: 'Error en la navegación o scraping' });
      }
    }

    return NextResponse.json({ message: 'Acciones chilenas actualizadas exitosamente', success: true, results });

  } catch (error) {
    console.error("Error general al actualizar las acciones chilenas:", error);
    return NextResponse.json({ message: 'Error interno del servidor', success: false }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
