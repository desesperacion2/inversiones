import { NextResponse } from 'next/server';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface ScrapingResult {
  ticker: string;
  success: boolean;
  message?: string;
  price?: number;
}

// Cached variables
let chileStocksCache: { message: string; success: boolean; results?: ScrapingResult[] } | null = null;
let chileStocksCacheTimestamp = 0;
const CACHE_TTL = 900000; // 5 minutos

// URL base de Yahoo Finance API para acciones chilenas
const BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const SUFFIX = '.SN';

export async function GET() {
  // Return cached data if still fresh
  if (chileStocksCache && Date.now() - chileStocksCacheTimestamp < CACHE_TTL) {
    console.log("Devolviendo datos de caché para Chile stocks.");
    return NextResponse.json(chileStocksCache);
  }

  const results: ScrapingResult[] = [];
  try {
    const stockpricesRef = collection(db, 'stockprices');
    const clStocksSnapshot = await getDocs(stockpricesRef);
    const clTickers = clStocksSnapshot.docs
      .filter(doc => doc.data().market === 'CL')
      .map(doc => doc.id);

    if (clTickers.length === 0) {
      const result = { message: 'No hay acciones chilenas para actualizar', success: true };
      chileStocksCache = result;
      chileStocksCacheTimestamp = Date.now();
      return NextResponse.json(result);
    }

    for (const ticker of clTickers) {
      const url = `${BASE_URL}${ticker}${SUFFIX}?interval=1d`;

      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();

        const lastprice = data?.chart?.result?.[0]?.meta?.regularMarketPrice;

        if (typeof lastprice === 'number' && !isNaN(lastprice)) {
          const stockDocRef = doc(db, 'stockprices', ticker);
          await setDoc(
            stockDocRef,
            {
              lastprice: lastprice,
              updatedat: new Date().toISOString(),
              market: 'CL',
            },
            { merge: true }
          );
          results.push({ ticker, success: true, price: lastprice });
        } else {
          results.push({ ticker, success: false, message: 'No se encontró regularMarketPrice' });
        }
      } catch (error: any) {
        console.error(`Error al obtener datos para ${ticker}: ${error.message}`);
        results.push({ ticker, success: false, message: 'Error en la API o parsing' });
      }
    }

    const finalResult = {
      message: 'Acciones chilenas actualizadas exitosamente',
      success: true,
      results,
    };
    
    // Update cache
    chileStocksCache = finalResult;
    chileStocksCacheTimestamp = Date.now();
    
    return NextResponse.json(finalResult);

  } catch (error) {
    console.error('Error general al actualizar las acciones chilenas:', error);
    const errorResult = { message: 'Error interno del servidor', success: false };
    chileStocksCache = errorResult;
    chileStocksCacheTimestamp = Date.now();
    return NextResponse.json(errorResult, { status: 500 });
  }
}