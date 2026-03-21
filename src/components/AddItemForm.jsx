import { useState } from 'react';
import { createItem } from '../../services/items.js';

export default function AddItemForm({ saleId, categories, onAdded, onCancel }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const item = await createItem(saleId, {
        name,
        price: Number(price),
        categoryId: categoryId || null,
        quantity: Number(quantity),
      });
      onAdded(item);
      setName('');
      setPrice('');
      setCategoryId('');
      setQuantity('1');
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="add-item-form card">
      <h3>Add Item</h3>

      <label className="field">
        <span className="field-label">Name</span>
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vintage lamp" required autoFocus />
      </label>

      <div className="field-row">
        <label className="field">
          <span className="field-label">Price</span>
          <input className="field-input" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="5.00" step="0.01" min="0" required />
        </label>
        <label className="field">
          <span className="field-label">Qty</span>
          <input className="field-input" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" />
        </label>
      </div>

      <label className="field">
        <span className="field-label">Category</span>
        <select className="field-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">None</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Adding...' : 'Add Item'}
        </button>
      </div>
    </form>
  );
}
