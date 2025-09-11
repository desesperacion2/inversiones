"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, DocumentData } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../contexts/AuthContext"

type ClientDashboardProps = {
  exchangeRate: number
}

export default function ClientDashboard({ exchangeRate }: ClientDashboardProps) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 0,
    totalGainLoss: 0,
    totalInvested: 0,
    gainLossPercentage: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.id) {
        setIsLoading(true)
        try {
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

          let totalValue = 0
          let totalInvested = 0

          portfolioSnapshot.forEach((doc) => {
            const positionData = doc.data()
            const ticker = positionData.ticker
            
            const cost = positionData.buyprice * positionData.quantity
            let marketValue = 0
            if (stockpricesData[ticker] && stockpricesData[ticker].lastprice) {
              marketValue = stockpricesData[ticker].lastprice * positionData.quantity
            } else {
              marketValue = cost
            }

            if (positionData.market === "US") {
              totalValue += marketValue * exchangeRate
              totalInvested += cost * exchangeRate
            } else {
              totalValue += marketValue
              totalInvested += cost
            }
          })

          const totalGainLoss = totalValue - totalInvested
          let gainLossPercentage = 0
          if (totalInvested > 0) {
            gainLossPercentage = (totalGainLoss / totalInvested) * 100
          }

          setPortfolioData({
            totalValue,
            totalGainLoss,
            totalInvested,
            gainLossPercentage,
          })

        } catch (error) {
          console.error("Error fetching data:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (!isAuthLoading && exchangeRate) {
      fetchData()
    }
  }, [user, isAuthLoading, exchangeRate])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`
  }

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <p className="text-gray-600 dark:text-gray-400">Cargando datos del portafolio...</p>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="px-4 py-3 md:px-6 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Mi Portafolio de Inversiones
              </h1>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Seguimiento en tiempo real de tus inversiones
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-6 md:px-6 md:py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Total Portfolio Value */}
          <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg p-4 md:p-6">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                Valor Total del Portafolio (CLP)
              </h3>
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(portfolioData.totalValue)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Valor actual de todas tus inversiones</p>
          </div>

          {/* Gain/Loss */}
          <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg p-4 md:p-6">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">Ganancia/Pérdida Total (CLP)</h3>
            </div>
            <div
              className={`text-xl md:text-2xl font-bold ${portfolioData.totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(portfolioData.totalGainLoss)}
            </div>
            <p
              className={`text-xs font-medium mt-1 ${portfolioData.gainLossPercentage >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatPercentage(portfolioData.gainLossPercentage)} desde el inicio
            </p>
          </div>

          {/* Total Invested */}
          <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg p-4 md:p-6">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">Capital Invertido (CLP)</h3>
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(portfolioData.totalInvested)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total de capital inicial invertido</p>
          </div>
        </div>
      </div>
    </div>
  )
}