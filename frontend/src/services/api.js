class StockService {
  static async getPortfolioData() {
      try {
          const response = await fetch('http://localhost:5000/api/portfolio');
          if (!response.ok) {
              throw new Error('Error en la respuesta del servidor');
          }
          return await response.json();
      } catch (error) {
          console.error('Error al obtener datos del portfolio:', error);
          throw error;
      }
  }
}

export default StockService;
