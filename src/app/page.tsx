'use client';

import React, { useState, useId, useMemo, useCallback, useSyncExternalStore } from 'react';
import {
  TermUnit,
  validateLoanAmount,
  validateInterestRate,
  validateLoanTerm,
  convertTermValue,
  calculateLoan,
  formatCurrency,
  LoanCalculationResult,
} from '@/lib/loanCalculator';
import { type Theme, setStoredTheme } from '@/lib/theme';

// ---------------------------------------------------------------------------
// useSyncExternalStore helpers for theme (module-level = stable references)
// ---------------------------------------------------------------------------

/**
 * Subscribe to changes of the data-theme attribute on <html>.
 * useSyncExternalStore calls this after hydration; the returned teardown is
 * called when the component unmounts.
 */
function subscribeToTheme(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => observer.disconnect();
}

/** Client snapshot: read the attribute the inline script already set. */
function getThemeSnapshot(): Theme {
  return (
    (document.documentElement.getAttribute('data-theme') as Theme | null) ?? 'light'
  );
}

/**
 * Server snapshot: always 'light'.
 * useSyncExternalStore uses this value on the server AND during hydration,
 * so the first client render matches the server render exactly — no mismatch.
 * After hydration React re-renders synchronously with the real client value.
 */
function getServerThemeSnapshot(): Theme {
  return 'light';
}

