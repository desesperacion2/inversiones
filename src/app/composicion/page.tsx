"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { collection, getDocs, doc, getDoc, DocumentData } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../contexts/AuthContext"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

// Tiempo de cache en milisegundos (5 minutos)
const CACHE_DURATION = 5 * 60 * 1000

export default function Composicion() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [portfolioPositions, setPortfolioPositions] = useState<DocumentData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.id) {
        setIsLoading(true)
        try {
          // ✅ CHECK CACHE PARA COMPOSICIÓN
          const cachedComposition = localStorage.getItem(`composition_${user.id}`)
          const cachedCompositionTime = localStorage.getItem(`compositionTime_${user.id}`)
          
          if (cachedComposition && cachedCompositionTime) {
            const cacheTime = parseInt(cachedCompositionTime)
            const now = Date.now()
            
            if (now - cacheTime < CACHE_DURATION) {
              // Usar datos cacheados
              setPortfolioPositions(JSON.parse(cachedComposition))
              setIsLoading(false)
              return // ← Salir temprano, no hacer fetch
            }
          }

          // ✅ OBTENER DATOS NUEVOS
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

          // ✅ GUARDAR EN CACHE
          localStorage.setItem(`composition_${user.id}`, JSON.stringify(finalPositions))
          localStorage.setItem(`compositionTime_${user.id}`, Date.now().toString())

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

  const chartData = portfolioPositions.map(p => ({
    name: p.ticker,
    value: p.percentage,
    clpValue: p.marketValueInCLP
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

          <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg p-6 flex flex-col items-center justify-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribución por Activo</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label={({ name, value }) => `${name}: ${typeof value === 'number' ? value.toFixed(2) : '0.00'}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(_, name, props: any) => [
                      formatCurrency(props.payload.clpValue),
                      name
                    ]} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg w-full">
                <p className="text-gray-600 dark:text-gray-400">Sin datos para mostrar el gráfico.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}