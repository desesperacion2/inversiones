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
    // Call both update APIs in parallel
    const [exchangeRateResponse, usStocksResponse] = await Promise.all([
      fetch(`${protocol}://${host}/api/update-exchange-rate`, { cache: "no-store" }),
      fetch(`${protocol}://${host}/api/update-us-stocks`, { cache: "no-store" })
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
    
    // Log the result of the US stocks update
    const usStocksData = await usStocksResponse.json();
    console.log("US Stock Update Result:", usStocksData);

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