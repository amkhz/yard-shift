import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from '../core/store.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>
);
