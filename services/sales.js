import { supabase } from './supabase.js';

export async function fetchSales() {
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_members!inner(role)')
    .order('sale_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createSale({ title, description, saleDate, startTime, endTime, address }) {
  const { data: { user } } = await supabase.auth.getUser();

  // Create the sale
  const { data, error } = await supabase
    .from('sales')
    .insert({
      host_id: user.id,
      title,
      description: description || '',
      sale_date: saleDate,
      start_time: startTime,
      end_time: endTime,
      address,
    })
    .select()
    .single();
  if (error) throw error;

  // Add the host as an accepted member (no trigger, no SECURITY DEFINER)
  const { error: memberError } = await supabase
    .from('sale_members')
    .insert({
      sale_id: data.id,
      user_id: user.id,
      role: 'host',
      invite_status: 'accepted',
    });
  if (memberError) throw memberError;

  return data;
}

export async function updateSale(id, updates) {
  const { data, error } = await supabase
    .from('sales')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSale(id) {
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function fetchSaleStats(saleId) {
  const { data, error } = await supabase
    .from('items')
    .select('is_sold, sold_price, price')
    .eq('sale_id', saleId);
  if (error) throw error;

  const totalItems = data.length;
  const itemsSold = data.filter((i) => i.is_sold).length;
  const totalRevenue = data
    .filter((i) => i.is_sold)
    .reduce((sum, i) => sum + Number(i.sold_price || i.price), 0);

  return { totalItems, itemsSold, totalRevenue };
}
