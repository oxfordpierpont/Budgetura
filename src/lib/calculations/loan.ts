/**
 * Loan Calculations
 * Based on standard amortization formulas
 */

/**
 * Calculate monthly payment for a loan
 * Formula: P = L[c(1 + c)^n]/[(1 + c)^n - 1]
 * Where: L = principal, c = monthly rate, n = term in months
 */
export function calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    termMonths: number
): number {
    if (principal <= 0 || termMonths <= 0) return 0;
    if (annualRate === 0) return principal / termMonths;

    const monthlyRate = annualRate / 100 / 12;
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);

    return payment;
}

/**
 * Generate full amortization schedule
 */
export interface AmortizationEntry {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
    cumulativeInterest: number;
    cumulativePrincipal: number;
}

export function generateAmortizationSchedule(
    principal: number,
    annualRate: number,
    termMonths: number,
    extraPayment: number = 0
): AmortizationEntry[] {
    const schedule: AmortizationEntry[] = [];
    const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
    const monthlyRate = annualRate / 100 / 12;

    let balance = principal;
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;

    for (let month = 1; month <= termMonths && balance > 0.01; month++) {
        const interest = balance * monthlyRate;
        const principalPayment = Math.min(monthlyPayment - interest + extraPayment, balance);
        const payment = principalPayment + interest;

        balance -= principalPayment;
        cumulativeInterest += interest;
        cumulativePrincipal += principalPayment;

        schedule.push({
            month,
            payment,
            principal: principalPayment,
            interest,
            balance: Math.max(0, balance),
            cumulativeInterest,
            cumulativePrincipal,
        });
    }

    return schedule;
}

/**
 * Calculate total interest over life of loan
 */
export function calculateTotalLoanInterest(
    principal: number,
    annualRate: number,
    termMonths: number,
    extraPayment: number = 0
): number {
    const schedule = generateAmortizationSchedule(principal, annualRate, termMonths, extraPayment);
    return schedule.reduce((sum, entry) => sum + entry.interest, 0);
}

/**
 * Calculate payoff date with extra payments
 */
export function calculateLoanPayoffDate(
    startDate: Date,
    principal: number,
    annualRate: number,
    termMonths: number,
    extraPayment: number = 0
): Date {
    const schedule = generateAmortizationSchedule(principal, annualRate, termMonths, extraPayment);
    const actualMonths = schedule.length;

    const payoffDate = new Date(startDate);
    payoffDate.setMonth(payoffDate.getMonth() + actualMonths);
    return payoffDate;
}

/**
 * Calculate prepayment scenario
 */
export interface PrepaymentScenario {
    regularPayoff: {
        months: number;
        totalInterest: number;
        totalPaid: number;
    };
    withExtra: {
        months: number;
        totalInterest: number;
        totalPaid: number;
        saved: number;
        monthsSaved: number;
    };
}

export function calculatePrepaymentScenario(
    principal: number,
    annualRate: number,
    termMonths: number,
    extraPayment: number
): PrepaymentScenario {
    const regularSchedule = generateAmortizationSchedule(principal, annualRate, termMonths, 0);
    const extraSchedule = generateAmortizationSchedule(principal, annualRate, termMonths, extraPayment);

    const regularTotal = regularSchedule.reduce((sum, e) => sum + e.payment, 0);
    const regularInterest = regularSchedule.reduce((sum, e) => sum + e.interest, 0);

    const extraTotal = extraSchedule.reduce((sum, e) => sum + e.payment, 0);
    const extraInterest = extraSchedule.reduce((sum, e) => sum + e.interest, 0);

    return {
        regularPayoff: {
            months: regularSchedule.length,
            totalInterest: regularInterest,
            totalPaid: regularTotal,
        },
        withExtra: {
            months: extraSchedule.length,
            totalInterest: extraInterest,
            totalPaid: extraTotal,
            saved: regularInterest - extraInterest,
            monthsSaved: regularSchedule.length - extraSchedule.length,
        },
    };
}
