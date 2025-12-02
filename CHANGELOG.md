# Changelog

All notable changes to Budgetura will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2025-12-02

### Added
- **Plaid Bank Account Integration** - Connect and sync bank accounts
  - Database schema with three tables: `plaid_items`, `plaid_accounts`, `plaid_transactions`
  - Row Level Security (RLS) policies for all Plaid tables
  - Database migration file: `supabase/migrations/001_plaid_tables.sql`
  - Edge Functions for Plaid API integration (already existed, now documented)
  - TypeScript types for Plaid data models
  - Plaid operations in `src/lib/supabase/operations.ts`:
    - `createPlaidLinkToken()` - Initiates bank connection
    - `exchangePlaidToken()` - Completes connection
    - `getPlaidAccounts()` - Fetches connected accounts
    - `getPlaidItems()` - Fetches bank connections
    - `disconnectPlaidItem()` - Disconnects a bank
    - `deletePlaidItem()` - Deletes a bank connection
  - Frontend components:
    - `PlaidLink.tsx` - Button to connect bank accounts
    - `BankAccounts.tsx` - View to display and manage connected banks
  - Custom React hook: `usePlaid.ts` for managing Plaid data
  - Comprehensive deployment guide: `PLAID_DEPLOYMENT.md`
  - Implementation summary: `PLAID_IMPLEMENTATION_SUMMARY.md`

### Changed
- Added `react-plaid-link` dependency to `package.json`
- Updated TypeScript types to include Plaid interfaces

### Documentation
- Added step-by-step Plaid deployment instructions
- Created implementation checklist and testing guide
- Documented security considerations for bank account integration

---

## [2.1.3] - 2025-12-02

### Fixed
- **Dummy data generation error:** Fixed `loan_type_check` constraint violation
  - Changed dummy mortgage type from 'Mortgage' to 'Home Equity' to match database schema
  - Updated `addLoan` and `updateLoan` to convert spaces to underscores (e.g., 'Home Equity' → 'home_equity')
  - Dummy data generation now works correctly for all loan types

---

## [2.1.2] - 2025-12-02

### Fixed
- **Critical bug fix:** Clear All Data function was throwing `TypeError: t is not a function`
  - Exposed `refetch` function in DebtContext interface and provider value
  - Removed unsafe `as any` type assertion from SettingsView
  - Clear All Data now works correctly and refreshes the UI after deletion

---

## [2.1.1] - 2025-12-02

### Added
- **Clear All Data** functionality in Settings
  - New "Clear All Data" button to remove all financial records from the database
  - Confirmation dialog to prevent accidental data deletion
  - Deletes all credit cards, loans, bills, goals, and snapshots for the current user
- Warning note in Data Management section explaining dummy data vs real data

### Changed
- Renamed "Dummy Data" section to "Data Management" in Settings
- Improved button labels: "Generate Data" → "Generate Dummy Data"
- Added icons to data management buttons for better visual clarity
- Both generate and clear buttons are now disabled during operations

### Fixed
- **Dummy data confusion:** Users can now clearly differentiate between dummy test data and real financial data
- Users can now easily remove unwanted dummy data from their account

---

## [2.1.0] - 2025-12-02

### Fixed
- **Critical deployment fix:** Black screen issue on Dokploy deployment
  - Updated Dockerfile to accept build arguments for Vite environment variables
  - Vite now correctly receives VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY at build time
  - Environment variables are properly bundled into the JavaScript during build

### Added
- Comprehensive deployment documentation for Dokploy with build arguments
- DOKPLOY-BLACK-SCREEN-FIX.md quick reference guide
- Build argument configuration instructions in deployment guides

### Changed
- Dockerfile now uses ARG and ENV directives for build-time environment variables
- Updated .github/DEPLOYMENT.md with critical build argument instructions
- Updated DEPLOYMENT.md with troubleshooting section for black screen issues

### Documentation
- Added detailed explanation of Vite build-time vs runtime environment variables
- Added step-by-step Dokploy configuration instructions
- Added verification checklist for successful deployment

---

## [2.0.0] - 2025-11-30

### Added
- Complete migration from WordPress to React
- TypeScript implementation for type safety
- Modern UI with Tailwind CSS
- Interactive charts with Recharts
- Vite build system for optimal performance
- Enhanced calculation engine
- Supabase authentication integration
- Protected routes with authentication guards
- User profile management
- React Query for data fetching and caching

### Changed
- Improved user experience and navigation
- Responsive design optimized for all devices
- Modernized component architecture

---

## [1.0.0] - 2025-10-22

### Added
- Initial WordPress plugin release
- Complete plugin foundation with 6 Custom Post Types:
  - Credit Cards
  - Loans
  - Mortgages
  - Bills
  - Goals
  - Financial Snapshots
- Core calculations engine:
  - Credit card payoff calculations
  - Loan amortization
  - Mortgage calculations
  - DTI (Debt-to-Income) ratio
  - Credit utilization
  - Bill frequency conversion
- REST API implementation
- Admin dashboard
- Public-facing dashboard
- Basic data visualization

---

## Version History

- **2.1.0** - Dokploy deployment fixes and documentation
- **2.0.0** - React migration with Supabase
- **1.0.0** - Initial WordPress plugin release

---

[2.1.0]: https://github.com/oxfordpierpont/Budgetura/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/oxfordpierpont/Budgetura/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/oxfordpierpont/Budgetura/releases/tag/v1.0.0
