"use client"

import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../../firebase"

export default function ClpRatePage() {
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const exchangeRateDocRef = doc(db, "exchangerate", "USD_CLP")
        const exchangeRateDocSnap = await getDoc(exchangeRateDocRef)

        if (exchangeRateDocSnap.exists()) {
          const data = exchangeRateDocSnap.data()
          setExchangeRate(data.value)
        } else {
          setError("No se encontraron datos para el tipo de cambio CLP/USD.")
        }
      } catch (err) {
        console.error("Error al obtener el tipo de cambio:", err)
        setError("Error al obtener los datos. Verifique la conexión a Firebase.")
      } finally {
        setLoading(false)
      }
    }

    fetchExchangeRate()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Valor Actual del Dólar (USD a CLP)</h1>
        <p className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
          ${exchangeRate?.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CLP
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Valor obtenido directamente desde la base de datos de Firebase.
        </p>
      </div>
    </div>
  )
}