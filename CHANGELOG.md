# Changelog

All notable changes to Budgetura will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.0] - 2025-12-04

### Added
- **Billing & Subscription Section** - New section in Settings page
  - Current plan overview displaying active subscription (Plus Plan)
  - Payment method display showing VISA card ending in 4242
  - Available plans grid with 4 pricing tiers:
    - Free Plan ($0/month) - Manual tracking, 1 goal, basic reports
    - Basic Plan ($9/month) - Bank syncing (3 accounts), 5 goals, debt projections
    - Plus Plan ($19/month) - Unlimited accounts, AI coach, advanced analytics [CURRENT]
    - Premium Plan ($29/month) - All Plus features, live 1:1 coaching, priority support
  - Billing history table with downloadable invoices
  - Upgrade/downgrade action buttons for plan management
  - Responsive design for mobile, tablet, and desktop
  - Emerald-themed UI matching settings page aesthetics
  - Added `Check` and `Download` icons from lucide-react

### Technical Details
- Static UI implementation (no backend integration yet)
- Hardcoded plan data for demonstration purposes
- Button actions are placeholders pending payment processor integration
- Future integration will require Stripe/Paddle or similar payment service

---

## [2.4.1] - 2025-12-04

### Fixed
- **Goals navigation bug** - "See All" button in Goals Progress section now works
  - Added missing `onClick={() => onNavigate('goals')}` handler to the button in DashboardView.tsx
  - Button now properly navigates to the Goals Manager when clicked

- **Critical deployment issue** - App showing black screen/loading forever
  - Root cause: Supabase environment variables not being injected at build time
  - Fixed Dockerfile build process to accept `--build-arg` for VITE environment variables
  - Environment variables now properly baked into JavaScript bundle during build
  - Updated deployment process to pass build arguments with credentials

- **Browser caching preventing updates** - Changes not visible to users after deployment
  - Updated nginx.conf to disable caching for HTML files
  - HTML files now use `Cache-Control: no-store, no-cache` headers
  - Static assets (JS/CSS) still cached long-term via content-hash filenames
  - Ensures users always get the latest version without hard refresh

### Changed
- Enhanced error handling in index.tsx with visual error messages
- Changed index.html background from black to white for better error visibility
- Added comprehensive console logging for debugging React initialization
- Added loading indicator in root element while React loads

### Technical Details
- The black screen issue was caused by Vite requiring environment variables at build time, not runtime
- Docker service environment variables alone are insufficient for static JavaScript bundles
- Build-time injection via `--build-arg` is required for Vite to embed values in compiled code

---

## [2.4.0] - 2025-12-03

### Added
- **Mortgage Dummy Data Integration** - One-click generator now creates mortgage examples
  - Added `MORTGAGES` constant with 3 realistic mortgage scenarios:
    - Well-Managed: Bellevue family home (50% LTV, 3.25% rate, making extra payments)
    - Average: Redmond townhouse (74% LTV, 4.5% FHA rate, has PMI)
    - Near-Foreclosure: Tacoma condo (95% LTV, 6.75% variable rate, in forbearance)
  - Mortgages now generated alongside credit cards, loans, bills, and goals

### Fixed
- **Data Cleanup Bug** - `clearAllUserData` now properly deletes mortgages
  - Previously, mortgages were left behind when clearing all data
  - Updated confirmation dialog to mention mortgages in deletion list
  - Ensures complete data lifecycle management

### Changed
- Updated `generateDummyData.ts` to include mortgage insertion loop
- Added `Mortgage` type import to `constants.ts`
- Settings confirmation dialog now lists mortgages in data to be deleted

---

## [2.3.0] - 2025-12-02

### Added
- **Complete Mortgage Manager** - Full CRUD functionality for mortgages
  - Comprehensive mortgage tracking with property details
  - Advanced calculations: equity, LTV, total housing costs
  - Support for conventional, FHA, VA, USDA loans
  - PMI tracking with automatic removal threshold
  - Forbearance and foreclosure status tracking
  - Database schema: `mortgages` table with RLS policies
  - Migration file: `mortgages_table_migration.sql`

- **Enhanced Progress Tracking View**
  - Revamped debt tracking with category breakdowns
  - AI-powered financial insights
  - Improved debt visualization
  - Auto-expansion navigation from Progress Tracking modal

- **Redesigned Goal Manager**
  - Enhanced visualization for savings goals
  - Improved debt payoff tracking
  - Better progress indicators

- **Settings Page Enhancements**
  - Profile save functionality with validation
  - Password change with current password verification
  - Email change with confirmation flow
  - Avatar upload improvements:
    - Increased limit from 2MB to 10MB
    - Now uses Supabase Storage instead of base64
    - Proper image preview

### Fixed
- Progress Tracking modal Details button navigation
- localStorage quota exceeded errors during login
- BankingSummaryCard background color for improved visibility
- Sidebar navigation and organization

### Changed
- Polished sidebar with consistent dividers and user avatar
- Updated color scheme (dark blue theme: #081016)
- Improved MainApp component structure and readability
- Removed deprecated _NEW design template files

---

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

- **2.5.0** - Billing & Subscription section in Settings
- **2.4.1** - Navigation and deployment fixes
- **2.4.0** - Mortgage dummy data integration
- **2.3.0** - Complete Mortgage Manager with CRUD functionality
- **2.2.0** - Plaid bank account integration
- **2.1.3** - Dummy data generation fixes
- **2.1.2** - Clear All Data bug fix
- **2.1.1** - Clear All Data functionality
- **2.1.0** - Dokploy deployment fixes and documentation
- **2.0.0** - React migration with Supabase
- **1.0.0** - Initial WordPress plugin release

---

[2.5.0]: https://github.com/oxfordpierpont/Budgetura/compare/v2.4.1...v2.5.0
[2.4.1]: https://github.com/oxfordpierpont/Budgetura/compare/v2.4.0...v2.4.1
[2.4.0]: https://github.com/oxfordpierpont/Budgetura/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/oxfordpierpont/Budgetura/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/oxfordpierpont/Budgetura/compare/v2.1.3...v2.2.0
[2.1.3]: https://github.com/oxfordpierpont/Budgetura/compare/v2.1.2...v2.1.3
[2.1.2]: https://github.com/oxfordpierpont/Budgetura/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/oxfordpierpont/Budgetura/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/oxfordpierpont/Budgetura/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/oxfordpierpont/Budgetura/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/oxfordpierpont/Budgetura/releases/tag/v1.0.0
