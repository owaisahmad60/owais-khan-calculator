# User Stories with Acceptance Criteria

Every story names the job it serves (see `jobs-to-be-done.md`) and the role that job belongs to (see `app-roles.md`).

## Input limits used in the criteria below

| Field | Valid range |
|---|---|
| Loan amount | greater than 0 up to 1,000,000,000,000 (smallest amount: 0.01) |
| Annual interest rate (%) | 0 to 100 inclusive |
| Loan term | whole number of months from 1 to 600 (50 years), entered in months or years |

Money values are shown with 2 decimals and thousands separators (for example `8,884.88`). Interest is calculated monthly: monthly rate = annual rate ÷ 12 ÷ 100.

## Status summary

| Story | Serves job | Role | Status |
|---|---|---|---|
| S-1 Monthly payment | J-1 | Loan Applicant | Implemented |
| S-2 Total interest and total repayment | J-2 | Loan Applicant | Implemented |
| S-3 Repayment schedule | J-4 | Loan Applicant | Implemented |
| S-4 Term in years or months | J-3 | Loan Applicant | Implemented |
| S-5 Live update when I change a figure | J-5 | Loan Officer | Implemented |
| S-6 Reset | J-5 | Loan Officer | Implemented |
| S-7 Amounts typed the way people write them | J-5 | Loan Officer | Implemented |
| S-8 Consistent figures everywhere | J-7 | Loan Officer | Implemented |
| S-9 Estimate notice | J-2 | Loan Applicant | Implemented |
| S-10 Compare two loans | J-3 | Loan Applicant | Not implemented |
| S-11 Printable record | J-6 | Loan Officer | Not implemented |
| S-12 Extra monthly payment | J-2 | Loan Applicant | Not implemented |
| S-13 Light and dark theme | J-8 | Loan Officer | Implemented |

---

## S-1 Monthly payment

**Serves J-1 (Loan Applicant). Status: Implemented**

"As a Loan Applicant, I want to enter a loan amount, an annual interest rate and a loan term and see my monthly payment, so that I can check whether the loan fits my monthly budget."

**Acceptance criteria**

1. Given loan amount 100,000, annual rate 12 and term 12 months, when all three fields are filled, then the monthly payment shows `8,884.88`.
2. Given loan amount 12,000, annual rate 0 and term 12 months, then the monthly payment shows `1,000.00` (no error, no `NaN` and no `Infinity`).
3. Given loan amount 0.01, rate 0 and term 1 month, then the monthly payment shows `0.01`.
4. Given loan amount 1,000,000,000,000, rate 100 and term 600 months, then a finite, formatted number is shown (no `NaN`, no `Infinity`, no scientific notation).
5. Given the loan amount field is empty, then no result is shown and the message "Enter a loan amount" appears next to that field.
6. Given the interest rate field is empty, then no result is shown and the message "Enter an interest rate" appears next to that field. Given the term field is empty, the message is "Enter a loan term".
7. Given loan amount 0 or a negative number, then no result is shown and the message "Loan amount must be greater than 0" appears.
8. Given loan amount above 1,000,000,000,000, then no result is shown and the message "Loan amount cannot exceed 1,000,000,000,000" appears.
9. Given an interest rate below 0 or above 100, then no result is shown and the message "Interest rate must be between 0 and 100" appears.
10. Given a loan term of 0, then no result is shown and the message "Loan term must be at least 1 month" appears.
11. Given a loan term above 600 months (50 years), then no result is shown and the message "Loan term cannot exceed 50 years (600 months)" appears.
12. Given a field contains letters or symbols (for example `abc` or `12%`), then no result is shown and the message "Enter a valid number" appears.
13. Given an error message is showing, when I correct the field, then the message disappears and the result appears.
14. Given a result is showing, when I change a field to an invalid value, then the old result is removed (it is never shown beside an error).

---

## S-2 Total interest and total repayment

**Serves J-2 (Loan Applicant). Status: Implemented**

"As a Loan Applicant, I want to see the total interest and the total amount I will repay, so that I understand what the loan really costs."

**Acceptance criteria**

1. Given loan amount 100,000, rate 12 and term 12 months, then total repayment shows `106,618.55` and total interest shows `6,618.55`.
2. Given loan amount 12,000, rate 0 and term 12 months, then total interest shows `0.00` and total repayment shows `12,000.00`.
3. Given any valid input, then total repayment minus the loan amount equals the total interest shown (within 0.01).
4. Given any invalid input (see S-1), then total interest and total repayment are not shown.

