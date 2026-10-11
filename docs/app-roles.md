# App Roles

**Product:** EMI / Loan Calculator (browser-based, runs entirely on the user's own computer)

The app has two roles. They are different kinds of people: the first uses the app once, for a decision about their own money; the second uses it repeatedly, in conversation with other people, and is accountable for the numbers they quote.

---

## R-1 Loan Applicant

A Loan Applicant is a private person who is thinking about borrowing money for a large purchase such as a house, a car or a personal need, and who is not a finance professional. They do not know the loan formula and are often comparing figures from a bank offer against their own monthly budget. They can enter a loan amount, an annual interest rate and a loan term (in years or months), and see the monthly payment, the total interest, the total amount repaid and a month-by-month repayment schedule. They can change any figure and see the numbers update, and they can reset everything and start again. They must never be shown a result calculated from missing, invalid or out-of-range input, and they must never be led to believe the figures are a binding offer from a lender.

## R-2 Loan Officer

A Loan Officer is a bank or financial-advisory employee who talks to several customers a day and quotes loan figures to them during meetings or calls. They need numbers quickly, they are asked "what if the term were longer?" or "what if the rate were lower?" on the spot, and they are accountable if a quoted figure turns out to be wrong. They can use all the same calculation features as a Loan Applicant, and they additionally need to change one figure at a time and see the effect immediately, enter amounts the way they are written in their region (for example `1,00,000` or `100,000`), and give the customer a record of the quoted figures. They must never see a figure in the summary that disagrees with the repayment schedule, and they must never have customer loan details stored or sent anywhere outside their own browser.

---

## How the roles differ

| | Loan Applicant | Loan Officer |
|---|---|---|
| Frequency | Occasional, for one personal decision | Many times a day |
| Knowledge of loans | Low to medium | High |
| Main concern | "Can I afford this and what will it really cost me?" | "Can I give an accurate answer right now and prove what I quoted?" |
| Biggest risk | Making a bad borrowing decision from a wrong or misleading figure | Quoting a wrong figure to a customer |
