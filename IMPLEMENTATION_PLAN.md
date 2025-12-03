# Budgetura Feature Implementation Plan

**Date:** December 3, 2025
**Version:** 1.0
**Status:** Planning Phase

---

## Overview

This document outlines the implementation plan for major features to be added to Budgetura based on the PRD requirements.

---

## Implementation Phases

### **Phase 1: Mortgage Manager** ⭐ HIGH PRIORITY
**Estimated Time:** 4-6 hours
**Dependencies:** None
**Status:** Ready to Start

#### Tasks:
1. **Create MortgageManager Component** (`components/MortgageManager.tsx`)
   - Mortgage list view with property cards
   - Summary statistics (total balance, total equity, monthly costs)
   - Sort and filter controls
   - Empty state

2. **Implement Mortgage Row Component**
   - Expandable mortgage cards
   - Property information display
   - Financial metrics (equity %, monthly payment breakdown)
   - Edit/Delete actions

3. **Create Mortgage Forms**
   - Add mortgage form with comprehensive fields:
     - Basic Info: Property name, lender, loan number
     - Property Details: Address, city, state, zip, property type
     - Financial: Original principal, current balance, property value
     - Loan Terms: Interest rate, term months, start date
     - Monthly Costs: Principal+Interest, property tax, insurance, HOA
     - Additional: Down payment, closing costs, notes
   - Edit mortgage form
   - Form validation

4. **Add Mortgage Calculations**
   - Equity calculation: (propertyValue - currentBalance) / propertyValue
   - Total monthly cost: P&I + taxes + insurance + HOA
   - Amortization schedule generation
   - Payoff date calculation
   - Total interest calculation

5. **Integration**
   - Add to DebtContext (already has mortgages array)
   - Add route in App.tsx
   - Add to Sidebar navigation
   - Update Dashboard to include mortgage summary
   - Update Progress Tracking to include mortgages

#### Files to Create/Modify:
- `components/MortgageManager.tsx` (NEW)
- `App.tsx` (add 'mortgages' case)
- `components/Sidebar.tsx` (add Mortgage nav item)
- `components/DashboardView.tsx` (include mortgage summary)
- `components/ProgressView.tsx` (include mortgage data)
- `context/DebtContext.tsx` (verify mortgage CRUD operations)

---

### **Phase 2: Enhanced Progress Tracking with Snapshots** ⭐ HIGH PRIORITY
**Estimated Time:** 3-4 hours
**Dependencies:** Phase 1 (Mortgage data)
**Status:** Pending Phase 1

#### Tasks:
1. **Expand Snapshots in Progress Tracking**
   - Add historical snapshots timeline view
   - Snapshot comparison (current vs previous periods)
   - Net worth trend visualization
   - Breakdown by debt type (cards, loans, mortgages)

2. **Create Snapshot Management UI**
   - "Create Snapshot" button
   - Manual snapshot creation modal
   - Snapshot detail modal showing:
     - Total debt at that time
     - Net worth (if assets tracked)
     - Breakdown by category
     - Change from previous snapshot
   - Edit/Delete snapshot functionality

3. **Automatic Snapshot Scheduling**
   - Monthly auto-snapshot option in settings
   - Snapshot notifications

4. **Enhanced Data Visualization**
   - Multi-line chart showing debt trends by category
   - Net worth growth chart
   - Debt-free projection timeline

#### Files to Create/Modify:
- `components/ProgressView.tsx` (expand with snapshot UI)
- `context/DebtContext.tsx` (add snapshot CRUD operations)
- New component: `components/SnapshotModal.tsx`
- New component: `components/SnapshotTimeline.tsx`

---

### **Phase 3: OneSignal Notifications System** ⭐ HIGH PRIORITY
**Estimated Time:** 4-5 hours
**Dependencies:** None
**Status:** Ready to Start

#### Tasks:
1. **OneSignal Setup**
   - Create OneSignal account and app
   - Install OneSignal SDK: `npm install react-onesignal`
   - Configure OneSignal in project
   - Set up service worker for notifications

