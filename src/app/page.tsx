import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import ClientDashboard from "./components/ClientDashboard";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function Home() {
  const exchangeRateDocRef = doc(db, "exchangerate", "USD_CLP");
  let exchangeRateValue: number | null = null;
  const resolvedHeaders = await headers();
  const host = resolvedHeaders.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  try {
    // Llama a las APIs de actualización en paralelo
    const [exchangeRateResponse, usStocksResponse, chileStocksResponse] =
      await Promise.all([
        fetch(`${protocol}://${host}/api/update-exchange-rate`, { cache: "no-store" }),
        fetch(`${protocol}://${host}/api/update-us-stocks`, { cache: "no-store" }),
        // Llama a la nueva API de scraping para la bolsa de Chile
        fetch(`${protocol}://${host}/api/scrap-bcs`, { cache: "no-store" }),
      ]);

    const exchangeRateData = await exchangeRateResponse.json();
    if (exchangeRateData.success) {
      exchangeRateValue = exchangeRateData.value;
    } else {
      console.error("No se pudo actualizar el tipo de cambio desde la API.");
      const exchangeRateDocSnap = await getDoc(exchangeRateDocRef);
      if (exchangeRateDocSnap.exists()) {
        exchangeRateValue = exchangeRateDocSnap.data().value;
      }
    }
    
    // Registra los resultados de las actualizaciones de acciones
    const usStocksData = await usStocksResponse.json();
    console.log("US Stock Update Result:", usStocksData);

    const chileStocksData = await chileStocksResponse.json();
    console.log("Chile Stock Update Result:", chileStocksData);

  } catch (error) {
    console.error("Error al llamar a las APIs de actualización:", error);
    const exchangeRateDocSnap = await getDoc(exchangeRateDocRef);
    if (exchangeRateDocSnap.exists()) {
      exchangeRateValue = exchangeRateDocSnap.data().value;
    }
  }

  return (
    <div className="min-h-full">
      <ClientDashboard exchangeRate={exchangeRateValue ?? 0} />
    </div>
  );
}