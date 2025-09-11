import { NextResponse } from 'next/server';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

export async function GET() {
  try {
    const apiKey = '8AJJZYE8ELY517IL'; // Tu API Key implementada directamente en el código

    // 1. Get a list of unique US stock tickers from the 'users' collection
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
      return NextResponse.json({ message: 'No US stocks to update', success: true });
    }

    // 2. Fetch the latest price for each ticker
    const updatePromises = Array.from(usTickers).map(async (ticker) => {
      const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`);
      const data = await response.json();

      const globalQuote = data['Global Quote'];
      if (globalQuote && globalQuote['05. price']) { // Se usa '05. price' para verificar que la data es válida
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
    return NextResponse.json({ message: 'US stocks updated successfully', success: true, results });

  } catch (error) {
    console.error("Error updating US stock prices:", error);
    return NextResponse.json({ message: 'Internal server error', success: false }, { status: 500 });
  }
}