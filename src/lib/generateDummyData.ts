import { CREDIT_CARDS, LOANS, BILLS, GOALS, MORTGAGES } from '../../constants';
import * as ops from './supabase/operations';

export const generateDummyDataForUser = async (userId: string) => {
  try {
    console.log('Generating dummy data for user:', userId);

    // Add all dummy credit cards - only pass fields that exist in the database
    for (const card of CREDIT_CARDS) {
      await ops.addCreditCard(userId, {
        name: card.name,
        issuer: card.issuer,
        lastFourDigits: card.lastFourDigits,
        cardType: card.cardType,
        network: card.network,
        balance: card.balance,
        limit: card.limit,
        apr: card.apr,
        minimumPayment: card.minimumPayment,
        extraPayment: card.extraPayment || 0,
        dueDate: card.dueDate,
        statementDate: card.statementDate,
        openedDate: card.openedDate,
        annualFee: card.annualFee,
        rewardsProgram: card.rewardsProgram,
        cashbackRate: card.cashbackRate,
        pointsBalance: Math.floor(card.pointsBalance || 0),
        autoPay: card.autoPay,
        status: card.status,
        notes: card.notes,
      } as any);
    }

    // Add all dummy loans - only pass fields that exist in the database
    for (const loan of LOANS) {
      await ops.addLoan(userId, {
        name: loan.name,
        lender: loan.lender,
        accountNumber: loan.accountNumber,
        type: loan.type,
        originalPrincipal: loan.originalPrincipal,
        currentBalance: loan.currentBalance,
        rate: loan.rate,
        interestType: loan.interestType,
        termMonths: loan.termMonths,
        monthlyPayment: loan.monthlyPayment,
        extraPayment: loan.extraPayment || 0,
        startDate: loan.startDate,
        dueDate: loan.dueDate,
        autoPay: loan.autoPay,
        status: loan.status,
        notes: loan.notes,
        vehicleYear: loan.vehicleYear,
        vehicleMake: loan.vehicleMake,
        vehicleModel: loan.vehicleModel,
        vin: loan.vin,
        mileage: loan.mileage,
        loanProgramType: loan.loanProgramType,
        schoolName: loan.schoolName,
        graduationDate: loan.graduationDate,
      } as any);
    }

    // Add all dummy bills - only pass fields that exist in the database
    for (const bill of BILLS) {
      await ops.addBill(userId, {
        name: bill.name,
        category: bill.category,
        amount: bill.amount,
        averageAmount: bill.averageAmount,
        frequency: bill.frequency,
        dueDate: bill.dueDate,
        lastPaidDate: bill.lastPaidDate,
        isEssential: bill.isEssential,
        autoPay: bill.autoPay,
        website: bill.website,
        notes: bill.notes,
      } as any);
    }

    // Add all dummy goals - only pass fields that exist in the database
    for (const goal of GOALS) {
      await ops.addGoal(userId, {
        name: goal.name,
        type: goal.type,
        target: goal.target,
        current: goal.current,
        monthlyContribution: goal.monthlyContribution,
        priority: goal.priority,
      } as any);
    }

    // Add all dummy mortgages - only pass fields that exist in the database
    for (const mortgage of MORTGAGES) {
      await ops.addMortgage(userId, {
        propertyAddress: mortgage.propertyAddress,
        propertyCity: mortgage.propertyCity,
        propertyState: mortgage.propertyState,
        propertyZip: mortgage.propertyZip,
        propertyType: mortgage.propertyType,
        propertyValue: mortgage.propertyValue,
        lender: mortgage.lender,
        accountNumber: mortgage.accountNumber,
        loanType: mortgage.loanType,
        originalPrincipal: mortgage.originalPrincipal,
        currentBalance: mortgage.currentBalance,
        interestRate: mortgage.interestRate,
        interestType: mortgage.interestType,
        termMonths: mortgage.termMonths,
        monthlyPayment: mortgage.monthlyPayment,
        extraPayment: mortgage.extraPayment || 0,
        monthlyPropertyTax: mortgage.monthlyPropertyTax || 0,
        monthlyInsurance: mortgage.monthlyInsurance || 0,
        monthlyHOA: mortgage.monthlyHOA || 0,
        pmi: mortgage.pmi || 0,
        pmiRemovalLTV: mortgage.pmiRemovalLTV || 80,
        startDate: mortgage.startDate,
        maturityDate: mortgage.maturityDate,
        dueDate: mortgage.dueDate,
        status: mortgage.status,
        autoPay: mortgage.autoPay,
        notes: mortgage.notes,
      } as any);
    }

    console.log('Dummy data generated successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error generating dummy data:', error);
    return { success: false, error };
  }
};