---

## S-3 Repayment schedule

**Serves J-4 (Loan Applicant). Status: Implemented**

"As a Loan Applicant, I want to see a month-by-month schedule showing interest, principal and remaining balance, so that I can see how quickly my debt is actually going down."

**Acceptance criteria**

1. Given a valid input, then the schedule has exactly one row per month of the term (12 rows for a 12-month loan, 600 rows for a 600-month loan) and the rows are numbered from 1.
2. Given loan amount 100,000, rate 12 and term 12 months, then row 1 shows interest `1,000.00`, principal `7,884.88` and remaining balance `92,115.12`.
3. Given any valid input, then the remaining balance on the last row is `0.00` (never negative, never `-0.00`).
4. Given any valid input, then on every row the interest plus the principal equals the payment shown for that row (within 0.01).
5. Given rate 0, then the interest is `0.00` on every row and principal is equal on every row.
6. Given a 600-month term, then the schedule scrolls inside the page and the page stays responsive (no freeze, no crash).
7. Given invalid input, then no schedule is shown.

---

## S-4 Term in years or months

**Serves J-3 (Loan Applicant). Status: Implemented**

"As a Loan Applicant, I want to enter the loan term in years or in months, so that I can use the same unit that the lender used in their offer."

**Acceptance criteria**

1. Given the unit is Years and I enter 5, then the results are identical to entering 60 with the unit Months.
2. Given the unit is Years and the field shows 5, when I switch the unit to Months, then the field shows 60 and the results do not change.
3. Given the unit is Months and the field shows 18, when I switch to Years, then the field shows 1.5 and the results do not change.
4. Given the unit is Years and I enter 1.5, then the term is accepted as 18 months.
5. Given the unit is Years and I enter 1.55, or the unit is Months and I enter 12.5, then no result is shown and the message "Loan term must be a whole number of months" appears.
6. Given the unit is Years and I enter 50, then the term is accepted. Given I enter 51, then the message from S-1 criterion 11 appears.

---

## S-5 Live update when I change a figure

**Serves J-5 (Loan Officer). Status: Implemented**

"As a Loan Officer, I want the results to update as soon as I change any figure, so that I can answer a customer's 'what if' question without extra steps."

**Acceptance criteria**

1. Given loan amount 100,000, rate 12 and term 12 months are entered, when I change only the rate to 10, then the monthly payment changes to `8,791.59` without reloading the page and without pressing any button.
2. Given a result is showing, when I change one field, then the other fields keep their values.
3. Given I clear a field, then the results are removed and the "Enter ..." message for that field appears; when I type a valid value again, the results return.
4. Given I change the figures several times in quick succession, then the results shown always match the figures currently in the fields (never an earlier value).

---

## S-6 Reset

**Serves J-5 (Loan Officer). Status: Implemented**

"As a Loan Officer, I want to clear all figures with one action, so that I can start a new customer's quote without old numbers left over."

**Acceptance criteria**

1. Given figures, results and a schedule are showing, when I press Reset, then all input fields are empty and the results, schedule and notice disappear.
2. Given an error message is showing, when I press Reset, then the error message disappears and no new error is shown for the empty fields.
3. Given I press Reset, then the term unit returns to its default (Years).
4. Given I press Reset and then enter new valid figures, then the results show only the new figures.

---

## S-7 Amounts typed the way people write them

**Serves J-5 (Loan Officer). Status: Implemented**

"As a Loan Officer, I want to type or paste amounts with thousands separators, so that I can enter figures the way customers and documents write them."

**Acceptance criteria**

1. Given I enter `100,000` or `1,00,000` as the loan amount, then it is read as 100000.
2. Given I enter `100,000.50`, then it is read as 100000.5.
3. Given I enter `1.2.3` or `100.000,50`, then no result is shown and the message "Enter a valid number" appears.
4. Given I paste `  250000  ` (with spaces around it), then it is read as 250000.
5. Given I enter `1e5`, then no result is shown and the message "Enter a valid number" appears.

---

## S-8 Consistent figures everywhere

**Serves J-7 (Loan Officer). Status: Implemented**

