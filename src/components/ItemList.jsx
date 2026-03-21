import { useState } from 'react';
import { useAppDispatch, actions } from '../../core/store.jsx';
import { markItemSold, unmarkItemSold, deleteItem } from '../../services/items.js';

export default function ItemList({ items }) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>No items yet. Add some stuff to sell.</p>
      </div>
    );
  }

  const unsold = items.filter((i) => !i.is_sold);
  const sold = items.filter((i) => i.is_sold);

  return (
    <div className="item-list">
      {unsold.length > 0 && (
        <section>
          <h3 className="item-section-title">For Sale ({unsold.length})</h3>
          <ul className="item-cards">
            {unsold.map((item) => <ItemCard key={item.id} item={item} />)}
          </ul>
        </section>
      )}
      {sold.length > 0 && (
        <section>
          <h3 className="item-section-title sold-title">Sold ({sold.length})</h3>
          <ul className="item-cards">
            {sold.map((item) => <ItemCard key={item.id} item={item} />)}
          </ul>
        </section>
      )}
    </div>
  );
}

function ItemCard({ item }) {
  const dispatch = useAppDispatch();
  const [confirming, setConfirming] = useState(false);
  const [soldPriceInput, setSoldPriceInput] = useState(String(item.price));
  const [busy, setBusy] = useState(false);

  async function handleMarkSold(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await markItemSold(item.id, Number(soldPriceInput));
      dispatch({ type: actions.UPDATE_ITEM, payload: updated });
      setConfirming(false);
    } catch (err) {
      dispatch({ type: actions.SET_ERROR, payload: err.message });
    }
    setBusy(false);
  }

  async function handleUnmark() {
    setBusy(true);
    try {
      const updated = await unmarkItemSold(item.id);
      dispatch({ type: actions.UPDATE_ITEM, payload: updated });
    } catch (err) {
      dispatch({ type: actions.SET_ERROR, payload: err.message });
    }
    setBusy(false);
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteItem(item.id);
      dispatch({ type: actions.REMOVE_ITEM, payload: item.id });
    } catch (err) {
      dispatch({ type: actions.SET_ERROR, payload: err.message });
    }
    setBusy(false);
  }

  const categoryName = item.categories?.name;

  return (
    <li className={`item-card ${item.is_sold ? 'item-card-sold' : ''}`}>
      <div className="item-card-info">
        <span className="item-name">{item.name}</span>
        {categoryName && <span className="item-category">{categoryName}</span>}
      </div>
      <div className="item-card-price">
        ${Number(item.is_sold ? item.sold_price || item.price : item.price).toFixed(2)}
      </div>
      <div className="item-card-actions">
        {item.is_sold ? (
          <button className="btn btn-ghost btn-sm" onClick={handleUnmark} disabled={busy}>Undo</button>
        ) : confirming ? (
          <form onSubmit={handleMarkSold} className="sell-confirm">
            <input
              type="number"
              className="field-input field-input-sm"
              value={soldPriceInput}
              onChange={(e) => setSoldPriceInput(e.target.value)}
              step="0.01"
              min="0"
              required
              autoFocus
            />
            <button type="submit" className="btn btn-success btn-sm" disabled={busy}>Sell</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>X</button>
          </form>
        ) : (
          <>
            <button className="btn btn-success btn-sm" onClick={() => setConfirming(true)}>Sold</button>
            <button className="btn btn-ghost btn-sm" onClick={handleDelete} disabled={busy}>Del</button>
          </>
        )}
      </div>
    </li>
  );
}
