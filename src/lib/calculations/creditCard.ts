/**
 * Credit Card Calculations
 * Based on standard credit card payoff formulas
 */

/**
 * Calculate credit card utilization percentage
 */
export function calculateUtilization(balance: number, creditLimit: number): number {
    if (creditLimit === 0) return 0;
    return (balance / creditLimit) * 100;
}

/**
 * Calculate available credit
 */
export function calculateAvailableCredit(balance: number, creditLimit: number): number {
    return Math.max(0, creditLimit - balance);
}

/**
 * Calculate months until payoff
 * Formula: n = -log(1 - (B * r / P)) / log(1 + r)
 * Where: B = balance, r = monthly rate, P = monthly payment
 */
export function calculatePayoffMonths(
    balance: number,
    apr: number,
    monthlyPayment: number
): number {
    if (balance <= 0) return 0;
    if (monthlyPayment <= 0) return Infinity;

    const monthlyRate = apr / 100 / 12;

    // If payment equals or less than monthly interest, never pays off
    const monthlyInterest = balance * monthlyRate;
    if (monthlyPayment <= monthlyInterest) return Infinity;

    // Standard payoff formula
    if (monthlyRate === 0) {
        return balance / monthlyPayment;
    }

    const months = -Math.log(1 - (balance * monthlyRate / monthlyPayment)) / Math.log(1 + monthlyRate);
    return Math.ceil(months);
}

/**
 * Calculate total interest paid
 */
export function calculateTotalInterest(
    balance: number,
    apr: number,
    monthlyPayment: number
): number {
    const months = calculatePayoffMonths(balance, apr, monthlyPayment);
    if (months === Infinity) return Infinity;

    const totalPaid = monthlyPayment * months;
    return totalPaid - balance;
}

/**
 * Calculate payoff date
 */
export function calculatePayoffDate(
    balance: number,
    apr: number,
    monthlyPayment: number,
    startDate: Date = new Date()
): Date | null {
    const months = calculatePayoffMonths(balance, apr, monthlyPayment);
    if (months === Infinity) return null;

    const payoffDate = new Date(startDate);
    payoffDate.setMonth(payoffDate.getMonth() + months);
    return payoffDate;
}

/**
 * Generate payment schedule
 */
export interface PaymentScheduleEntry {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
}

export function generatePaymentSchedule(
    initialBalance: number,
    apr: number,
    monthlyPayment: number,
    maxMonths: number = 360
): PaymentScheduleEntry[] {
    const schedule: PaymentScheduleEntry[] = [];
    const monthlyRate = apr / 100 / 12;

    let balance = initialBalance;
    let month = 1;

    while (balance > 0.01 && month <= maxMonths) {
        const interest = balance * monthlyRate;
        const principal = Math.min(monthlyPayment - interest, balance);
        const payment = principal + interest;

        balance -= principal;

        schedule.push({
            month,
            payment,
            principal,
            interest,
            balance: Math.max(0, balance),
        });

        month++;
    }

    return schedule;
}
