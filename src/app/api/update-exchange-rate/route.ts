import { NextResponse } from 'next/server';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function GET() {
  try {
    const response = await fetch('https://v6.exchangerate-api.com/v6/6e8d67c491b0988f82c2c9ba/latest/USD'); 
    const data = await response.json();
    const usdToClp = data.conversion_rates.CLP;

    if (!usdToClp) {
      return NextResponse.json({ success: false, message: 'No se pudo obtener el tipo de cambio.' }, { status: 500 });
    }

    const exchangeRateDocRef = doc(db, 'exchangerate', 'USD_CLP');
    await setDoc(exchangeRateDocRef, {
      value: usdToClp,
      updatedat: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, value: usdToClp });
  } catch (error) {
    console.error("Error al actualizar el tipo de cambio:", error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor.' }, { status: 500 });
  }
}