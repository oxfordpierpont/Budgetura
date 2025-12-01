/**
 * Mortgage-specific calculations
 */

/**
 * Calculate home equity
 */
export function calculateEquity(propertyValue: number, loanBalance: number): number {
    return Math.max(0, propertyValue - loanBalance);
}

/**
 * Calculate equity percentage
 */
export function calculateEquityPercentage(propertyValue: number, loanBalance: number): number {
    if (propertyValue === 0) return 0;
    return (calculateEquity(propertyValue, loanBalance) / propertyValue) * 100;
}

/**
 * Calculate Loan-to-Value (LTV) ratio
 */
export function calculateLTV(loanBalance: number, propertyValue: number): number {
    if (propertyValue === 0) return 0;
    return (loanBalance / propertyValue) * 100;
}

/**
 * Calculate total monthly housing cost
 * Includes: Principal & Interest + Property Tax + Insurance + HOA + PMI
 */
export function calculateTotalHousingCost(
    principalAndInterest: number,
    monthlyPropertyTax: number = 0,
    monthlyInsurance: number = 0,
    monthlyHOA: number = 0,
    monthlyPMI: number = 0
): number {
    return principalAndInterest + monthlyPropertyTax + monthlyInsurance + monthlyHOA + monthlyPMI;
}

/**
 * Calculate when PMI can be removed
 */
export function calculatePMIRemovalDate(
    startDate: Date,
    originalPrincipal: number,
    monthlyPayment: number,
    annualRate: number,
    propertyValue: number,
    pmiRemovalLTV: number = 80
): Date | null {
    const monthlyRate = annualRate / 100 / 12;
    let balance = originalPrincipal;
    let month = 0;

    while (month < 360) { // Max 30 years
        const ltv = calculateLTV(balance, propertyValue);

        if (ltv <= pmiRemovalLTV) {
            const removalDate = new Date(startDate);
            removalDate.setMonth(removalDate.getMonth() + month);
            return removalDate;
        }

        const interest = balance * monthlyRate;
        const principal = monthlyPayment - interest;
        balance -= principal;
        month++;

        if (balance <= 0) break;
    }

    return null;
}

/**
 * Calculate refinance savings
 */
export interface RefinanceAnalysis {
    currentScenario: {
        remainingBalance: number;
        monthlyPayment: number;
        remainingMonths: number;
        totalInterest: number;
    };
    refinanceScenario: {
        newMonthlyPayment: number;
        newTermMonths: number;
        totalInterest: number;
        closingCosts: number;
    };
    savings: {
        monthlyPaymentDifference: number;
        totalInterestSaved: number;
        breakEvenMonths: number;
        worthIt: boolean;
    };
}

export function calculateRefinanceAnalysis(
    currentBalance: number,
    currentRate: number,
    currentMonthlyPayment: number,
    remainingMonths: number,
    newRate: number,
    newTermMonths: number,
    closingCosts: number
): RefinanceAnalysis {
    // Calculate current scenario
    const currentMonthlyRate = currentRate / 100 / 12;
    let currentTotal = 0;
    let balance = currentBalance;

    for (let i = 0; i < remainingMonths && balance > 0; i++) {
        const interest = balance * currentMonthlyRate;
        const principal = currentMonthlyPayment - interest;
        currentTotal += interest;
        balance -= principal;
    }

    // Calculate refinance scenario
    const newMonthlyRate = newRate / 100 / 12;
    const newMonthlyPayment = currentBalance *
        (newMonthlyRate * Math.pow(1 + newMonthlyRate, newTermMonths)) /
        (Math.pow(1 + newMonthlyRate, newTermMonths) - 1);

    let refinanceTotal = 0;
    balance = currentBalance;

    for (let i = 0; i < newTermMonths && balance > 0; i++) {
        const interest = balance * newMonthlyRate;
        const principal = newMonthlyPayment - interest;
        refinanceTotal += interest;
        balance -= principal;
    }

    const totalInterestSaved = currentTotal - (refinanceTotal + closingCosts);
    const monthlyDiff = currentMonthlyPayment - newMonthlyPayment;
    const breakEven = monthlyDiff > 0 ? closingCosts / monthlyDiff : Infinity;

    return {
        currentScenario: {
            remainingBalance: currentBalance,
            monthlyPayment: currentMonthlyPayment,
            remainingMonths,
            totalInterest: currentTotal,
        },
        refinanceScenario: {
            newMonthlyPayment,
            newTermMonths,
            totalInterest: refinanceTotal,
            closingCosts,
        },
        savings: {
            monthlyPaymentDifference: monthlyDiff,
            totalInterestSaved,
            breakEvenMonths: breakEven,
            worthIt: totalInterestSaved > 0 && breakEven < 60, // Worth it if break-even < 5 years
        },
    };
}
