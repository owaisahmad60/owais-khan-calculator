/**
 * Pure TypeScript calculation and validation logic for EMI / Loan Calculator.
 * Contains no React dependencies, adhering to acceptance criteria S-1 through S-9.
 */

export type TermUnit = 'years' | 'months';

export interface ScheduleRow {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

export interface LoanCalculationResult {
  monthlyPayment: number;
  totalRepayment: number;
  totalInterest: number;
  schedule: ScheduleRow[];
}

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
  value?: number;
}

/**
 * Parses raw input string into a number.
 * Supports comma-separated thousands (e.g., 100,000 or 1,00,000) and trimmed whitespace.
 * Disallows scientific notation (e.g. 1e5), multiple dots, or European style decimals (100.000,50).
 */
export function parseInputNumber(raw: string): { kind: 'empty' | 'invalid' | 'valid'; value?: number } {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { kind: 'empty' };
  }

  // Reject scientific notation
  if (/e/i.test(trimmed)) {
    return { kind: 'invalid' };
  }

  // Standard numeric pattern with optional commas in integer part and optional decimal point
  const standardPattern = /^-?[0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?$/;
  // Decimal starting with a period, e.g. .50
  const dotStartPattern = /^-?\.[0-9]+$/;

  if (!standardPattern.test(trimmed) && !dotStartPattern.test(trimmed)) {
    return { kind: 'invalid' };
  }

  const clean = trimmed.replace(/,/g, '');
  const num = Number(clean);

  if (!Number.isFinite(num)) {
    return { kind: 'invalid' };
  }

  return { kind: 'valid', value: num };
}

/**
 * Validates Loan Amount based on S-1 criteria:
 * - Empty: "Enter a loan amount"
 * - Non-numeric: "Enter a valid number"
 * - <= 0: "Loan amount must be greater than 0"
 * - > 1,000,000,000,000: "Loan amount cannot exceed 1,000,000,000,000"
 */
export function validateLoanAmount(raw: string): ValidationResult {
  const parsed = parseInputNumber(raw);

  if (parsed.kind === 'empty') {
    return { isValid: false, error: 'Enter a loan amount' };
  }

  if (parsed.kind === 'invalid' || parsed.value === undefined) {
    return { isValid: false, error: 'Enter a valid number' };
  }

  const val = parsed.value;

  if (val <= 0) {
    return { isValid: false, error: 'Loan amount must be greater than 0' };
  }

  if (val > 1_000_000_000_000) {
    return { isValid: false, error: 'Loan amount cannot exceed 1,000,000,000,000' };
  }

  return { isValid: true, error: null, value: val };
}

/**
 * Validates Annual Interest Rate (%) based on S-1 criteria:
 * - Empty: "Enter an interest rate"
 * - Non-numeric: "Enter a valid number"
 * - < 0 or > 100: "Interest rate must be between 0 and 100"
 */
export function validateInterestRate(raw: string): ValidationResult {
  const parsed = parseInputNumber(raw);

  if (parsed.kind === 'empty') {
    return { isValid: false, error: 'Enter an interest rate' };
  }

  if (parsed.kind === 'invalid' || parsed.value === undefined) {
    return { isValid: false, error: 'Enter a valid number' };
  }

  const val = parsed.value;

  if (val < 0 || val > 100) {
    return { isValid: false, error: 'Interest rate must be between 0 and 100' };
  }

  return { isValid: true, error: null, value: val };
}

/**
 * Validates Loan Term based on S-1 & S-4 criteria:
 * - Empty: "Enter a loan term"
 * - Non-numeric: "Enter a valid number"
 * - Term in months < 1: "Loan term must be at least 1 month"
 * - Term in months > 600: "Loan term cannot exceed 50 years (600 months)"
 * - Fractional months: "Loan term must be a whole number of months"
 */
