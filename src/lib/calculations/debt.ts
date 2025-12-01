/**
 * Debt management calculations
 */

/**
 * Calculate Debt-to-Income (DTI) ratio
 */
export function calculateDTI(totalMonthlyDebt: number, monthlyIncome: number): number {
    if (monthlyIncome === 0) return 0;
    return (totalMonthlyDebt / monthlyIncome) * 100;
}

/**
 * Debt payoff strategy types
 */
export type DebtPayoffStrategy = 'avalanche' | 'snowball' | 'custom';

/**
 * Debt item for payoff calculations
 */
export interface DebtItem {
    id: string;
    name: string;
    balance: number;
    minimumPayment: number;
    interestRate: number;
}

/**
 * Sort debts by avalanche strategy (highest interest rate first)
 */
export function sortByAvalanche(debts: DebtItem[]): DebtItem[] {
    return [...debts].sort((a, b) => b.interestRate - a.interestRate);
}

/**
 * Sort debts by snowball strategy (smallest balance first)
 */
export function sortBySnowball(debts: DebtItem[]): DebtItem[] {
    return [...debts].sort((a, b) => a.balance - b.balance);
}

/**
 * Calculate debt payoff timeline with extra payment
 */
export interface DebtPayoffResult {
    debtId: string;
    debtName: string;
    payoffMonth: number;
    totalInterest: number;
    totalPaid: number;
}

export interface PayoffTimeline {
    strategy: DebtPayoffStrategy;
    debts: DebtPayoffResult[];
    totalMonths: number;
    totalInterest: number;
    totalPaid: number;
}

export function calculateDebtPayoffTimeline(
    debts: DebtItem[],
    extraPayment: number,
    strategy: DebtPayoffStrategy = 'avalanche'
): PayoffTimeline {
    // Sort debts based on strategy
    const sortedDebts = strategy === 'avalanche'
        ? sortByAvalanche(debts)
        : sortBySnowball(debts);

    // Track remaining balances
    const debtBalances = new Map(debts.map(d => [d.id, d.balance]));
    const results: DebtPayoffResult[] = [];

    let currentMonth = 0;
    let availableExtra = extraPayment;
    let totalInterest = 0;
    let totalPaid = 0;

    // Process until all debts are paid
    while (debtBalances.size > 0 && currentMonth < 600) { // Max 50 years
        currentMonth++;

        // Apply minimum payments to all debts
        for (const debt of debts) {
            const balance = debtBalances.get(debt.id);
            if (balance === undefined || balance <= 0) continue;

            const monthlyRate = debt.interestRate / 100 / 12;
            const interest = balance * monthlyRate;
            const principal = Math.min(debt.minimumPayment - interest, balance);
            const payment = principal + interest;

            const newBalance = balance - principal;
            debtBalances.set(debt.id, newBalance);

            totalInterest += interest;
            totalPaid += payment;

            // If paid off, record it
            if (newBalance <= 0.01) {
                results.push({
                    debtId: debt.id,
                    debtName: debt.name,
                    payoffMonth: currentMonth,
                    totalInterest: interest,
                    totalPaid: payment,
                });
                debtBalances.delete(debt.id);
            }
        }

        // Apply extra payment to target debt (first in sorted order still active)
        if (availableExtra > 0) {
            for (const debt of sortedDebts) {
                const balance = debtBalances.get(debt.id);
                if (balance !== undefined && balance > 0) {
                    const extraApplied = Math.min(availableExtra, balance);
                    debtBalances.set(debt.id, balance - extraApplied);
                    totalPaid += extraApplied;

                    // Check if this extra payment paid it off
                    if (balance - extraApplied <= 0.01) {
                        const existing = results.find(r => r.debtId === debt.id);
                        if (!existing) {
                            results.push({
                                debtId: debt.id,
                                debtName: debt.name,
                                payoffMonth: currentMonth,
                                totalInterest: 0,
                                totalPaid: extraApplied,
                            });
                        }
                        debtBalances.delete(debt.id);

                        // Add this debt's minimum to extra for next debt
                        availableExtra += debt.minimumPayment;
                    }
                    break; // Only apply to one debt per month
                }
            }
        }
    }

    return {
        strategy,
        debts: results,
        totalMonths: currentMonth,
        totalInterest,
        totalPaid,
    };
}

/**
 * Compare avalanche vs snowball strategies
 */
export interface StrategyComparison {
    avalanche: PayoffTimeline;
    snowball: PayoffTimeline;
    interestSaved: number;
    monthsSaved: number;
    recommendedStrategy: DebtPayoffStrategy;
}

export function comparePayoffStrategies(
    debts: DebtItem[],
    extraPayment: number
): StrategyComparison {
    const avalanche = calculateDebtPayoffTimeline(debts, extraPayment, 'avalanche');
    const snowball = calculateDebtPayoffTimeline(debts, extraPayment, 'snowball');

    const interestSaved = snowball.totalInterest - avalanche.totalInterest;
    const monthsSaved = snowball.totalMonths - avalanche.totalMonths;

    return {
        avalanche,
        snowball,
        interestSaved,
        monthsSaved,
        recommendedStrategy: interestSaved > 1000 ? 'avalanche' : 'snowball',
    };
}
