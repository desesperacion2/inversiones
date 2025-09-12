import { NextResponse } from 'next/server';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

// Define la interfaz para el resultado del scraping
interface ScrapingResult {
  ticker: string;
  success: boolean;
  message?: string;
  price?: number;
}

// URL base de Yahoo Finance API para acciones chilenas
const BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const SUFFIX = '.SN';

export async function GET() {
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

    // 2. Iterar sobre cada ticker y obtener precio desde la API de Yahoo
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

        // Extraer el precio del JSON
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

    return NextResponse.json({
      message: 'Acciones chilenas actualizadas exitosamente',
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error general al actualizar las acciones chilenas:', error);
    return NextResponse.json({ message: 'Error interno del servidor', success: false }, { status: 500 });
  }
}
