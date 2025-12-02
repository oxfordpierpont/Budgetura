![screenshot](assets/images/Budgetura-Dashboard.png)

# Budgetura - React Debt Management Application

**Version:** 2.0.0
**Author:** Oxford Pierpont
**Requires:** Node.js 18+
**License:** GPL-2.0+

## Description

Budgetura is a comprehensive debt management and financial tracking application built with React. It helps users track credit cards, loans, mortgages, bills, and financial goals over multiple years with powerful calculation tools and progress tracking.

## Features

### Core Features

- **6 Financial Data Types:**
  - Credit Cards
  - Loans
  - Mortgages
  - Bills
  - Goals
  - Financial Snapshots

- **Core Calculations Engine:**
  - Credit card payoff calculations
  - Loan amortization
  - Mortgage calculations
  - DTI (Debt-to-Income) ratio
  - Credit utilization
  - Bill frequency conversion

- **Data Management:**
  - Dashboard overview with real-time statistics
  - Credit cards, loans, bills, and goals tracking
  - Payoff scenario calculations
  - Snapshot creation for progress tracking
  - Debt avalanche & snowball ordering strategies

- **Modern UI:**
  - Responsive design with Tailwind CSS
  - Interactive charts with Recharts
  - Mobile-friendly interface
  - Print-optimized views

## Technical Stack

- **React:** 19
- **TypeScript:** 5.x
- **Vite:** Latest
- **Tailwind CSS:** 3.x
- **Recharts:** 2.x
- **Node.js:** 18+

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Setup

```bash
# Clone the repository
git clone https://github.com/oxfordpierpont/budgetura.git

# Navigate to project directory
cd budgetura

# Install dependencies
npm install
# or
yarn install

# Start development server
npm run dev
# or
yarn dev

# Build for production
npm run build
# or
yarn build
```

## Usage

### Basic Setup

1. Launch the application
2. Navigate to Settings to configure your preferences
3. Add your credit cards, loans, and bills through the dashboard
4. View your financial overview and track progress

### For Users

Users can:
- Track multiple credit cards, loans, and mortgages
- Monitor recurring bills and expenses
- Set and track financial goals
- Create monthly snapshots to track progress over time
- View debt payoff projections with interactive charts
- Calculate different payoff scenarios (Avalanche vs Snowball)
- Export reports and visualizations

## File Structure

```
budgetura/
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   ├── CreditCards/
│   │   ├── Loans/
│   │   ├── Bills/
│   │   ├── Goals/
│   │   ├── Snapshots/
│   │   └── Shared/
│   ├── utils/
│   │   ├── calculations.ts        # Calculation engine
│   │   └── helpers.ts
│   ├── types/
│   │   └── index.ts                # TypeScript definitions
│   ├── hooks/
│   │   └── useFinancialData.ts
│   ├── context/
│   │   └── FinancialContext.tsx
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## State Management

The application uses React Context API and custom hooks for state management:

- `FinancialContext` - Global financial data and methods
- `useFinancialData` - Custom hook for accessing financial calculations
- Local component state for UI interactions

## Calculations

### Credit Card Payoff

Uses the standard credit card payoff formula:
```
n = -log(1 - (B * r / P)) / log(1 + r)
```
Where: B = balance, r = monthly rate, P = monthly payment

### Loan Payment

Uses the amortization formula:
```
P = L[c(1 + c)^n]/[(1 + c)^n - 1]
```
Where: L = principal, c = monthly rate, n = term in months

### DTI Ratio

```
DTI = (Total Monthly Debt Payments / Monthly Income) × 100
```

### Credit Utilization

```
Utilization = (Total Balances / Total Credit Limits) × 100
```

## Data Visualization

Budgetura uses Recharts for interactive data visualization:

- Debt payoff timeline charts
- Credit utilization graphs
- Net worth progression
- Goal tracking progress bars
- Monthly expense breakdowns

## Upcoming Features (Phase 2+)

- [ ] Backend API integration
- [ ] User authentication and multi-user support
- [ ] Push notifications for bill reminders
- [ ] Automated data import from financial institutions
- [ ] Advanced debt action plan generator
- [ ] PDF export functionality
- [ ] Mobile app (React Native)
- [ ] AI-powered financial insights

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_APP_TITLE=Budgetura
VITE_API_URL=your_api_url_here
```

## Changelog

### 2.0.0 - React Migration (2025-11-30)
- Complete migration from WordPress to React
- TypeScript implementation for type safety
- Modern UI with Tailwind CSS
- Interactive charts with Recharts
- Vite build system for optimal performance
- Enhanced calculation engine
- Improved user experience and navigation

### 1.0.0 - Phase 1 (2025-10-22)
- Initial WordPress plugin release
- Complete plugin foundation with 6 Custom Post Types
- Core calculations engine
- REST API implementation
- Admin and public dashboards

## Support

For support, please contact: support@oxfordpierpont.com

## License

This application is licensed under the GPL-2.0+ license.
