# EMI & Loan Calculator

A loan calculator that runs entirely in the browser. Enter a loan amount, an annual interest rate and a loan term, and it shows the monthly payment, the total interest, the total repayment and a month-by-month repayment schedule. It has a light and a dark theme.

Built as a take-home assignment for KnowledgeCity (Technology Division).

## Who it is for and why I chose it

I chose a loan calculator because it has two clearly different kinds of users and real edge cases (0% interest, very large amounts, very long terms, invalid input).

- **Loan Applicant:** a private person considering a loan, who wants to know what it costs per month and in total.
- **Loan Officer:** a bank or advisory employee who quotes figures to customers and needs fast, consistent "what if" answers.

The product documents are in the `docs/` folder:

- `docs/app-roles.md` - who uses the app
- `docs/jobs-to-be-done.md` - why they use it
- `docs/user-stories.md` - what the app does, with acceptance criteria and an Implemented / Not implemented status for every story

The status in `docs/user-stories.md` is the source of truth for what is built. Stories marked "Not implemented" are not in the app.

## Prerequisites

- Node.js: I tested with v22.18.0. Use Node.js 22 or a newer LTS version.
- npm (comes with Node.js)
- A current browser (Chrome, Edge, Firefox or Safari)

No account, API key, database or internet connection is needed to run the app after `npm install`.

## Install and run

All commands are run from the `src/` folder:

```
cd src
npm install
npm run dev
```

Then open http://localhost:3000.

To run a production build instead:

```
cd src
npm install
npm run build
npm run start
```

## Tests

```
cd src
npm test
```

The tests (Vitest) cover the calculation and validation logic (the numbers and exact error messages from the acceptance criteria) and the theme-choice logic. They do not test the screen itself; the screen was checked by hand (see below).

Other scripts: `npm run lint`.

## AI tools used

- **Antigravity** was the AI coding tool. It wrote all the application code. Two models were used inside Antigravity: Gemini 3.7 Flash (medium) first, then Claude Sonnet 4.6 (I switched when the first model reached its usage limit).
- **Claude (claude.ai chat)** was used to help plan: it helped me draft the three product documents and the prompts I gave to Antigravity, and to review Antigravity's reports and my screenshots. It did not write the application code. I reviewed and am responsible for the documents.
- The session transcripts are in `transcripts/`.

## Code changed by hand

None. I did not edit any file by hand. All code was written by the AI tool.

## How it was checked

- Unit tests and lint and a production build were run by the AI tool and I read the results.
- I tested the running app by hand in Chrome on Windows: the main calculation, the error messages, the years/months switch, reset, the extreme values (1,000,000,000,000 at 100% for 600 months), the theme button, the browser console, and the layout at narrow (mobile) widths.
- I did **not** test in Firefox or Safari.

## Assumptions and known limitations

- Interest is compounded monthly: monthly rate = annual rate / 12 / 100. Fees, insurance and other charges are not included. The app shows an "estimate only" notice for this reason.
- The amount is currency-neutral (no currency symbol).
- Valid ranges: loan amount greater than 0 up to 1,000,000,000,000; annual rate 0 to 100; term a whole number of months from 1 to 600 (50 years). The term can be typed in years or months; it must equal a whole number of months.
- Numbers are typed as text. Thousands separators are accepted (`100,000` and `1,00,000`), a decimal point is `.`, and scientific notation such as `1e5` is rejected.
- A field does not show an "Enter a..." message until the user has touched it and left it empty. The page starts without error messages, and Reset clears them again.
- All figures are calculated at full precision and rounded only when displayed. Because of this, a displayed interest and principal on one schedule row can differ from the displayed payment by 0.01.
- At values near the upper limit (hundreds of billions and above), displayed totals can be off by 0.01 from the exact value because of floating-point precision. This happens, for example, with 1,000,000,000,000 at 100% for 600 months, which shows `50,000,000,000,000.01` for total repayment. It does not appear in realistic loans.
- The theme choice (light or dark) is saved in the browser's local storage on the device. Nothing else is stored, and nothing is sent anywhere. If storage is blocked, the theme switch still works for the current visit.
- The app uses a system font stack and makes no external requests, so it works offline after install.
- Not built (marked "Not implemented" in the user stories): comparing two loans, a printable record, and an extra monthly payment.
