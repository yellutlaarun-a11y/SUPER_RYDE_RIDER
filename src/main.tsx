import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Tier 1: Early global Maps JavaScript quota and auth failure listeners
if (typeof window !== 'undefined') {
  let quotaNotified = false;
  const dispatchQuotaExceeded = () => {
    if (quotaNotified) return;
    quotaNotified = true;
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  };

  (window as any).gm_authFailure = () => {
    dispatchQuotaExceeded();
  };

  const origError = console.error;
  console.error = (...args: unknown[]) => {
    origError.apply(console, args);
    const msg = args.map((a) => String(a)).join(' ');
    if (
      msg.includes('OverQuotaMapError') || 
      msg.includes('QuotaExceededError') ||
      msg.includes('Maps Demo Key limit reached') ||
      msg.includes('daily quota for Maps JavaScript')
    ) {
      dispatchQuotaExceeded();
    }
  };

  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    origWarn.apply(console, args);
    const msg = args.map((a) => String(a)).join(' ');
    if (
      msg.includes('Maps Demo Key limit reached') ||
      msg.includes('daily quota for Maps JavaScript')
    ) {
      dispatchQuotaExceeded();
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
