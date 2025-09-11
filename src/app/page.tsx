import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import ClientDashboard from "./components/ClientDashboard";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function Home() {
  const exchangeRateDocRef = doc(db, "exchangerate", "USD_CLP");
  let exchangeRateValue: number | null = null;

  try {

    const resolvedHeaders = await headers();
    const host = resolvedHeaders.get("host");
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

    const apiResponse = await fetch(`${protocol}://${host}/api/update-exchange-rate`, { cache: "no-store" });
    const data = await apiResponse.json();

    if (data.success) {
      exchangeRateValue = data.value;
    } else {
      console.error("No se pudo actualizar el tipo de cambio desde la API.");
      const exchangeRateDocSnap = await getDoc(exchangeRateDocRef);
      if (exchangeRateDocSnap.exists()) {
        exchangeRateValue = exchangeRateDocSnap.data().value;
      }
    }
  } catch (error) {
    console.error("Error al llamar a la API de actualización:", error);
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
