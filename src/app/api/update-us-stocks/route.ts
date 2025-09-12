import { NextResponse } from 'next/server';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

// Cached variables
let usStocksCache: { message: string; success: boolean; results?: any[] } | null = null;
let usStocksCacheTimestamp = 0;
const CACHE_TTL = 900000; // 5 minutos

export async function GET() {
  // Return cached data if still fresh
  if (usStocksCache && Date.now() - usStocksCacheTimestamp < CACHE_TTL) {
    console.log("Devolviendo datos de caché para US stocks.");
    return NextResponse.json(usStocksCache);
  }

  try {
    const apiKey = '8AJJZYE8ELY517IL'; 

    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usTickers = new Set<string>();
    
    for (const userDoc of usersSnapshot.docs) {
      const portfolioRef = collection(db, 'users', userDoc.id, 'portfolio');
      const portfolioSnapshot = await getDocs(portfolioRef);
      portfolioSnapshot.forEach(pos => {
        if (pos.data().market === 'US') {
          usTickers.add(pos.data().ticker);
        }
      });
    }

    if (usTickers.size === 0) {
      const result = { message: 'No US stocks to update', success: true };
      usStocksCache = result;
      usStocksCacheTimestamp = Date.now();
      return NextResponse.json(result);
    }

    const updatePromises = Array.from(usTickers).map(async (ticker) => {
      const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`);
      const data = await response.json();

      const globalQuote = data['Global Quote'];
      if (globalQuote && globalQuote['05. price']) {
        const lastprice = parseFloat(globalQuote['05. price']);
        const changePercent = globalQuote['10. change percent'] ? parseFloat(globalQuote['10. change percent'].replace('%', '')) : 0;

        const stockDocRef = doc(db, 'stockprices', ticker);
        await setDoc(stockDocRef, {
          lastprice: lastprice,
          changePercent: changePercent,
          updatedat: new Date().toISOString(),
          market: 'US'
        });
        return { ticker, success: true, price: lastprice };
      } else {
        console.warn(`Could not get data for ticker: ${ticker}. API response:`, data);
        return { ticker, success: false, message: 'Data not found or API call failed' };
      }
    });

    const results = await Promise.all(updatePromises);
    const finalResult = { message: 'US stocks updated successfully', success: true, results };
    
    // Update cache
    usStocksCache = finalResult;
    usStocksCacheTimestamp = Date.now();
    
    return NextResponse.json(finalResult);

  } catch (error) {
    console.error("Error updating US stock prices:", error);
    const errorResult = { message: 'Internal server error', success: false };
    usStocksCache = errorResult;
    usStocksCacheTimestamp = Date.now();
    return NextResponse.json(errorResult, { status: 500 });
  }
}