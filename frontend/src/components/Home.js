import StockService from '../services/api.js';

class Home {
    constructor() {
        this.portfolioData = null;
        this.isLoading = true;
        this.initialize();
    }

    async initialize() {
        await this.loadPortfolioData();
    }

    async loadPortfolioData() {
        try {
            this.isLoading = true;
            this.render();
            const data = await StockService.getPortfolioData();
            this.portfolioData = this.calculatePortfolioMetrics(data);
            this.isLoading = false;
            this.render();
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.isLoading = false;
            this.render();
        }
    }

    calculatePortfolioMetrics(data) {
        const { prices, holdings } = data;
        const portfolio = {
            holdings: [],
            summary: {
                totalHoldings: 0,
                dayChange: 0,
                totalGain: 0
            }
        };

        for (const [symbol, price] of Object.entries(prices)) {
            if (typeof price === 'number' && holdings[symbol]) {
                const { shares, costBasis } = holdings[symbol];
                const marketValue = shares * price;
                const totalCost = shares * costBasis;
                const dayChange = (price - costBasis) * shares;
                const totalGain = marketValue - totalCost;
                const totalGainPercentage = ((marketValue / totalCost) - 1) * 100;

                portfolio.holdings.push({
                    symbol,
                    shares,
                    lastPrice: price,
                    costBasis,
                    totalCost,
                    marketValue,
                    totalGain,
                    totalGainPercentage
                });

                portfolio.summary.totalHoldings += marketValue;
                portfolio.summary.dayChange += dayChange;
                portfolio.summary.totalGain += totalGain;
            }
        }

        return portfolio;
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0,
        }).format(value);
    }

    formatPercentage(value) {
        return new Intl.NumberFormat('es-CL', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value / 100);
    }

    render() {
        const mainContainer = document.getElementById('root');
        if (this.isLoading) {
            mainContainer.innerHTML = `
                <div class="container mt-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Cargando...</span>
                            </div>
                            <h3 class="mt-3">Cargando datos del portfolio...</h3>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        mainContainer.innerHTML = `
            <div class="container mt-4">
                <div class="card mb-4">
                    <div class="card-header bg-primary text-white">
                        <h2 class="mb-0">Resumen del Portfolio</h2>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <h5>Total Holdings</h5>
                                <h3>${this.formatCurrency(this.portfolioData.summary.totalHoldings)}</h3>
                            </div>
                            <div class="col-md-4">
                                <h5>Day Change</h5>
                                <h3 class="${this.portfolioData.summary.dayChange >= 0 ? 'text-success' : 'text-danger'}">
                                    ${this.formatCurrency(this.portfolioData.summary.dayChange)}
                                </h3>
                            </div>
                            <div class="col-md-4">
                                <h5>Total Gain/Loss</h5>
                                <h3 class="${this.portfolioData.summary.totalGain >= 0 ? 'text-success' : 'text-danger'}">
                                    ${this.formatCurrency(this.portfolioData.summary.totalGain)}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h2 class="mb-0">Holdings</h2>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Symbol</th>
                                        <th class="text-end">Shares</th>
                                        <th class="text-end">Last Price</th>
                                        <th class="text-end">Cost Basis</th>
                                        <th class="text-end">Total Cost</th>
                                        <th class="text-end">Market Value</th>
                                        <th class="text-end">Total Gain/Loss</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.portfolioData.holdings.map(holding => `
                                        <tr>
                                            <td>${holding.symbol}</td>
                                            <td class="text-end">${holding.shares}</td>
                                            <td class="text-end">${this.formatCurrency(holding.lastPrice)}</td>
                                            <td class="text-end">${this.formatCurrency(holding.costBasis)}</td>
                                            <td class="text-end">${this.formatCurrency(holding.totalCost)}</td>
                                            <td class="text-end">${this.formatCurrency(holding.marketValue)}</td>
                                            <td class="text-end ${holding.totalGain >= 0 ? 'text-success' : 'text-danger'}">
                                                ${this.formatCurrency(holding.totalGain)} (${this.formatPercentage(holding.totalGainPercentage)})
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

export default Home;