2. **Notification Infrastructure**
   - Initialize OneSignal in `index.tsx`
   - Create notification permissions prompt
   - Store user's OneSignal player ID in user profile

3. **Notification Types Implementation**
   - Payment due reminders (7 days, 3 days, 1 day before)
   - Goal milestone achievements
   - Debt payoff milestones (25%, 50%, 75%, 100%)
   - Weekly progress summaries
   - Monthly snapshot created

4. **Notification UI Components**
   - Notification bell icon in header/sidebar
   - Notification dropdown panel
   - In-app notification list
   - Notification badges (unread count)
   - Mark as read functionality

5. **Notification Settings**
   - Add notification preferences in Settings
   - Toggle for each notification type
   - Notification frequency controls
   - Test notification button

6. **Backend Notification Triggers** (Supabase Edge Functions)
   - Payment due date checker (daily cron job)
   - Goal achievement detector
   - Milestone tracker
   - Send notifications via OneSignal API

#### Files to Create/Modify:
- `src/lib/onesignal.ts` (NEW - OneSignal configuration)
- `src/hooks/useNotifications.ts` (NEW - notification management)
- `components/NotificationBell.tsx` (NEW)
- `components/NotificationPanel.tsx` (NEW)
- `components/SettingsView.tsx` (add notification settings tab)
- `index.tsx` (initialize OneSignal)
- `supabase/functions/notification-scheduler/` (NEW - Edge function)
- Package: Add `react-onesignal` to dependencies

---

### **Phase 4: PWA Home Screen Prompt** ⭐ MEDIUM PRIORITY
**Estimated Time:** 2-3 hours
**Dependencies:** None
**Status:** Ready to Start

#### Tasks:
1. **PWA Configuration**
   - Verify `public/manifest.json` exists and is complete
   - Update manifest with correct app name, icons, theme colors
   - Ensure service worker is properly configured

2. **App Icon Setup**
   - Convert favicon.ico to multiple sizes (192x192, 512x512)
   - Add to public/icons/ directory
   - Update manifest.json with icon paths

3. **Install Prompt Component**
   - Detect if app is already installed
   - Detect if device supports PWA install
   - Show install prompt banner after 30 seconds
   - "Add to Home Screen" button
   - Dismissible prompt with "Don't show again" option
   - Store dismiss preference in localStorage

4. **Install Instructions**
   - Platform-specific instructions (iOS, Android, Desktop)
   - Modal with step-by-step guide
   - Screenshots for each platform

#### Files to Create/Modify:
- `public/manifest.json` (verify/update)
- `public/icons/` (NEW - app icons directory)
- `components/InstallPrompt.tsx` (NEW)
- `src/hooks/usePWA.ts` (NEW - PWA detection and install)
- Update service worker configuration

---

### **Phase 5: Advanced Settings Pages** ⭐ MEDIUM PRIORITY
**Estimated Time:** 3-4 hours
**Dependencies:** Phase 3 (Notification Settings)
**Status:** Pending Phase 3

#### Tasks:
1. **Notification Settings Tab** (from Phase 3)
   - Already covered in Phase 3

2. **Data & Privacy Settings Tab**
   - Export all data as JSON
   - Download data button
   - Delete account functionality (with confirmation)
   - Data usage statistics
   - Privacy policy link
   - Terms of service link

