import { useEffect } from 'react';
import { useAppState, useAppDispatch, actions } from '../core/store.jsx';
import { formatDate, slugify } from '../core/utils.js';
import './App.css';

function App() {
  const { theme } = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => dispatch({ type: actions.TOGGLE_THEME });

  return (
    <div className="app">
      <header className="header">
        <h1 className="header-title">Investiture</h1>
        <p className="header-subtitle">A modern React starter with clean architecture</p>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </header>

      <main className="main">
        <div className="card-grid">
          <div className="card">
            <h2 className="card-title">Architecture</h2>
            <p className="card-text">
              Four clean layers, each with a single job:
            </p>
            <ul className="card-list">
              <li><strong>content/</strong> — Text and copy (JSON)</li>
              <li><strong>design-system/</strong> — CSS tokens and variables</li>
              <li><strong>core/</strong> — Pure logic and state (no DOM)</li>
              <li><strong>services/</strong> — External API calls</li>
            </ul>
          </div>

          <div className="card">
            <h2 className="card-title">Design Tokens</h2>
            <p className="card-text">
              All colors, spacing, and typography are CSS variables. Toggle the theme to see them change live.
            </p>
            <div className="token-demo">
              <div className="token-swatch" />
              <span className="token-label">--color-accent</span>
            </div>
            <div className="token-demo">
              <div className="token-swatch token-swatch-surface" />
              <span className="token-label">--color-surface</span>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">Utilities</h2>
            <p className="card-text">
              Pure functions in <code>core/utils.js</code> — no side effects, fully testable.
            </p>
            <div className="util-demo">
              <code className="util-label">formatDate(new Date())</code>
              <span className="util-result">{formatDate(new Date())}</span>
            </div>
            <div className="util-demo">
              <code className="util-label">slugify("Hello World!")</code>
              <span className="util-result">{slugify('Hello World!')}</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Investiture v1.2.0</p>
      </footer>
    </div>
  );
}

export default App;
