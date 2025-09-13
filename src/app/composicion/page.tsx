// src/app/composicion/page.tsx
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  DocumentData,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Tiempo de cache en milisegundos (5 minutos)
const CACHE_DURATION = 5 * 60 * 1000;

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#d0ed57",
  "#ff6b6b",
  "#4ecdc4",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-xs">
        <p className="font-semibold text-gray-900 dark:text-white">
          {data.name}
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          {data.clpValue.toLocaleString("es-CL", {
            style: "currency",
            currency: "CLP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}{" "}
          CLP
        </p>
        <p className="text-gray-500 dark:text-gray-400">
          {data.value.toFixed(2)}% del portafolio
        </p>
      </div>
    );
  }
  return null;
};

export default function Composicion() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [portfolioPositions, setPortfolioPositions] = useState<
    DocumentData[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.id) {
        setIsLoading(true);
        try {
          const cachedComposition = localStorage.getItem(
            `composition_${user.id}`
          );
          const cachedCompositionTime = localStorage.getItem(
            `compositionTime_${user.id}`
          );

          if (cachedComposition && cachedCompositionTime) {
            const cacheTime = parseInt(cachedCompositionTime);
            const now = Date.now();

            if (now - cacheTime < CACHE_DURATION) {
              const cachedData = JSON.parse(cachedComposition);
              setPortfolioPositions(cachedData.positions);
              setTotalPortfolioValue(cachedData.totalValue);
              setIsLoading(false);
              return;
            }
          }

          const exchangeRateDocRef = doc(db, "exchangerate", "USD_CLP");
          const exchangeRateDocSnap = await getDoc(exchangeRateDocRef);
          const exchangeRate = exchangeRateDocSnap.exists()
            ? exchangeRateDocSnap.data().value
            : 1;

          const portfolioRef = collection(db, "users", user.id, "portfolio");
          const portfolioSnapshot = await getDocs(portfolioRef);

          const stockpricesRef = collection(db, "stockprices");
          const stockpricesSnapshot = await getDocs(stockpricesRef);
          const stockpricesData: Record<string, any> =
            stockpricesSnapshot.docs.reduce((acc, doc) => {
              return {
                ...acc,
                [doc.id]: doc.data(),
              };
            }, {});

          const positions: DocumentData[] = [];
          let totalPortfolioValueInCLP = 0;

          portfolioSnapshot.forEach((doc) => {
            const positionData = doc.data();
            const ticker = positionData.ticker;

            let marketValue = 0;
            if (
              stockpricesData[ticker] &&
              stockpricesData[ticker].lastprice
            ) {
              marketValue =
                stockpricesData[ticker].lastprice *
                positionData.quantity;
            } else {
              marketValue = positionData.buyprice * positionData.quantity;
            }

            let marketValueInCLP = marketValue;
            if (positionData.market === "US") {
              marketValueInCLP = marketValue * exchangeRate;
            }

            totalPortfolioValueInCLP += marketValueInCLP;

            const totalCost = positionData.buyprice * positionData.quantity;
            let profitPercentage = 0;
            if (totalCost > 0) {
              profitPercentage =
                ((marketValue - totalCost) / totalCost) * 100;
            }

            positions.push({
              id: doc.id,
              marketValue,
              marketValueInCLP,
              profitPercentage,
              ...positionData,
            });
          });

          const finalPositions = positions.map((position) => ({
            ...position,
            percentage:
              (position.marketValueInCLP / totalPortfolioValueInCLP) * 100,
          }));

          setPortfolioPositions(finalPositions);
          setTotalPortfolioValue(totalPortfolioValueInCLP);

          const cacheData = {
            positions: finalPositions,
            totalValue: totalPortfolioValueInCLP,
          };
          localStorage.setItem(
            `composition_${user.id}`,
            JSON.stringify(cacheData)
          );
          localStorage.setItem(
            `compositionTime_${user.id}`,
            Date.now().toString()
          );
        } catch (error) {
          console.error("Error al obtener los datos:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (!isAuthLoading) {
      fetchData();
    }
  }, [user, isAuthLoading]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`;
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Cargando composición...
          </p>
        </div>
      </div>
    );
  }

  const chartData = portfolioPositions.map((p) => ({
    name: p.ticker,
    value: p.percentage,
    clpValue: p.marketValueInCLP,
    market: p.market,
  }));

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                Composición del Portafolio
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 sm:text-sm">
                Análisis detallado de posiciones
              </p>
            </div>
            <div className="text-left sm:text-right mt-2 sm:mt-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                Valor total
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                {formatCurrency(totalPortfolioValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:gap-6">
          {/* Gráfico de Distribución */}
          <div className="w-full sm:w-1/2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                  Distribución de Activos
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full sm:w-3 sm:h-3"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                    Acciones
                  </span>
                </div>
              </div>

              {chartData.length > 0 ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
                        labelLine={false}
                        label={({
                          cx,
                          cy,
                          midAngle,
                          outerRadius,
                          percent,
                        }: any) => {
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius + 10;
                          const x =
                            cx + radius * Math.cos(-midAngle * RADIAN);
                          const y =
                            cy + radius * Math.sin(-midAngle * RADIAN);
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="#ffffff"
                              textAnchor={x > cx ? "start" : "end"}
                              dominantBaseline="central"
                              style={{
                                fontSize: 12,
                                fontWeight: "bold",
                              }}
                            >
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                        }}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            stroke="#fff"
                            strokeWidth={1}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ fontSize: "10px" }}
                        formatter={(value) => (
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    No hay datos para mostrar
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lista de Posiciones */}
          <div className="w-full sm:w-1/2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                  Detalle de Posiciones
                </h2>
                <span className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                  {portfolioPositions.length} activos
                </span>
              </div>

              <div className="space-y-3">
                {portfolioPositions.length > 0 ? (
                  portfolioPositions.map((position) => (
                    <div
                      key={position.id}
                      className="border border-gray-100 dark:border-gray-600 rounded-lg p-3 hover:shadow-md transition-shadow"
                    >
                      {/* Header Móvil */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              position.market === "US"
                                ? "bg-blue-500"
                                : "bg-green-500"
                            }`}
                          ></div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                              {position.name}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {position.ticker} • {position.quantity} acc
                            </p>
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {position.percentage
                              ? position.percentage.toFixed(1)
                              : 0}
                            %
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {position.market === "US" ? "USD" : "CLP"}
                          </p>
                        </div>
                      </div>

                      {/* Contenido Principal */}
                      <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">
                            Valor mercado:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white text-right">
                            {position.market === "US"
                              ? formatUSD(position.marketValue)
                              : formatCurrency(position.marketValue)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">
                            Rendimiento:
                          </span>
                          <span
                            className={`font-medium ${
                              position.profitPercentage >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {formatPercentage(position.profitPercentage)}
                          </span>
                        </div>

                        {position.market === "US" && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                              Valor CLP:
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                              {formatCurrency(position.marketValueInCLP)}
                            </span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-gray-100 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Precio prom:{" "}
                            {position.market === "US"
                              ? formatUSD(position.buyprice)
                              : formatCurrency(position.buyprice)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-6 h-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No hay posiciones en el portafolio
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}