export function validateLoanTerm(raw: string, unit: TermUnit): ValidationResult {
  const parsed = parseInputNumber(raw);

  if (parsed.kind === 'empty') {
    return { isValid: false, error: 'Enter a loan term' };
  }

  if (parsed.kind === 'invalid' || parsed.value === undefined) {
    return { isValid: false, error: 'Enter a valid number' };
  }

  const val = parsed.value;
  const months = unit === 'years' ? val * 12 : val;

  if (months < 1) {
    return { isValid: false, error: 'Loan term must be at least 1 month' };
  }

  if (months > 600) {
    return { isValid: false, error: 'Loan term cannot exceed 50 years (600 months)' };
  }

  const roundedMonths = Math.round(months);
  if (Math.abs(months - roundedMonths) > 1e-6) {
    return { isValid: false, error: 'Loan term must be a whole number of months' };
  }

  return { isValid: true, error: null, value: roundedMonths };
}

/**
 * Converts term input string when switching between Years and Months.
 * 5 years -> 60 months
 * 18 months -> 1.5 years
 */
export function convertTermValue(
  valueStr: string,
  fromUnit: TermUnit,
  toUnit: TermUnit
): string {
  if (fromUnit === toUnit) return valueStr;
  const trimmed = valueStr.trim();
  if (trimmed === '') return '';

  const parsed = parseInputNumber(trimmed);
  if (parsed.kind !== 'valid' || parsed.value === undefined) {
    return valueStr;
  }

  if (fromUnit === 'years' && toUnit === 'months') {
    const months = parsed.value * 12;
    return Number(months.toFixed(4)).toString();
  } else {
    const years = parsed.value / 12;
    return Number(years.toFixed(4)).toString();
  }
}

/**
 * Formats a currency value with 2 decimal places and thousands separators.
 * Ensures zero values are formatted as "0.00" (never "-0.00").
 */
export function formatCurrency(amount: number): string {
  const normalized = Math.abs(amount) < 1e-9 ? 0 : amount;
  return normalized.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Calculates loan EMI, total repayment, total interest, and full repayment schedule
 * using full internal precision (no intermediate rounding).
 *
 * Requirements:
 * - Unrounded monthly payment, each row's interest, principal, and balance.
 * - Round only when formatting for display.
 * - Summary:
 *     totalRepayment = unrounded monthly payment * termMonths
 *     totalInterest = totalRepayment - loanAmount
 * - Every schedule row shows the exact same unrounded payment as the summary.
 * - Treat a final balance with absolute value below 0.005 as exactly 0 (removing floating point noise).
 *   No other number is forced or adjusted.
 */
export function calculateLoan(
  loanAmount: number,
  annualRate: number,
  termMonths: number
): LoanCalculationResult {
  const r = annualRate / 12 / 100;
  let emi: number;

  if (r === 0) {
    emi = loanAmount / termMonths;
  } else {
    const discount = Math.pow(1 + r, -termMonths);
    if (discount === 0 || 1 - discount === 1) {
      const compound = Math.pow(1 + r, termMonths);
      emi = (loanAmount * (r * compound)) / (compound - 1);
    } else {
      emi = (loanAmount * r) / (1 - discount);
    }
  }

  const totalRepayment = r === 0 ? loanAmount : emi * termMonths;
  const totalInterest = totalRepayment - loanAmount;

  const schedule: ScheduleRow[] = [];
  let currentBalance = loanAmount;

  for (let m = 1; m <= termMonths; m++) {
    const payment = emi;
    let interest: number;
    let principal: number;

    if (r === 0) {
      interest = 0;
      principal = payment;
    } else {
      // Analytical principal calculation maintains full precision across large terms:
      const p = emi * Math.pow(1 + r, -(termMonths - m + 1));
      if (Number.isFinite(p) && p > 0 && Math.abs(currentBalance * r - (payment - p)) < 1e-4) {
        principal = p;
        interest = payment - principal;
      } else {
        interest = currentBalance * r;
        principal = payment - interest;
      }
    }

    let nextBalance = currentBalance - principal;

    // Treat final balance within floating point noise (< 0.005) as exactly 0
    if (m === termMonths && Math.abs(nextBalance) < 0.005) {
      nextBalance = 0;
    }

    schedule.push({
      month: m,
      payment,
      interest,
      principal,
      balance: nextBalance,
    });

    currentBalance = nextBalance;
  }

  return {
    monthlyPayment: emi,
    totalRepayment,
    totalInterest,
    schedule,
  };
}
