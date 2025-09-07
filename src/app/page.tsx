export default function Dashboard() {
  const portfolioData = {
    totalValue: 125750500,
    totalGainLoss: 8250500,
    totalInvested: 117500000,
    gainLossPercentage: 7.02,
  }

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

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Portafolio de Inversiones</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Seguimiento en tiempo real de tus inversiones
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-blue-600 rounded"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Portfolio Value */}
          <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Valor Total del Portafolio</h3>
              <div className="h-4 w-4 bg-blue-600 rounded"></div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(portfolioData.totalValue)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Valor actual de todas tus inversiones</p>
          </div>

          {/* Gain/Loss */}
          <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Ganancia/Pérdida Total</h3>
              <div
                className={`h-4 w-4 rounded ${portfolioData.totalGainLoss >= 0 ? "bg-green-600" : "bg-red-600"}`}
              ></div>
            </div>
            <div
              className={`text-2xl font-bold ${portfolioData.totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}
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
          <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Capital Invertido</h3>
              <div className="h-4 w-4 bg-amber-600 rounded"></div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(portfolioData.totalInvested)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total de capital inicial invertido</p>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg p-6">
          <div className="pb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resumen de Rendimiento</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Rendimiento Total</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Desde el inicio de las inversiones</p>
              </div>
              <div className="text-right">
                <p
                  className={`text-lg font-bold ${portfolioData.gainLossPercentage >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatPercentage(portfolioData.gainLossPercentage)}
                </p>
                <p className={`text-sm ${portfolioData.totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(portfolioData.totalGainLoss)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(portfolioData.totalInvested)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Invertido</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(portfolioData.totalValue)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Valor Actual</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
