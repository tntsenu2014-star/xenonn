import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './lib/ThemeContext';
import { UserProvider } from './lib/UserContext';
import { prewarmCache } from './services/db';

// Pre-fetch critical data as soon as script runs
prewarmCache();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </ThemeProvider>
  </StrictMode>,
);

// Unregister service workers to avoid route interception cache issues in dev/preview
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}
