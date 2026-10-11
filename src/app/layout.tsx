import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EMI & Loan Calculator | Fast, Accurate Loan Estimates',
  description:
    'Calculate monthly payments (EMI), total interest, and full repayment schedule. 100% private, runs entirely offline in your browser.',
};

/**
 * Inline script that runs synchronously before any render so there is
 * no flash of the wrong theme. We read localStorage (with a try/catch),
 * fall back to prefers-color-scheme, and set data-theme on <html>.
 * Must NOT import anything from the app bundle - it executes raw.
 */
const themeInitScript = `(function(){
  var STORAGE_KEY='emi_calc_theme';
  var stored=null;
  try{stored=window.localStorage.getItem(STORAGE_KEY);}catch(e){}
  var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme=(stored==='dark'||stored==='light')?stored:(prefersDark?'dark':'light');
  document.documentElement.setAttribute('data-theme',theme);
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Synchronous theme initialiser — prevents flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