3. **Preferences Settings Tab**
   - Theme selection (Light/Dark/Auto)
   - Currency preference (USD, EUR, GBP, etc.)
   - Date format (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
   - Number format (1,234.56 vs 1.234,56)
   - Language selection (future)
   - Default view on login

4. **Enhanced Account Settings**
   - Profile picture upload
   - Display name
   - Email address (read-only from auth)
   - Phone number (optional)
   - Timezone selection

5. **Security Settings Enhancements**
   - Two-factor authentication setup
   - Active sessions list
   - Login history
   - Connected devices

#### Files to Create/Modify:
- `components/SettingsView.tsx` (expand with new tabs)
- `components/settings/NotificationSettings.tsx` (NEW)
- `components/settings/DataPrivacySettings.tsx` (NEW)
- `components/settings/PreferencesSettings.tsx` (NEW)
- `components/settings/SecuritySettings.tsx` (NEW)
- `src/hooks/useSettings.ts` (NEW - settings management)
- Add settings table to Supabase schema

---

### **Phase 6: Enhanced Plaid Integration** ⭐ MEDIUM PRIORITY
**Estimated Time:** 5-6 hours
**Dependencies:** None
**Status:** Ready to Start

#### Tasks:
1. **Bank Account Management UI**
   - List of linked bank accounts
   - Account balances display
   - Account type indicators (Checking, Savings, Credit)
   - Refresh balances button
   - Unlink account functionality
   - Re-authenticate expired connections

2. **Transaction Syncing**
   - Fetch transactions from Plaid
   - Display recent transactions list
   - Transaction categorization
   - Transaction search and filtering
   - Date range selection

3. **Automatic Bill Detection**
   - Analyze recurring transactions
   - Suggest bills to add to Bills Manager
   - One-click add from suggestions

4. **Income Tracking**
   - Detect income transactions (deposits, payroll)
   - Track income sources
   - Monthly income summary
   - Income vs expenses comparison

5. **Enhanced Bank Accounts Page**
   - Account overview with balances
   - Transaction history per account
   - Net worth calculation (accounts - debts)
   - Cash flow visualization
   - Account health indicators

6. **Plaid Backend Enhancements**
   - Webhook handlers for balance updates
   - Transaction sync scheduler
   - Error handling and retry logic
   - Token refresh management

#### Files to Create/Modify:
- `components/BankAccounts.tsx` (major expansion)
- `components/TransactionList.tsx` (NEW)
- `components/TransactionDetail.tsx` (NEW)
- `components/IncomeTracker.tsx` (NEW)
- `src/hooks/usePlaid.ts` (enhance)
- `src/hooks/useTransactions.ts` (NEW)
- `plaid-backend/` (enhance webhook handlers)
- Add transactions table to Supabase schema
- Add income_sources table to Supabase schema

---

### **Phase 7: Payment History Tracking** ⭐ LOW-MEDIUM PRIORITY
**Estimated Time:** 4-5 hours
**Dependencies:** Phases 1, 6
**Status:** Pending Phases 1 & 6

#### Tasks:
1. **Payment History on Individual Pages**
   - Add "Payment History" tab to expanded credit cards
   - Add "Payment History" tab to expanded loans
   - Add "Payment History" tab to expanded mortgages
   - Display payment timeline
   - Payment amount and date
   - Principal vs interest breakdown
   - Remaining balance after payment

2. **Payment Entry Modal**
   - Record payment form
   - Payment date picker
   - Payment amount input
   - Payment type (regular, extra, payoff)
   - Notes field
   - Automatic balance update

3. **Payment Calendar View**
   - Calendar showing all payment dates
   - Color-coded by debt type
   - Upcoming payments vs past payments
   - Missed payment indicators

4. **Payment Analytics in Progress Tracking**
   - Total payments made (by period)
   - Payment consistency score
   - On-time payment percentage
   - Extra payments visualization
   - Accelerated payoff progress

5. **Payment Reminders**
   - Integration with notification system
   - Set custom reminder days before due date
   - Email and push notifications

#### Files to Create/Modify:
- `components/PaymentHistory.tsx` (NEW)
- `components/PaymentModal.tsx` (NEW)
- `components/PaymentCalendar.tsx` (NEW)
- `components/CreditCardManager.tsx` (add payment history tab)
- `components/LoanManager.tsx` (add payment history tab)
- `components/MortgageManager.tsx` (add payment history tab)
- `components/ProgressView.tsx` (add payment analytics)
- `context/DebtContext.tsx` (add payment CRUD operations)
- Payment history table already exists in schema

---

### **Phase 8: Debt Payoff Strategy Optimizer** ⭐ MEDIUM PRIORITY
**Estimated Time:** 4-5 hours
**Dependencies:** Phase 1 (Mortgages)
**Status:** Pending Phase 1

#### Tasks:
1. **Strategy Comparison View**
   - Side-by-side comparison of strategies:
     - Avalanche (highest APR first)
     - Snowball (lowest balance first)
     - Custom (user-defined priority)
   - Show for each strategy:
     - Total time to debt-free
     - Total interest paid
     - Monthly cash flow
     - Debt-free date

2. **Interactive Strategy Builder**
   - Drag-and-drop debt priority ordering
   - Adjust extra payment allocation
   - Set target payoff dates
   - Simulate extra income scenarios
   - "What if" calculator

3. **Strategy Visualization**
   - Timeline showing debt elimination order
   - Waterfall chart showing balance reduction
   - Month-by-month projection chart
   - Savings comparison chart

4. **Recommended Strategy**
   - AI/algorithm-based recommendation
   - Explanation of why this strategy is optimal
   - Factors considered (APR, balance, cash flow)
   - Apply recommendation to Action Plan

5. **Integration with Action Plan**
   - Import selected strategy into Action Plan
   - Update monthly payment allocations
   - Track adherence to strategy
   - Alert when off-track

#### Files to Create/Modify:
- `components/ActionPlanView.tsx` (major expansion)
- `components/StrategyComparison.tsx` (NEW)
- `components/StrategyBuilder.tsx` (NEW)
- `components/StrategyVisualizer.tsx` (NEW)
- `src/utils/strategyCalculations.ts` (NEW)
- `src/hooks/useStrategy.ts` (NEW)

---

## Implementation Order & Timeline

### Week 1
- **Day 1-2:** Phase 1 - Mortgage Manager
- **Day 3:** Phase 4 - PWA Home Screen Prompt
- **Day 4-5:** Phase 3 - OneSignal Notifications (Part 1)

### Week 2
- **Day 1-2:** Phase 3 - OneSignal Notifications (Part 2)
- **Day 3:** Phase 2 - Enhanced Progress Tracking
- **Day 4-5:** Phase 5 - Advanced Settings

### Week 3
- **Day 1-3:** Phase 6 - Enhanced Plaid Integration
- **Day 4-5:** Phase 8 - Debt Payoff Strategy Optimizer

### Week 4
- **Day 1-3:** Phase 7 - Payment History Tracking
- **Day 4-5:** Testing, bug fixes, documentation

---

## Dependencies Graph

```
Phase 1 (Mortgage) ──┐
                     ├──> Phase 2 (Progress + Snapshots)
                     │
                     ├──> Phase 7 (Payment History)
                     │
                     └──> Phase 8 (Strategy Optimizer)

Phase 3 (Notifications) ──> Phase 5 (Advanced Settings)

Phase 4 (PWA Prompt) ── Independent

Phase 6 (Plaid) ──> Phase 7 (Payment History)
```

---

## Risk Assessment

### High Risk:
- **OneSignal Integration** - Third-party service complexity
- **Plaid Enhancement** - Backend API changes required

### Medium Risk:
- **Mortgage Manager** - Complex calculations
- **Payment History** - Multiple integration points

### Low Risk:
- **PWA Prompt** - Well-documented pattern
- **Advanced Settings** - Standard CRUD operations

---

## Success Metrics

1. **Phase 1:** Mortgages visible and editable in UI
2. **Phase 2:** Snapshots creating and displaying correctly
3. **Phase 3:** Notifications sending and displaying
4. **Phase 4:** Install prompt showing on eligible devices
5. **Phase 5:** All settings tabs functional
6. **Phase 6:** Transactions syncing from Plaid
7. **Phase 7:** Payment history recording and displaying
8. **Phase 8:** Strategy comparison calculating correctly

---

## Next Steps

1. Review this plan with stakeholder
2. Start with Phase 1 - Mortgage Manager
3. Test each phase before moving to next
4. Deploy incrementally
5. Gather user feedback

---

**Status:** Ready to begin Phase 1
