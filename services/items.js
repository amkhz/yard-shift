import { supabase } from './supabase.js';

export async function fetchItems(saleId) {
  const { data, error } = await supabase
    .from('items')
    .select('*, categories(name)')
    .eq('sale_id', saleId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createItem(saleId, { name, price, categoryId, quantity }) {
  const { data, error } = await supabase
    .from('items')
    .insert({
      sale_id: saleId,
      name,
      price,
      category_id: categoryId || null,
      quantity: quantity || 1,
    })
    .select('*, categories(name)')
    .single();
  if (error) throw error;
  return data;
}

export async function markItemSold(itemId, soldPrice) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('items')
    .update({
      is_sold: true,
      sold_price: soldPrice,
      sold_by: user.id,
      sold_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select('*, categories(name)')
    .single();
  if (error) throw error;
  return data;
}

export async function unmarkItemSold(itemId) {
  const { data, error } = await supabase
    .from('items')
    .update({
      is_sold: false,
      sold_price: null,
      sold_by: null,
      sold_at: null,
    })
    .eq('id', itemId)
    .select('*, categories(name)')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteItem(itemId) {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId);
  if (error) throw error;
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data;
}

export function subscribeToItems(saleId, onChange) {
  return supabase
    .channel(`items:${saleId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'items', filter: `sale_id=eq.${saleId}` },
      onChange
    )
    .subscribe();
}