export default function LoanCalculatorPage() {
  // ---------------------------------------------------------------------------
  // S-13 Theme — hydration-safe via useSyncExternalStore
  // ---------------------------------------------------------------------------
  // getServerThemeSnapshot() returns 'light' on the server and during hydration
  // so the first client render is identical to the server render (no warning).
  // After hydration, React re-renders synchronously using getThemeSnapshot(),
  // which reads the data-theme attribute set by the layout's inline script.
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const toggleTheme = useCallback(() => {
    const next: Theme = getThemeSnapshot() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    setStoredTheme(next);
    // The MutationObserver in subscribeToTheme notifies useSyncExternalStore,
    // which triggers a synchronous re-render with the new value.
  }, []);

  // ---------------------------------------------------------------------------
  // Calculator state
  // ---------------------------------------------------------------------------
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [loanTerm, setLoanTerm] = useState<string>('');
  const [termUnit, setTermUnit] = useState<TermUnit>('years');

  // Track whether fields have been interacted with
  const [touched, setTouched] = useState<{
    loanAmount: boolean;
    interestRate: boolean;
    loanTerm: boolean;
  }>({
    loanAmount: false,
    interestRate: false,
    loanTerm: false,
  });

  // Unique accessible IDs
  const amountInputId = useId();
  const rateInputId = useId();
  const termInputId = useId();

  // Validate fields
  const amountValidation = useMemo(
    () => validateLoanAmount(loanAmount),
    [loanAmount]
  );
  const rateValidation = useMemo(
    () => validateInterestRate(interestRate),
    [interestRate]
  );
  const termValidation = useMemo(
    () => validateLoanTerm(loanTerm, termUnit),
    [loanTerm, termUnit]
  );

  // Field errors are visible if the user has interacted with the field or typed into it
  const amountError =
    (touched.loanAmount || loanAmount.length > 0) && !amountValidation.isValid
      ? amountValidation.error
      : null;

  const rateError =
    (touched.interestRate || interestRate.length > 0) && !rateValidation.isValid
      ? rateValidation.error
      : null;

  const termError =
    (touched.loanTerm || loanTerm.length > 0) && !termValidation.isValid
      ? termValidation.error
      : null;

  // Calculation is only computed if all 3 fields are completely valid
  const calculationResult: LoanCalculationResult | null = useMemo(() => {
    if (
      amountValidation.isValid &&
      amountValidation.value !== undefined &&
      rateValidation.isValid &&
      rateValidation.value !== undefined &&
      termValidation.isValid &&
      termValidation.value !== undefined
    ) {
      return calculateLoan(
        amountValidation.value,
        rateValidation.value,
        termValidation.value
      );
    }
    return null;
  }, [amountValidation, rateValidation, termValidation]);

  // Handle live changes
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, loanAmount: true }));
    setLoanAmount(e.target.value);
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, interestRate: true }));
    setInterestRate(e.target.value);
  };

  const handleTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, loanTerm: true }));
    setLoanTerm(e.target.value);
  };

  // Switch between Years and Months without clearing or invalidating valid inputs
  const handleUnitSwitch = (newUnit: TermUnit) => {
    if (newUnit === termUnit) return;
    const converted = convertTermValue(loanTerm, termUnit, newUnit);
    setTermUnit(newUnit);
    setLoanTerm(converted);
  };

  // Reset all inputs, results, errors and return unit to Years (S-6)
  const handleReset = () => {
    setLoanAmount('');
    setInterestRate('');
    setLoanTerm('');
    setTermUnit('years');
    setTouched({
      loanAmount: false,
      interestRate: false,
      loanTerm: false,
    });
  };

  // Calculate principal vs interest percentages for the proportion bar
  const principalAmount = amountValidation.value ?? 0;
  const totalRepayment = calculationResult?.totalRepayment ?? 0;
  const totalInterest = calculationResult?.totalInterest ?? 0;

  const principalPercent =
    totalRepayment > 0 ? (principalAmount / totalRepayment) * 100 : 100;
  const interestPercent =
    totalRepayment > 0 ? (totalInterest / totalRepayment) * 100 : 0;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="site-header">
        <div className="header-content">
          <div className="brand-wrapper">
            <div className="brand-icon" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="8" y1="6" x2="16" y2="6" />
                <line x1="16" y1="14" x2="16" y2="18" />
                <path d="M16 10h.01" />
                <path d="M12 10h.01" />
                <path d="M8 10h.01" />
                <path d="M12 14h.01" />
                <path d="M8 14h.01" />
                <path d="M12 18h.01" />
                <path d="M8 18h.01" />
              </svg>
            </div>
            <div>
              <h1 className="brand-title">EMI & Loan Calculator</h1>
              <p className="brand-tagline">
                Reliable loan quotes, monthly payments, and amortization schedule
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <div className="offline-badge" title="No server calls or external tracking">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Runs 100% Offline</span>
            </div>
            {/* S-13: Theme toggle button
                suppressHydrationWarning covers aria-label / aria-pressed, which
                are 'light' defaults during hydration but update to the real theme
                value in the synchronous post-hydration re-render from
                useSyncExternalStore. The icons are always rendered; CSS on
                html[data-theme] shows the correct one immediately, even before
                React hydrates. */}
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-pressed={theme === 'dark'}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              suppressHydrationWarning
            >
              {/* Sun icon — CSS shows this in dark mode only */}
              <svg
                className="theme-icon theme-icon-sun"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              {/* Moon icon — CSS shows this in light mode only */}
              <svg
                className="theme-icon theme-icon-moon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="calculator-grid">
          {/* Left Column: Input Form */}
          <section className="card parameters-card" aria-labelledby="form-heading">
            <div className="card-header">
              <h2 id="form-heading" className="card-title">
                Loan Parameters
              </h2>
              <p className="card-subtitle">
                Enter your borrowing figures to calculate monthly payments instantly.
              </p>
            </div>

            <form onSubmit={(e) => e.preventDefault()} noValidate>
              {/* Field 1: Loan Amount */}
              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor={amountInputId} className="form-label">
                    Loan Amount
                  </label>
                  <span className="form-helper">e.g. 100,000</span>
                </div>
                <div className="input-container">
                  <input
                    id={amountInputId}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={loanAmount}
                    onChange={handleAmountChange}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, loanAmount: true }))
                    }
                    className={`text-input ${amountError ? 'has-error' : ''}`}
                    aria-invalid={amountError ? 'true' : 'false'}
                    aria-describedby={
                      amountError ? `${amountInputId}-error` : undefined
                    }
                    placeholder="Enter amount (e.g. 100,000)"
                  />
                </div>
                {amountError && (
                  <p
                    id={`${amountInputId}-error`}
                    className="field-error-msg"
                    role="alert"
                    aria-live="polite"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{amountError}</span>
                  </p>
                )}
              </div>

              {/* Field 2: Annual Interest Rate */}
              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor={rateInputId} className="form-label">
                    Annual Interest Rate (%)
                  </label>
                  <span className="form-helper">0 to 100%</span>
                </div>
                <div className="input-container">
                  <input
                    id={rateInputId}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={interestRate}
                    onChange={handleRateChange}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, interestRate: true }))
                    }
                    className={`text-input has-suffix ${
                      rateError ? 'has-error' : ''
                    }`}
                    aria-invalid={rateError ? 'true' : 'false'}
                    aria-describedby={
                      rateError ? `${rateInputId}-error` : undefined
                    }
                    placeholder="Enter rate (e.g. 12)"
                  />
                  <span className="input-affix input-affix-suffix" aria-hidden="true">
                    %
                  </span>
                </div>
                {rateError && (
                  <p
                    id={`${rateInputId}-error`}
                    className="field-error-msg"
                    role="alert"
                    aria-live="polite"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{rateError}</span>
                  </p>
                )}
              </div>

              {/* Field 3: Loan Term with Segmented Control */}
              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor={termInputId} className="form-label">
                    Loan Term
                  </label>
                  <span className="form-helper">Up to 50 years (600 mo)</span>
                </div>
                <div className="term-control-wrapper">
                  {/* Segmented Control */}
                  <div
                    className="segmented-control"
                    role="group"
                    aria-label="Loan term unit selection"
                  >
                    <button
                      type="button"
                      className={`segmented-btn ${
                        termUnit === 'years' ? 'active' : ''
                      }`}
                      onClick={() => handleUnitSwitch('years')}
                      aria-pressed={termUnit === 'years'}
                    >
                      Years
                    </button>
                    <button
                      type="button"
                      className={`segmented-btn ${
                        termUnit === 'months' ? 'active' : ''
                      }`}
                      onClick={() => handleUnitSwitch('months')}
                      aria-pressed={termUnit === 'months'}
                    >
                      Months
                    </button>
                  </div>

                  {/* Term Input */}
                  <div className="input-container">
                    <input
                      id={termInputId}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={loanTerm}
                      onChange={handleTermChange}
                      onBlur={() =>
                        setTouched((prev) => ({ ...prev, loanTerm: true }))
                      }
                      className={`text-input ${termError ? 'has-error' : ''}`}
                      aria-invalid={termError ? 'true' : 'false'}
                      aria-describedby={
                        termError ? `${termInputId}-error` : undefined
                      }
                      placeholder={
                        termUnit === 'years'
                          ? 'Enter term in years (e.g. 5)'
                          : 'Enter term in months (e.g. 60)'
                      }
                    />
                  </div>
                </div>
                {termError && (
                  <p
                    id={`${termInputId}-error`}
                    className="field-error-msg"
                    role="alert"
                    aria-live="polite"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{termError}</span>
                  </p>
                )}
              </div>

              {/* Form Actions: Reset Button (S-6) */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-secondary"
                  aria-label="Reset all fields and calculations"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  <span>Reset Calculator</span>
                </button>
              </div>
            </form>
          </section>

          {/* Right Column: Calculation Results or Friendly Empty State */}
          <div className="results-column">
            {calculationResult ? (
              <>
                {/* Results Summary Card */}
                <section
                  className="results-summary-card"
                  aria-labelledby="results-heading"
                >
                  <h2 id="results-heading" className="sr-only">
                    Calculation Results
                  </h2>

                  {/* Hero Metric: Monthly Payment */}
                  <div className="hero-box">
                    <p className="hero-label">Estimated Monthly Payment</p>
                    <p className="hero-amount">
                      {formatCurrency(calculationResult.monthlyPayment)}
                    </p>
                  </div>

                  {/* Secondary Metrics: Total Interest & Total Repayment */}
                  <div className="secondary-stats-grid">
                    <div className="stat-tile">
                      <p className="stat-label">Total Interest</p>
                      <p className="stat-amount">
                        {formatCurrency(calculationResult.totalInterest)}
                      </p>
                    </div>
                    <div className="stat-tile">
                      <p className="stat-label">Total Repayment</p>
                      <p className="stat-amount">
                        {formatCurrency(calculationResult.totalRepayment)}
                      </p>
                    </div>
                  </div>

                  {/* Visual Proportion Breakdown Bar */}
                  <div className="breakdown-section">
                    <div className="breakdown-header">
                      <p className="breakdown-title">Payment Breakdown</p>
                      <span className="sr-only">
                        Principal represents {principalPercent.toFixed(1)}% of total repayment,
                        and interest represents {interestPercent.toFixed(1)}%.
                      </span>
                    </div>

                    <div
                      className="proportion-bar-container"
                      role="img"
                      aria-label={`Principal: ${principalPercent.toFixed(1)}%, Interest: ${interestPercent.toFixed(1)}%`}
                    >
                      <div
                        className="proportion-bar-segment proportion-bar-principal"
                        style={{ width: `${principalPercent}%` }}
                        title={`Principal: ${formatCurrency(principalAmount)} (${principalPercent.toFixed(1)}%)`}
                      />
                      <div
                        className="proportion-bar-segment proportion-bar-interest"
                        style={{ width: `${interestPercent}%` }}
                        title={`Interest: ${formatCurrency(totalInterest)} (${interestPercent.toFixed(1)}%)`}
                      />
                    </div>

                    <div className="breakdown-legend">
                      <div className="legend-item">
                        <span className="legend-color-dot dot-principal" aria-hidden="true" />
                        <span>Principal:</span>
                        <span className="legend-value">
                          {formatCurrency(principalAmount)} ({principalPercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color-dot dot-interest" aria-hidden="true" />
                        <span>Interest:</span>
                        <span className="legend-value">
                          {formatCurrency(totalInterest)} ({interestPercent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Estimate Notice (S-9) */}
                <aside className="estimate-notice" aria-label="Legal estimate disclaimer">
                  <svg
                    className="estimate-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <p>
                    This is an estimate only. Your lender&apos;s actual figures may differ because of
                    fees, rounding rules or how the interest rate is applied.
                  </p>
                </aside>

                {/* Repayment Schedule (S-3) */}
                <section className="schedule-card" aria-labelledby="schedule-heading">
                  <div className="schedule-header-row">
                    <div>
                      <h3 id="schedule-heading" className="card-title">
                        Amortization Schedule
                      </h3>
                      <p className="card-subtitle">
                        Month-by-month breakdown of principal reduction and remaining balance.
                      </p>
                    </div>
                    <span className="schedule-count-badge">
                      {calculationResult.schedule.length} Months
                    </span>
                  </div>

                  <div
                    className="table-scroll-container"
                    tabIndex={0}
                    role="region"
                    aria-label="Repayment schedule scrollable table"
                  >
                    <table className="schedule-table">
                      <thead>
                        <tr>
                          <th className="text-left" scope="col">
                            Month
                          </th>
                          <th className="text-right" scope="col">
                            Payment
                          </th>
                          <th className="text-right" scope="col">
                            Principal
                          </th>
                          <th className="text-right" scope="col">
                            Interest
                          </th>
                          <th className="text-right" scope="col">
                            Remaining Balance
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculationResult.schedule.map((row) => (
                          <tr key={row.month}>
                            <td className="text-left font-medium">{row.month}</td>
                            <td className="text-right">{formatCurrency(row.payment)}</td>
                            <td className="text-right">{formatCurrency(row.principal)}</td>
                            <td className="text-right">{formatCurrency(row.interest)}</td>
                            <td className="text-right font-medium">
                              {formatCurrency(row.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            ) : (
              /* Friendly Empty State */
              <div className="empty-state-card" aria-live="polite">
                <div className="empty-icon-wrapper" aria-hidden="true">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <h3 className="empty-title">Ready to calculate</h3>
                <p className="empty-description">
                  Enter your loan amount, interest rate, and term on the left to see your monthly
                  payment, total interest, and full repayment schedule.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <p>Runs entirely in your browser. Only your theme choice is saved on this device.</p>
      </footer>
    </div>
  );
}
