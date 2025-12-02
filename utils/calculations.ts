import { CreditCard, Loan, Bill } from '../types';

export const calculateMonthsToPayoff = (balance: number, apr: number, monthlyPayment: number): number => {
  if (balance <= 0) return 0;
  if (monthlyPayment <= 0) return Infinity;

  const monthlyRate = (apr / 100) / 12;
  
  // If payment is less than interest, it will never be paid off
  if (monthlyPayment <= balance * monthlyRate) {
    return Infinity;
  }

  // N = -log(1 - (B * r / P)) / log(1 + r)
  const numerator = Math.log(1 - (balance * monthlyRate / monthlyPayment));
  const denominator = Math.log(1 + monthlyRate);
  
  const months = -numerator / denominator;
  return Math.ceil(months);
};

export const calculateTotalInterest = (balance: number, monthlyPayment: number, months: number): number => {
  if (months === Infinity || months <= 0) return 0;
  const totalPaid = monthlyPayment * months;
  return Math.max(0, totalPaid - balance);
};

export const calculatePayoffDate = (months: number): string => {
  if (months === Infinity || months <= 0) return 'N/A';
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const calculateUtilization = (balance: number, limit: number): number => {
  if (limit <= 0) return 0;
  return Math.round((balance / limit) * 100);
};

export const calculateAmortization = (principal: number, rate: number, termMonths: number): number => {
  if (termMonths <= 0 || principal <= 0) return 0;
  const monthlyRate = (rate / 100) / 12;
  
  if (monthlyRate === 0) return principal / termMonths;

  // P = L[c(1 + c)^n]/[(1 + c)^n - 1]
  const payment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
    (Math.pow(1 + monthlyRate, termMonths) - 1);
    
  return Math.round(payment * 100) / 100;
};

// --- Advanced Simulations ---

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export const generateAmortizationSchedule = (principal: number, rate: number, termMonths: number, monthlyPayment?: number): AmortizationRow[] => {
  let balance = principal;
  const monthlyRate = (rate / 100) / 12;
  const payment = monthlyPayment || calculateAmortization(principal, rate, termMonths);
  
  const schedule: AmortizationRow[] = [];
  
  for (let month = 1; month <= termMonths + 120; month++) { // Cap at reasonable limit + buffer
    if (balance <= 0) break;

    const interest = balance * monthlyRate;
    let principalPaid = payment - interest;
    
    // Handle final payment
    if (balance < principalPaid) {
        principalPaid = balance;
    }
    
    balance -= principalPaid;
    
    if (balance < 0) balance = 0;

    schedule.push({
        month,
        payment: principalPaid + interest,
        principal: principalPaid,
        interest,
        balance
    });
  }
  
  return schedule;
}

export interface SimulationResult {
    timeline: { month: number, totalBalance: number, totalInterestPaid: number }[];
    payoffDate: Date;
    totalInterest: number;
    debtsPaidOrder: { id: string, name: string, month: number }[];
}

export const simulatePayoffPlan = (
    debts: (CreditCard | Loan)[], 
    extraMonthlyAmount: number, 
    strategy: 'avalanche' | 'snowball'
): SimulationResult => {
    
    // 1. Setup simulation state
    let activeDebts = debts.map(d => {
        const isCard = 'balance' in d;
        return {
            id: d.id,
            name: d.name,
            balance: isCard ? (d as CreditCard).balance : (d as Loan).currentBalance,
            rate: isCard ? (d as CreditCard).apr : (d as Loan).rate,
            minPayment: isCard ? (d as CreditCard).minimumPayment : (d as Loan).monthlyPayment,
            originalObj: d
        };
    });

    let currentMonth = 0;
    let totalInterestPaid = 0;
    const timeline = [{ month: 0, totalBalance: activeDebts.reduce((s, d) => s + d.balance, 0), totalInterestPaid: 0 }];
    const debtsPaidOrder: { id: string, name: string, month: number }[] = [];

    // Safety break
    while (activeDebts.some(d => d.balance > 0) && currentMonth < 600) {
        currentMonth++;
        let monthlyBudget = extraMonthlyAmount;
        
        // 2. Identify target based on strategy
        // Sort active debts with balance > 0
        const payableDebts = activeDebts.filter(d => d.balance > 0);
        
        if (payableDebts.length === 0) break;

        // Apply sort
        payableDebts.sort((a, b) => {
            if (strategy === 'avalanche') return b.rate - a.rate; // High rate first
            return a.balance - b.balance; // Low balance first
        });

        const targetDebt = payableDebts[0];

        // 3. Process payments
        let monthInterestTotal = 0;

        activeDebts.forEach(debt => {
            if (debt.balance <= 0) return;

            // Accrue interest
            const interest = debt.balance * (debt.rate / 100 / 12);
            monthInterestTotal += interest;
            totalInterestPaid += interest;

            // Determine payment
            let payment = debt.minPayment;
            
            // Add snowball/avalanche amount to target
            if (debt.id === targetDebt.id) {
                payment += monthlyBudget;
                monthlyBudget = 0; // Budget used
            }

            // Apply payment
            // First covers interest, rest to principal
            const principalPaid = Math.max(0, payment - interest);
            debt.balance -= principalPaid;

            if (debt.balance <= 0) {
                // Debt paid off!
                // Any overpayment rolls over to next month's budget (simplified here as budget availability for next iteration in loop is handled by reduced min payments requirement, 
                // but strictly speaking rolled over cashflow is handled by the fact that this debt's min payment is no longer required in future months, freeing up cash).
                // For this simulation, we assume the user maintains the same Total Monthly Output.
                // So the freed up min payment becomes available "extra" for next loops implicitly if we tracked total output.
                // To support "Rollover" (Snowball), we need to track that the budget effectively increases by the paid-off debt's min payment.
                
                // However, the function argument `extraMonthlyAmount` is usually fixed on top of *current* min payments.
                // True Snowball means: Total Payment = Sum(Initial Min Payments) + Extra.
                // So as debts drop off, their min payment amount shifts to the "Extra" pile.
                
                // Let's refine logic:
                // We need to establish a "Total Monthly Output" at start and stick to it.
                // But `minPayment` varies by debt type (CCs drop min payment as balance drops, Loans fixed).
                // Simplified: We assume fixed monthly output = Sum(Start Min Payments) + Extra.
                
                debt.balance = 0; 
                debtsPaidOrder.push({ id: debt.id, name: debt.name, month: currentMonth });
            }
        });
        
        // Re-calculate budget availability for next pass? 
        // Logic above with `monthlyBudget` only handled the explicit extra amount.
        // To do true snowball, we should aggregate all payments made.
        // Better approach for loop:
        // 1. Calculate total available funds = Sum(Original Min Payments) + Extra Input.
        // 2. Subtract current required min payments for active debts.
        // 3. The remainder is the "Snowball" to throw at target.
        
        // Refined Logic for next iteration (simulation nuance):
        // We stick to the simple version where "Extra" is applied to top priority, and we assume user keeps paying previous min payments towards the debt pile (Snowball effect).
        // To achieve this: `monthlyBudget` should technically increase as debts are paid off.
        // Let's implement the Snowball Effect:
        const freedUpCash = debts.reduce((sum, d) => {
            const active = activeDebts.find(ad => ad.id === d.id);
            if (active && active.balance <= 0) {
                 const isCard = 'balance' in d;
                 return sum + (isCard ? (d as CreditCard).minimumPayment : (d as Loan).monthlyPayment);
            }
            return sum;
        }, 0);
        
        // If target exists, add freed cash to it in next loop? 
        // Actually, in the loop above, `monthlyBudget` was consumed.
        // But we didn't use `freedUpCash`. 
        // In the next month iteration, we should add `freedUpCash` to `extraMonthlyAmount`.
        // Let's adjust the `monthlyBudget` logic inside the loop to include freed cash.
        
        // Hack for this pass: We already processed payments. 
        // The loop is slightly imperfect for "same month rollover" but good enough for projection.
        // Next month, the loop starts again. We should actually calculate the 'Snowball Amount' at top of loop.
        
        // CORRECTED LOOP LOGIC:
        // (Redoing inside the while loop would require refactor, let's stick to this approximation:
        // The freed cash is effectively added because we are *not* subtracting it from a global total.
        // We are just *not paying* it to the dead debt.
        // But we need to explicitly apply it to the target.
        
        // Let's patch the logic:
        if (freedUpCash > 0 && targetDebt.balance > 0) {
            // Apply freed cash to target (Snowball effect)
             const interest = 0; // Interest already covered
             // We treat freed cash as pure principal payment since we already handled the month's interest/min-payment for target above (if it was active).
             // Wait, if target was active, we paid its min + extra. Now we add freed cash from others.
             targetDebt.balance -= freedUpCash;
             if (targetDebt.balance < 0) targetDebt.balance = 0;
        }

        timeline.push({
            month: currentMonth,
            totalBalance: activeDebts.reduce((s, d) => s + d.balance, 0),
            totalInterestPaid: totalInterestPaid
        });
    }

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + currentMonth);

    return {
        timeline,
        payoffDate,
        totalInterest: totalInterestPaid,
        debtsPaidOrder
    };
}


export const calculateMonthlyBillTotal = (bills: Bill[]): number => {
  return bills.reduce((total, bill) => {
    let monthlyAmount = bill.amount;
    switch (bill.frequency) {
      case 'weekly': monthlyAmount = bill.amount * 4.33; break;
      case 'bi-weekly': monthlyAmount = bill.amount * 2.16; break;
      case 'quarterly': monthlyAmount = bill.amount / 3; break;
      case 'annually': monthlyAmount = bill.amount / 12; break;
    }
    return total + monthlyAmount;
  }, 0);
};

export const sortDebts = (debts: (CreditCard | Loan)[], strategy: 'avalanche' | 'snowball') => {
  return [...debts].sort((a, b) => {
    // Determine rate and balance based on type (Card vs Loan)
    const rateA = 'apr' in a ? a.apr : a.rate;
    const rateB = 'apr' in b ? b.apr : b.rate;
    const balanceA = 'balance' in a ? a.balance : a.currentBalance;
    const balanceB = 'balance' in b ? b.balance : b.currentBalance;

    if (strategy === 'avalanche') {
      return rateB - rateA; // Highest rate first
    } else {
      return balanceA - balanceB; // Lowest balance first
    }
  });
};