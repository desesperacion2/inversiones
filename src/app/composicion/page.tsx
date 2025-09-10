"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { collection, getDocs, doc, getDoc, DocumentData } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../contexts/AuthContext"

export default function Composicion() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [portfolioPositions, setPortfolioPositions] = useState<DocumentData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.id) {
        setIsLoading(true)
        try {
          const exchangeRateDocRef = doc(db, "exchangerate", "USD_CLP")
          const exchangeRateDocSnap = await getDoc(exchangeRateDocRef)
          const exchangeRate = exchangeRateDocSnap.exists() ? exchangeRateDocSnap.data().value : 1
          
          const portfolioRef = collection(db, "users", user.id, "portfolio")
          const portfolioSnapshot = await getDocs(portfolioRef)

          const stockpricesRef = collection(db, "stockprices")
          const stockpricesSnapshot = await getDocs(stockpricesRef)
          const stockpricesData: Record<string, any> = stockpricesSnapshot.docs.reduce((acc, doc) => {
            return {
              ...acc,
              [doc.id]: doc.data()
            }
          }, {})

          const positions: DocumentData[] = []
          let totalPortfolioValueInCLP = 0
          
          portfolioSnapshot.forEach((doc) => {
            const positionData = doc.data()
            const ticker = positionData.ticker
            
            let marketValue = 0
            if (stockpricesData[ticker] && stockpricesData[ticker].lastprice) {
              marketValue = stockpricesData[ticker].lastprice * positionData.quantity
            } else {
              marketValue = positionData.buyprice * positionData.quantity
            }

            let marketValueInCLP = marketValue;
            if (positionData.market === "US") {
              marketValueInCLP = marketValue * exchangeRate;
            }

            totalPortfolioValueInCLP += marketValueInCLP;

            const totalCost = positionData.buyprice * positionData.quantity;
            let profitPercentage = 0;
            if (totalCost > 0) {
              profitPercentage = ((marketValue - totalCost) / totalCost) * 100;
            }
            
            positions.push({
              id: doc.id,
              marketValue,
              marketValueInCLP,
              profitPercentage,
              ...positionData,
            });
          });
          
          const finalPositions = positions.map(position => ({
            ...position,
            percentage: (position.marketValueInCLP / totalPortfolioValueInCLP) * 100
          }));

          setPortfolioPositions(finalPositions);

        } catch (error) {
          console.error("Error al obtener los datos:", error)
        } finally {
          setIsLoading(false)
        }
      }
    };

    if (!isAuthLoading) {
      fetchData()
    }
  }, [user, isAuthLoading])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <p className="text-gray-600 dark:text-gray-400">Cargando datos...</p>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Composición del Portafolio</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Detalle de posiciones y distribución de activos
              </p>
            </div>
          </div>
        </div>
      </header>
      
      <div className="px-6 py-8">
        {/* Usamos grid-cols-2 en pantallas grandes para poner el gráfico a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Portfolio Positions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Posiciones Actuales</h2>
            {portfolioPositions.length > 0 ? (
              portfolioPositions.map((position) => (
                <div
                  key={position.id}
                  className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{position.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {position.quantity} acciones
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {position.percentage ? position.percentage.toFixed(2) : 0}%
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Valor de mercado: {
                          position.market === "US"
                            ? `${formatUSD(position.marketValue)} USD`
                            : `${formatCurrency(position.marketValue)} CLP`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      Precio promedio de compra: {
                        position.market === "US"
                          ? `${formatUSD(position.buyprice)} USD`
                          : `${formatCurrency(position.buyprice)} CLP`
                      }
                    </span>
                    <span>
                      Ganancia/Pérdida: {position.profitPercentage ? position.profitPercentage.toFixed(2) : '0'}%
                    </span>
                  </div>
                  {position.market === "US" && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
                      <span></span>
                      <span>
                        ({formatCurrency(position.marketValueInCLP)} CLP)
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center">No hay posiciones en el portafolio.</p>
            )}
          </div>

          {/* Pie Chart Placeholder */}
          <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribución por Activo</h2>
            <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                  />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">Gráfico de distribución</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Próximamente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}