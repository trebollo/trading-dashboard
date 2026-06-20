# Trebollo Trading Dashboard

A comprehensive trading dashboard for strategy analysis, backtesting, and comparison.

## Features

- **Pine Script Generator** - Create TradingView Pine Script v5 strategies from configuration
- **TradingView CSV Importer** - Import and parse backtest results from TradingView
- **25+ Metrics Calculator** - Calculate comprehensive performance metrics including:
  - Total Return, CAGR, Max Drawdown
  - Sharpe Ratio, Sortino Ratio, Calmar Ratio
  - Win Rate, Profit Factor, Risk/Reward Ratio
  - Average Trade, Largest Win/Loss
  - And many more...
- **Strategy Analyzer** - Get AI-powered recommendations and warnings for your strategies
- **Strategy Comparison** - Compare up to 5 strategies side by side

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/             # React components
│   └── ui/                 # Base UI components
├── lib/                    # Utility functions and business logic
└── types/                  # TypeScript type definitions
```

## Supported Futures Contracts

MNQ, MES, MYM, M2K, NQ, ES, YM, RTY

## License

MIT
