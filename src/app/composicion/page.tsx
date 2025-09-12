"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { collection, getDocs, doc, getDoc, DocumentData } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../contexts/AuthContext"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

// Tiempo de cache en milisegundos (5 minutos)
const CACHE_DURATION = 5 * 60 * 1000

export default function Composicion() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [portfolioPositions, setPortfolioPositions] = useState<DocumentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0)

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
              const cachedData = JSON.parse(cachedComposition)
              setPortfolioPositions(cachedData.positions)
              setTotalPortfolioValue(cachedData.totalValue)
              setIsLoading(false)
              return
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

          setPortfolioPositions(finalPositions)
          setTotalPortfolioValue(totalPortfolioValueInCLP)

          // ✅ GUARDAR EN CACHE
          const cacheData = {
            positions: finalPositions,
            totalValue: totalPortfolioValueInCLP
          }
          localStorage.setItem(`composition_${user.id}`, JSON.stringify(cacheData))
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

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`
  }

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando composición del portafolio...</p>
        </div>
      </div>
    )
  }

  const chartData = portfolioPositions.map(p => ({
    name: p.ticker,
    value: p.percentage,
    clpValue: p.marketValueInCLP,
    market: p.market
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#ff6b6b', '#4ecdc4'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {formatCurrency(data.clpValue)} CLP
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {data.value.toFixed(2)}% del portafolio
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Composición del Portafolio
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Análisis detallado de las posiciones y distribución de activos
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor total del portafolio</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalPortfolioValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Gráfico de Distribución */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Distribución de Activos
              </h2>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Acciones</span>
              </div>
            </div>
            
            {chartData.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      innerRadius={60}
                      paddingAngle={2}
                      labelLine={false}
                      label={({ value }) => (typeof value === "number" ? `${value.toFixed(1)}%` : `${value}%`)}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry: any) => (
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  No hay datos disponibles para mostrar el gráfico
                </p>
              </div>
            )}
          </div>

          {/* Lista de Posiciones */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detalle de Posiciones
              </h2>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {portfolioPositions.length} activos
              </span>
            </div>

            <div className="space-y-4">
              {portfolioPositions.length > 0 ? (
                portfolioPositions.map((position) => (
                  <div
                    key={position.id}
                    className="border border-gray-100 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          position.market === "US" ? "bg-blue-500" : "bg-green-500"
                        }`}></div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {position.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {position.ticker} • {position.quantity} acciones
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {position.percentage ? position.percentage.toFixed(2) : 0}%
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {position.market === "US" ? "USD" : "CLP"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-1">Valor de mercado</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {position.market === "US"
                            ? formatUSD(position.marketValue)
                            : formatCurrency(position.marketValue)}
                        </p>
                        {position.market === "US" && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ({formatCurrency(position.marketValueInCLP)})
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-1">Rendimiento</p>
                        <p className={`font-medium ${
                          position.profitPercentage >= 0 
                            ? "text-green-600 dark:text-green-400" 
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          {formatPercentage(position.profitPercentage)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Precio promedio: {position.market === "US"
                          ? formatUSD(position.buyprice)
                          : formatCurrency(position.buyprice)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay posiciones en el portafolio
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}