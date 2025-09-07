export default function Composicion() {
  // Mock data para las posiciones del portafolio
  const portfolioComposition = [
    { symbol: "AAPL", name: "Apple Inc.", shares: 150, currentPrice: 175.5, totalValue: 26325, percentage: 20.9 },
    { symbol: "GOOGL", name: "Alphabet Inc.", shares: 80, currentPrice: 142.3, totalValue: 11384, percentage: 9.1 },
    { symbol: "MSFT", name: "Microsoft Corp.", shares: 120, currentPrice: 378.85, totalValue: 45462, percentage: 36.2 },
    { symbol: "TSLA", name: "Tesla Inc.", shares: 60, currentPrice: 248.5, totalValue: 14910, percentage: 11.9 },
    { symbol: "NVDA", name: "NVIDIA Corp.", shares: 40, currentPrice: 875.3, totalValue: 35012, percentage: 27.9 },
  ]

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

  return (
    <div className="min-h-full">
      {/* Header */}
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

      {/* Main Content */}
      <div className="px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Portfolio Positions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Posiciones Actuales</h2>
            {portfolioComposition.map((position) => (
              <div
                key={position.symbol}
                className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{position.symbol}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{position.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{position.percentage}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatUSD(position.totalValue)}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{position.shares} acciones</span>
                  <span>{formatUSD(position.currentPrice)} por acción</span>
                </div>
              </div>
            ))}
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
