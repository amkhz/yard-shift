import { useState, useEffect } from 'react';
import { useAppState, useAppDispatch, actions } from '../../core/store.jsx';
import { fetchSales, createSale } from '../../services/sales.js';
import { formatDate } from '../../core/utils.js';

const STATUS_LABELS = { draft: 'Draft', active: 'Live', completed: 'Done' };

export default function SalesList() {
  const { sales, loading } = useAppState();
  const dispatch = useAppDispatch();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadSales();
  }, []);

  async function loadSales() {
    dispatch({ type: actions.SET_LOADING, payload: true });
    try {
      const data = await fetchSales();
      dispatch({ type: actions.SET_SALES, payload: data });
    } catch (err) {
      dispatch({ type: actions.SET_ERROR, payload: err.message });
    }
    dispatch({ type: actions.SET_LOADING, payload: false });
  }

  function openSale(sale) {
    dispatch({ type: actions.SET_CURRENT_SALE, payload: sale });
    dispatch({ type: actions.SET_VIEW, payload: 'sale-detail' });
  }

  if (loading && sales.length === 0) {
    return <p className="loading-text">Loading your sales...</p>;
  }

  return (
    <div className="sales-list">
      <div className="sales-header">
        <h2>Your Sales</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          New Sale
        </button>
      </div>

      {showForm && (
        <CreateSaleForm
          onCreated={(sale) => {
            dispatch({ type: actions.ADD_SALE, payload: sale });
            setShowForm(false);
            openSale(sale);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {sales.length === 0 && !showForm ? (
        <div className="empty-state">
          <p>No sales yet. Create one to get started.</p>
        </div>
      ) : (
        <ul className="sale-cards">
          {sales.map((sale) => (
            <li key={sale.id}>
              <button className="sale-card" onClick={() => openSale(sale)}>
                <div className="sale-card-header">
                  <h3>{sale.title}</h3>
                  <span className={`badge badge-${sale.status}`}>
                    {STATUS_LABELS[sale.status]}
                  </span>
                </div>
                <p className="sale-card-meta">
                  {formatDate(new Date(sale.sale_date + 'T00:00:00'))} &middot; {sale.address}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CreateSaleForm({ onCreated, onCancel }) {
  const [title, setTitle] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('14:00');
  const [address, setAddress] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const sale = await createSale({
        title,
        saleDate,
        startTime,
        endTime,
        address,
      });
      onCreated(sale);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="create-sale-form card">
      <h3>New Sale</h3>
      <label className="field">
        <span className="field-label">Title</span>
        <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Spring Cleanout" required />
      </label>
      <label className="field">
        <span className="field-label">Date</span>
        <input className="field-input" type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required />
      </label>
      <div className="field-row">
        <label className="field">
          <span className="field-label">Start</span>
          <input className="field-input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </label>
        <label className="field">
          <span className="field-label">End</span>
          <input className="field-input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </label>
      </div>
      <label className="field">
        <span className="field-label">Address</span>
        <input className="field-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" required />
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Creating...' : 'Create Sale'}
        </button>
      </div>
    </form>
  );
}
