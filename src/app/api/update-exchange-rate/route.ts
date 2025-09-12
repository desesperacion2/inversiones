import { NextResponse } from 'next/server';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

// Cached variables
let exchangeRateCache: { success: boolean; message?: string; value?: number } | null = null;
let exchangeRateCacheTimestamp = 0;
const CACHE_TTL = 900000; // 5 minutos

export async function GET() {
  // Return cached data if still fresh
  if (exchangeRateCache && Date.now() - exchangeRateCacheTimestamp < CACHE_TTL) {
    console.log("Devolviendo datos de caché para el tipo de cambio.");
    return NextResponse.json(exchangeRateCache);
  }

  try {
    const response = await fetch('https://v6.exchangerate-api.com/v6/6e8d67c491b0988f82c2c9ba/latest/USD'); 
    const data = await response.json();
    const usdToClp = data.conversion_rates.CLP;

    if (!usdToClp) {
      const errorResult = { success: false, message: 'No se pudo obtener el tipo de cambio.' };
      exchangeRateCache = errorResult;
      exchangeRateCacheTimestamp = Date.now();
      return NextResponse.json(errorResult, { status: 500 });
    }

    const exchangeRateDocRef = doc(db, 'exchangerate', 'USD_CLP');
    await setDoc(exchangeRateDocRef, {
      value: usdToClp,
      updatedat: new Date().toISOString(),
    });

    const finalResult = { success: true, value: usdToClp };
    
    // Update cache
    exchangeRateCache = finalResult;
    exchangeRateCacheTimestamp = Date.now();
    
    return NextResponse.json(finalResult);

  } catch (error) {
    console.error("Error al actualizar el tipo de cambio:", error);
    const errorResult = { success: false, message: 'Error interno del servidor.' };
    exchangeRateCache = errorResult;
    exchangeRateCacheTimestamp = Date.now();
    return NextResponse.json(errorResult, { status: 500 });
  }
}