# Changelog

All notable changes to Budgetura will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