"As a Loan Officer, I want every figure on the screen to come from the same calculation, so that the numbers I quote never contradict each other."

**Acceptance criteria**

1. Given any valid input, then the monthly payment in the summary is identical to the payment shown on every row of the schedule.
2. Given any valid input, then total repayment minus loan amount equals the total interest shown (within 0.01).
3. Given any valid input, then the loan amount equals the sum of the principal column of the schedule (to within 0.01).
4. Given the same inputs entered twice (including after a Reset), then the displayed results are identical.

---

## S-9 Estimate notice

**Serves J-2 (Loan Applicant). Status: Implemented**

"As a Loan Applicant, I want to be told that the figures are an estimate, so that I do not mistake them for a binding offer from a lender."

**Acceptance criteria**

1. Given a valid result is showing, then the notice "This is an estimate only. Your lender's actual figures may differ because of fees, rounding rules or how the interest rate is applied." is visible near the results.
2. Given no result is showing (empty or invalid input), then the notice is not shown.

---

## S-10 Compare two loans (next version)

**Serves J-3 (Loan Applicant). Status: Not implemented**

"As a Loan Applicant, I want to enter two loans and see them side by side, so that I can choose the cheaper or more affordable one."

**Acceptance criteria**

1. Given two loans with valid figures, then monthly payment, total interest and total repayment are shown side by side.
2. Given the two loans have different total repayments, then the loan with the lower total repayment is marked as cheaper overall.
3. Given the two loans have the same total repayment, then no loan is marked cheaper.
4. Given one loan has invalid input, then the message names which loan (A or B) has the problem and the other loan's results are still shown.

---

## S-11 Printable record (next version)

**Serves J-6 (Loan Officer). Status: Not implemented**

"As a Loan Officer, I want to print or save the quoted figures, so that the customer has a record of what I quoted."

**Acceptance criteria**

1. Given a valid result, when I press Print, then the browser print dialog opens and the printout contains the entered figures, the summary, the estimate notice and the schedule, without buttons or input boxes.
2. Given no valid result, then the Print button is disabled.
3. Given a 600-month schedule, then the printout spans several pages without cutting a row in half.

---

## S-12 Extra monthly payment (next version)

**Serves J-2 (Loan Applicant). Status: Not implemented**

"As a Loan Applicant, I want to see what happens if I pay a little extra each month, so that I can see how much interest and time I could save."

**Acceptance criteria**

1. Given a valid loan and an extra monthly payment greater than 0, then the app shows the new number of months to repay and the interest saved compared with no extra payment.
2. Given an extra payment of 0 or empty, then the results are the same as without it.
3. Given a negative or non-numeric extra payment, then the message "Extra payment must be 0 or more" or "Enter a valid number" appears and no savings are shown.
4. Given an extra payment larger than the loan amount, then the loan is shown as repaid in 1 month and the final payment is not greater than the remaining balance.

---

## S-13 Light and dark theme

**Serves J-8 (Loan Officer). Status: Implemented**

"As a Loan Officer, I want to switch the app between a light and a dark theme, so that I can read the figures comfortably in whatever lighting I am in."

**Acceptance criteria**

1. Given I open the app for the first time on a device set to dark (or light), then the app shows the dark (or light) theme.
2. Given any theme, when I activate the theme button, then the whole app switches to the other theme immediately and my entered figures, results and schedule stay as they were.
3. Given I chose a theme, when I reload the page, then the same theme is shown (my choice wins over the device setting).
4. Given the browser blocks storage, when I switch theme, then the switch still works for this visit and no error is shown.
5. Given either theme, then normal text has a contrast ratio of at least 4.5:1 and large text and controls at least 3:1.
6. Given I press Reset, then the theme stays as I chose it.
7. Given I use only the keyboard, then the theme button can be reached with Tab and operated with Enter or Space, and its accessible name says what it will do (for example "Switch to dark theme").

---

## Known limitations

- Figures are calculated at full precision and rounded only for display. With amounts near the upper limit (hundreds of billions and above), floating-point precision can make a displayed total differ from the exact value by 0.01. For example, 1,000,000,000,000 at 100% for 600 months shows a total repayment of `50,000,000,000,000.01`. The figures on the screen still agree with each other (S-8).
- The contrast ratios in S-13 criterion 5 were calculated from the colour values, not measured with a tool on the rendered page.
