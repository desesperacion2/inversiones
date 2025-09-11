'use client'; // Esto lo declara como un componente de cliente

import { useState, useEffect } from 'react';

// Define la interfaz para los resultados de la API
interface ScrapingResult {
  ticker: string;
  success: boolean;
  message?: string;
  price?: number;
}

// Define la interfaz para la respuesta completa de la API
interface ApiResponse {
  message: string;
  success: boolean;
  results: ScrapingResult[];
}

export default function TestScraperPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/scrap-bcs');
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const result: ApiResponse = await response.json();
        setData(result);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar el componente

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Probando el Scraper de la Bolsa de Santiago...</h1>
        <p>Cargando datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', color: 'red' }}>
        <h1>Error al probar el Scraper</h1>
        <p>Hubo un error al llamar a la API: {error}</p>
        <p>Revisa la consola del navegador y la terminal para más detalles.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Resultados del Scraper de Acciones Chilenas</h1>
      <p>Mensaje de la API: **{data?.message}**</p>
      
      <h2 style={{ marginTop: '20px' }}>Detalles de la Actualización</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {data?.results.map((result, index) => (
          <li key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: result.success ? '#e6f7e6' : '#f7e6e6' }}>
            <strong style={{ display: 'block' }}>Ticker: {result.ticker}</strong>
            <span style={{ color: result.success ? 'green' : 'red' }}>
              **Estado: {result.success ? 'Éxito ✅' : 'Error ❌'}**
            </span>
            {result.success && <p>Último Precio: **${result.price?.toLocaleString('es-CL')}**</p>}
            {result.message && <p>Mensaje: {result.message}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}