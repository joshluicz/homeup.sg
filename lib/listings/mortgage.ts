export type MortgageInput = {
  propertyPrice: number;
  loanAmount: number;
  annualInterestRate: number;
  loanTenureYears: number;
};

export type MortgageResult = {
  monthlyRepayment: number;
  totalRepayment: number;
  totalInterest: number;
  totalPrincipal: number;
  downpayment: number;
  principalShare: number;
  interestShare: number;
};

export function calculateMortgage(input: MortgageInput): MortgageResult {
  const { propertyPrice, loanAmount, annualInterestRate, loanTenureYears } = input;
  const months = Math.max(1, loanTenureYears * 12);
  const monthlyRate = annualInterestRate / 100 / 12;
  const principal = Math.max(0, loanAmount);
  const downpayment = Math.max(0, propertyPrice - principal);

  let monthlyRepayment = 0;
  if (monthlyRate === 0) {
    monthlyRepayment = principal / months;
  } else {
    const factor = (1 + monthlyRate) ** months;
    monthlyRepayment = (principal * monthlyRate * factor) / (factor - 1);
  }

  let balance = principal;
  let totalInterest = 0;

  for (let i = 0; i < months; i += 1) {
    const interest = balance * monthlyRate;
    const principalPaid = monthlyRepayment - interest;
    totalInterest += interest;
    balance = Math.max(0, balance - principalPaid);
  }

  const totalRepayment = monthlyRepayment * months;
  const totalPrincipal = principal;
  const principalShare = totalRepayment > 0 ? Math.round((totalPrincipal / totalRepayment) * 100) : 0;
  const interestShare = 100 - principalShare;

  return {
    monthlyRepayment: Math.round(monthlyRepayment),
    totalRepayment: Math.round(totalRepayment),
    totalInterest: Math.round(totalInterest),
    totalPrincipal,
    downpayment,
    principalShare,
    interestShare,
  };
}

/** Maximum loan-to-value ratio used in the affordability calculator. */
export const MAX_LOAN_TO_VALUE = 0.75;

export function defaultLoanToValue(): number {
  return MAX_LOAN_TO_VALUE;
}

export function maxLoanAmount(propertyPrice: number): number {
  return Math.round(propertyPrice * MAX_LOAN_TO_VALUE);
}

export function clampLoanAmount(propertyPrice: number, loanAmount: number): number {
  return Math.min(Math.max(0, loanAmount), maxLoanAmount(propertyPrice));
}

export function defaultInterestRate(): number {
  return 3.5;
}

export function defaultLoanTenureYears(flatType: string): number {
  return flatType === "hdb" ? 25 : 30;
}

export function formatSgd(amount: number): string {
  return `S$ ${amount.toLocaleString("en-SG")}`;
}
