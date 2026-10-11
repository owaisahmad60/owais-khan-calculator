import { describe, it, expect } from 'vitest';
import {
  parseInputNumber,
  validateLoanAmount,
  validateInterestRate,
  validateLoanTerm,
  convertTermValue,
  calculateLoan,
  formatCurrency,
} from './loanCalculator';

describe('Loan Calculator Pure Logic & Validation', () => {
  describe('S-1: Monthly payment & Basic Validations', () => {
    it('criterion 1: calculates monthly payment for 100,000 at 12% for 12 months as 8,884.88', () => {
      const result = calculateLoan(100000, 12, 12);
      expect(formatCurrency(result.monthlyPayment)).toBe('8,884.88');
    });

    it('criterion 2: calculates monthly payment for 12,000 at 0% for 12 months as 1,000.00', () => {
      const result = calculateLoan(12000, 0, 12);
      expect(formatCurrency(result.monthlyPayment)).toBe('1,000.00');
      expect(Number.isFinite(result.monthlyPayment)).toBe(true);
    });

    it('criterion 3: calculates monthly payment for 0.01 at 0% for 1 month as 0.01', () => {
      const result = calculateLoan(0.01, 0, 1);
      expect(formatCurrency(result.monthlyPayment)).toBe('0.01');
    });

    it('criterion 4: handles boundary 1,000,000,000,000 at 100% for 600 months with finite formatted number', () => {
      const result = calculateLoan(1000000000000, 100, 600);
      expect(Number.isFinite(result.monthlyPayment)).toBe(true);
      const formatted = formatCurrency(result.monthlyPayment);
      expect(formatted).not.toContain('NaN');
      expect(formatted).not.toContain('Infinity');
      expect(formatted).not.toContain('e');
      expect(formatted).toBe('83,333,333,333.33');
    });

    it('criterion 5: empty loan amount gives exact message "Enter a loan amount"', () => {
      expect(validateLoanAmount('')).toEqual({ isValid: false, error: 'Enter a loan amount' });
      expect(validateLoanAmount('   ')).toEqual({ isValid: false, error: 'Enter a loan amount' });
    });

    it('criterion 6: empty interest rate gives "Enter an interest rate" and empty term gives "Enter a loan term"', () => {
      expect(validateInterestRate('')).toEqual({ isValid: false, error: 'Enter an interest rate' });
      expect(validateLoanTerm('', 'years')).toEqual({ isValid: false, error: 'Enter a loan term' });
      expect(validateLoanTerm('', 'months')).toEqual({ isValid: false, error: 'Enter a loan term' });
    });

    it('criterion 7: loan amount 0 or negative gives "Loan amount must be greater than 0"', () => {
      expect(validateLoanAmount('0')).toEqual({
        isValid: false,
        error: 'Loan amount must be greater than 0',
      });
      expect(validateLoanAmount('-100')).toEqual({
        isValid: false,
        error: 'Loan amount must be greater than 0',
      });
      expect(validateLoanAmount('-0.5')).toEqual({
        isValid: false,
        error: 'Loan amount must be greater than 0',
      });
    });

    it('criterion 8: loan amount above 1,000,000,000,000 gives exact message', () => {
      expect(validateLoanAmount('1000000000000.01')).toEqual({
        isValid: false,
        error: 'Loan amount cannot exceed 1,000,000,000,000',
      });
      expect(validateLoanAmount('1,000,000,000,001')).toEqual({
        isValid: false,
        error: 'Loan amount cannot exceed 1,000,000,000,000',
      });
    });

    it('criterion 9: interest rate below 0 or above 100 gives "Interest rate must be between 0 and 100"', () => {
      expect(validateInterestRate('-1')).toEqual({
        isValid: false,
        error: 'Interest rate must be between 0 and 100',
      });
      expect(validateInterestRate('100.01')).toEqual({
        isValid: false,
        error: 'Interest rate must be between 0 and 100',
      });
      expect(validateInterestRate('0').isValid).toBe(true);
      expect(validateInterestRate('100').isValid).toBe(true);
    });

    it('criterion 10: loan term of 0 gives "Loan term must be at least 1 month"', () => {
      expect(validateLoanTerm('0', 'months')).toEqual({
        isValid: false,
        error: 'Loan term must be at least 1 month',
      });
      expect(validateLoanTerm('0', 'years')).toEqual({
        isValid: false,
        error: 'Loan term must be at least 1 month',
      });
      expect(validateLoanTerm('-2', 'months')).toEqual({
        isValid: false,
        error: 'Loan term must be at least 1 month',
      });
    });

    it('criterion 11: loan term above 600 months gives "Loan term cannot exceed 50 years (600 months)"', () => {
      expect(validateLoanTerm('601', 'months')).toEqual({
        isValid: false,
        error: 'Loan term cannot exceed 50 years (600 months)',
      });
      expect(validateLoanTerm('51', 'years')).toEqual({
        isValid: false,
        error: 'Loan term cannot exceed 50 years (600 months)',
      });
    });

    it('criterion 12: fields with letters or symbols give "Enter a valid number"', () => {
      expect(validateLoanAmount('abc')).toEqual({ isValid: false, error: 'Enter a valid number' });
      expect(validateInterestRate('12%')).toEqual({ isValid: false, error: 'Enter a valid number' });
      expect(validateLoanTerm('$5', 'years')).toEqual({ isValid: false, error: 'Enter a valid number' });
    });
  });

  describe('S-2: Total interest and total repayment', () => {
    it('criterion 1: 100,000 at 12% for 12 months displays total repayment 106,618.55 and total interest 6,618.55', () => {
      const result = calculateLoan(100000, 12, 12);
      expect(formatCurrency(result.monthlyPayment)).toBe('8,884.88');
      expect(formatCurrency(result.totalRepayment)).toBe('106,618.55');
      expect(formatCurrency(result.totalInterest)).toBe('6,618.55');
    });

    it('criterion 2: 12,000 at 0% for 12 months displays total interest 0.00 and total repayment 12,000.00', () => {
      const result = calculateLoan(12000, 0, 12);
      expect(formatCurrency(result.totalInterest)).toBe('0.00');
      expect(formatCurrency(result.totalRepayment)).toBe('12,000.00');
    });

    it('criterion 3: unrounded total repayment minus loan amount equals total interest exactly', () => {
      const testCases = [
        { P: 100000, rate: 12, months: 12 },
        { P: 250000, rate: 5.5, months: 360 },
        { P: 12000, rate: 0, months: 12 },
        { P: 50000, rate: 7.25, months: 60 },
      ];

      for (const { P, rate, months } of testCases) {
        const result = calculateLoan(P, rate, months);
        const diff = result.totalRepayment - P;
        expect(diff).toBeCloseTo(result.totalInterest, 10);
      }
    });
  });

  describe('S-3: Repayment schedule', () => {
    it('criterion 1: schedule has exactly one row per month numbered from 1', () => {
      const res12 = calculateLoan(100000, 12, 12);
      expect(res12.schedule.length).toBe(12);
      expect(res12.schedule[0].month).toBe(1);
      expect(res12.schedule[11].month).toBe(12);

      const res600 = calculateLoan(1000000000000, 100, 600);
      expect(res600.schedule.length).toBe(600);
      expect(res600.schedule[0].month).toBe(1);
      expect(res600.schedule[599].month).toBe(600);
    });

    it('criterion 2: row 1 for 100,000 at 12% for 12 months shows interest 1,000.00, principal 7,884.88, balance 92,115.12', () => {
      const result = calculateLoan(100000, 12, 12);
      const row1 = result.schedule[0];
      expect(formatCurrency(row1.interest)).toBe('1,000.00');
      expect(formatCurrency(row1.principal)).toBe('7,884.88');
      expect(formatCurrency(row1.balance)).toBe('92,115.12');
    });

    it('criterion 3: remaining balance on last row is 0.00 (never negative, never -0.00)', () => {
      const testCases = [
        { P: 100000, rate: 12, months: 12 },
        { P: 12000, rate: 0, months: 12 },
        { P: 250000, rate: 6.5, months: 180 },
        { P: 1000000000000, rate: 100, months: 600 },
      ];

      for (const { P, rate, months } of testCases) {
        const result = calculateLoan(P, rate, months);
        const lastRow = result.schedule[result.schedule.length - 1];
        expect(lastRow.balance).toBe(0);
        expect(formatCurrency(lastRow.balance)).toBe('0.00');
        expect(Object.is(lastRow.balance, -0)).toBe(false);
      }
    });

    it('criterion 4: on every row unrounded interest + principal equals payment', () => {
      const result = calculateLoan(100000, 12, 12);
      for (const row of result.schedule) {
        expect(row.interest + row.principal).toBeCloseTo(row.payment, 10);
      }
    });

    it('criterion 5: given rate 0, interest is 0.00 on every row and principal is equal on every row', () => {
      const result = calculateLoan(12000, 0, 12);
      for (const row of result.schedule) {
        expect(row.interest).toBe(0);
        expect(formatCurrency(row.interest)).toBe('0.00');
        expect(row.principal).toBe(1000);
      }
    });
  });

  describe('Full Precision Schedule & Summary Consistency (User Requirement)', () => {
    const cases = [
      { name: 'Reference loan (100k, 12%, 12m)', P: 100000, rate: 12, n: 12 },
      { name: '0% loan (12k, 0%, 12m)', P: 12000, rate: 0, n: 12 },
      { name: '600-month loan at 100% rate (100k, 100%, 600m)', P: 100000, rate: 100, n: 600 },
      { name: '1-month loan (10k, 12%, 1m)', P: 10000, rate: 12, n: 1 },
      { name: '1-month 0% loan (0.01, 0%, 1m)', P: 0.01, rate: 0, n: 1 },
    ];

    it.each(cases)(
      '$name: principal sums to loan amount, interest sums to total interest, final balance is 0, summary equals schedule (tolerance 1e-6)',
      ({ P, rate, n }) => {
        const res = calculateLoan(P, rate, n);

        const sumPrincipal = res.schedule.reduce((acc, row) => acc + row.principal, 0);
        const sumInterest = res.schedule.reduce((acc, row) => acc + row.interest, 0);
        const lastRow = res.schedule[n - 1];

        // 1. Principal column sums to the loan amount (tolerance 1e-6)
        expect(Math.abs(sumPrincipal - P)).toBeLessThan(1e-6);

        // 2. Interest column sums to total interest (tolerance 1e-6)
        expect(Math.abs(sumInterest - res.totalInterest)).toBeLessThan(1e-6);

        // 3. Final balance is zero
        expect(lastRow.balance).toBe(0);

        // 4. Summary equals schedule: totalRepayment = sum(principal) + sum(interest)
        expect(Math.abs(res.totalRepayment - (sumPrincipal + sumInterest))).toBeLessThan(1e-6);

        // 5. Every schedule row shows the exact unrounded payment as summary
        for (const row of res.schedule) {
          expect(row.payment).toBe(res.monthlyPayment);
        }
      }
    );

    it.each(cases)(
      '$name: for displayed values, rounding difference between interest + principal and payment on a row is <= 0.01',
      ({ P, rate, n }) => {
        const res = calculateLoan(P, rate, n);

        for (const row of res.schedule) {
          const dispPrincipal = Number(formatCurrency(row.principal).replace(/,/g, ''));
          const dispInterest = Number(formatCurrency(row.interest).replace(/,/g, ''));
          const dispPayment = Number(formatCurrency(row.payment).replace(/,/g, ''));

          const diff = Math.abs(dispPrincipal + dispInterest - dispPayment);
          expect(diff).toBeLessThanOrEqual(0.010001);
        }
      }
    );
  });

  describe('S-4: Term in years or months', () => {
    it('criterion 1: 5 years gives identical results to 60 months', () => {
      const resYears = calculateLoan(100000, 10, 5 * 12);
      const resMonths = calculateLoan(100000, 10, 60);
      expect(resYears.monthlyPayment).toBe(resMonths.monthlyPayment);
      expect(resYears.totalRepayment).toBe(resMonths.totalRepayment);
      expect(resYears.totalInterest).toBe(resMonths.totalInterest);
    });

    it('criterion 2: switching 5 Years to Months gives 60', () => {
      expect(convertTermValue('5', 'years', 'months')).toBe('60');
    });

    it('criterion 3: switching 18 Months to Years gives 1.5', () => {
      expect(convertTermValue('18', 'months', 'years')).toBe('1.5');
    });

    it('criterion 4: 1.5 Years is accepted as 18 months', () => {
      const validation = validateLoanTerm('1.5', 'years');
      expect(validation.isValid).toBe(true);
      expect(validation.value).toBe(18);
    });

    it('criterion 5: fractional months give "Loan term must be a whole number of months"', () => {
      expect(validateLoanTerm('1.55', 'years')).toEqual({
        isValid: false,
        error: 'Loan term must be a whole number of months',
      });
      expect(validateLoanTerm('12.5', 'months')).toEqual({
        isValid: false,
        error: 'Loan term must be a whole number of months',
      });
    });

    it('criterion 6: 50 years is accepted, 51 years is rejected with max limit message', () => {
      expect(validateLoanTerm('50', 'years').isValid).toBe(true);
      expect(validateLoanTerm('51', 'years')).toEqual({
        isValid: false,
        error: 'Loan term cannot exceed 50 years (600 months)',
      });
    });
  });

  describe('S-5: Live update values', () => {
    it('criterion 1: changing rate from 12 to 10 changes monthly payment to 8,791.59', () => {
      const res12 = calculateLoan(100000, 12, 12);
      expect(formatCurrency(res12.monthlyPayment)).toBe('8,884.88');

      const res10 = calculateLoan(100000, 10, 12);
      expect(formatCurrency(res10.monthlyPayment)).toBe('8,791.59');
    });
  });

  describe('S-7: Formatted typing support', () => {
    it('criterion 1: 100,000 and 1,00,000 are parsed as 100000', () => {
      expect(parseInputNumber('100,000')).toEqual({ kind: 'valid', value: 100000 });
      expect(parseInputNumber('1,00,000')).toEqual({ kind: 'valid', value: 100000 });
    });

    it('criterion 2: 100,000.50 is parsed as 100000.5', () => {
      expect(parseInputNumber('100,000.50')).toEqual({ kind: 'valid', value: 100000.5 });
    });

    it('criterion 3: 1.2.3 and 100.000,50 give "Enter a valid number"', () => {
      expect(validateLoanAmount('1.2.3')).toEqual({ isValid: false, error: 'Enter a valid number' });
      expect(validateLoanAmount('100.000,50')).toEqual({ isValid: false, error: 'Enter a valid number' });
    });

    it('criterion 4: pasting "  250000  " with spaces is parsed as 250000', () => {
      expect(parseInputNumber('  250000  ')).toEqual({ kind: 'valid', value: 250000 });
      expect(validateLoanAmount('  250000  ')).toEqual({ isValid: true, error: null, value: 250000 });
    });

    it('criterion 5: 1e5 gives "Enter a valid number"', () => {
      expect(validateLoanAmount('1e5')).toEqual({ isValid: false, error: 'Enter a valid number' });
      expect(validateInterestRate('1e1')).toEqual({ isValid: false, error: 'Enter a valid number' });
    });
  });

  describe('S-8: Consistent figures everywhere', () => {
    it('criterion 1: monthly payment in summary is identical to payment shown on every row of schedule', () => {
      const result = calculateLoan(100000, 12, 12);
      for (const row of result.schedule) {
        expect(row.payment).toBe(result.monthlyPayment);
      }
    });

    it('criterion 2: total repayment minus loan amount equals total interest exactly', () => {
      const result = calculateLoan(100000, 12, 12);
      expect(result.totalRepayment - 100000).toBeCloseTo(result.totalInterest, 10);
    });

    it('criterion 3: repeated runs produce identical deterministic results', () => {
      const resA = calculateLoan(100000, 12, 12);
      const resB = calculateLoan(100000, 12, 12);
      expect(resA).toEqual(resB);
    });
  });
});
