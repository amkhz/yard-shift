import { useEffect } from 'react';
import { useAppState, useAppDispatch, actions } from '../core/store.jsx';
import { getSession, onAuthStateChange, signOut } from '../services/auth.js';
import AuthForm from './components/AuthForm.jsx';
import SalesList from './components/SalesList.jsx';
import SaleDetail from './components/SaleDetail.jsx';
import './App.css';

function App() {
  const { user, view, error } = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    getSession().then((session) => {
      dispatch({ type: actions.SET_USER, payload: session?.user ?? null });
    });

    const subscription = onAuthStateChange((session) => {
      dispatch({ type: actions.SET_USER, payload: session?.user ?? null });
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await signOut();
    dispatch({ type: actions.SET_USER, payload: null });
    dispatch({ type: actions.SET_VIEW, payload: 'sales' });
  }

  if (!user) return <AuthForm />;

  return (
    <div className="app">
      <header className="header">
        <h1 className="header-title">Yard Shift</h1>
        <button className="btn btn-ghost" onClick={handleSignOut}>Sign Out</button>
      </header>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: actions.CLEAR_ERROR })}>
            Dismiss
          </button>
        </div>
      )}

      <main className="main">
        {view === 'sales' && <SalesList />}
        {view === 'sale-detail' && <SaleDetail />}
      </main>
    </div>
  );
}

export default App;
