import { useState, useEffect } from 'react';
import { useAppState, useAppDispatch, actions } from '../../core/store.jsx';
import { fetchItems, fetchCategories, subscribeToItems } from '../../services/items.js';
import { fetchSaleStats, updateSale } from '../../services/sales.js';
import ItemList from './ItemList.jsx';
import AddItemForm from './AddItemForm.jsx';

export default function SaleDetail() {
  const { currentSale, items, categories } = useAppState();
  const dispatch = useAppDispatch();
  const [stats, setStats] = useState({ totalItems: 0, itemsSold: 0, totalRevenue: 0 });
  const [showAddItem, setShowAddItem] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const channel = subscribeToItems(currentSale.id, handleRealtimeChange);
    return () => { channel.unsubscribe(); };
  }, [currentSale.id]);

  useEffect(() => {
    updateStats();
  }, [items]);

  async function loadData() {
    setLoading(true);
    try {
      const [itemsData, catsData] = await Promise.all([
        fetchItems(currentSale.id),
        categories.length ? Promise.resolve(categories) : fetchCategories(),
      ]);
      dispatch({ type: actions.SET_ITEMS, payload: itemsData });
      if (!categories.length) {
        dispatch({ type: actions.SET_CATEGORIES, payload: catsData });
      }
    } catch (err) {
      dispatch({ type: actions.SET_ERROR, payload: err.message });
    }
    setLoading(false);
  }

  async function updateStats() {
    try {
      const s = await fetchSaleStats(currentSale.id);
      setStats(s);
    } catch (_) { /* stats are best-effort */ }
  }

  function handleRealtimeChange(payload) {
    if (payload.eventType === 'INSERT') {
      loadData();
    } else if (payload.eventType === 'UPDATE') {
      loadData();
    } else if (payload.eventType === 'DELETE') {
      dispatch({ type: actions.REMOVE_ITEM, payload: payload.old.id });
    }
  }

  function goBack() {
    dispatch({ type: actions.SET_CURRENT_SALE, payload: null });
    dispatch({ type: actions.SET_ITEMS, payload: [] });
    dispatch({ type: actions.SET_VIEW, payload: 'sales' });
  }

  async function toggleSaleStatus() {
    const nextStatus = currentSale.status === 'draft' ? 'active'
      : currentSale.status === 'active' ? 'completed' : 'draft';
    try {
      const updated = await updateSale(currentSale.id, { status: nextStatus });
      dispatch({ type: actions.SET_CURRENT_SALE, payload: updated });
    } catch (err) {
      dispatch({ type: actions.SET_ERROR, payload: err.message });
    }
  }

  const statusAction = currentSale.status === 'draft' ? 'Go Live'
    : currentSale.status === 'active' ? 'End Sale' : 'Reopen';

  return (
    <div className="sale-detail">
      <div className="sale-detail-nav">
        <button className="btn btn-ghost" onClick={goBack}>&larr; Sales</button>
        <button className="btn btn-secondary" onClick={toggleSaleStatus}>{statusAction}</button>
      </div>

      <div className="sale-detail-header">
        <h2>{currentSale.title}</h2>
        <span className={`badge badge-${currentSale.status}`}>
          {currentSale.status}
        </span>
      </div>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-value">{stats.totalItems}</span>
          <span className="stat-label">Items</span>
        </div>
        <div className="stat">
          <span className="stat-value">{stats.itemsSold}</span>
          <span className="stat-label">Sold</span>
        </div>
        <div className="stat">
          <span className="stat-value">${stats.totalRevenue.toFixed(2)}</span>
          <span className="stat-label">Revenue</span>
        </div>
      </div>

      <div className="sale-detail-actions">
        <button className="btn btn-primary" onClick={() => setShowAddItem(true)}>
          Add Item
        </button>
      </div>

      {showAddItem && (
        <AddItemForm
          saleId={currentSale.id}
          categories={categories}
          onAdded={(item) => {
            dispatch({ type: actions.ADD_ITEM, payload: item });
            setShowAddItem(false);
          }}
          onCancel={() => setShowAddItem(false)}
        />
      )}

      {loading ? (
        <p className="loading-text">Loading items...</p>
      ) : (
        <ItemList items={items} />
      )}
    </div>
  );
}
