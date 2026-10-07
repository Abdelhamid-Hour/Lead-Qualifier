import { supabase } from './supabaseClient.js';

/**
 * Mark a phone+name combination as contacted globally.
 */
export async function markAsContacted(phone, name, listName) {
  if (!phone || !name) return false;
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const cleanName = name.trim().toLowerCase();
  
  try {
    const { error } = await supabase
      .from('contacted_leads')
      .upsert({
        phone: cleanPhone,
        name: cleanName,
        first_list: listName || '',
        contacted_at: new Date().toISOString()
      }, { onConflict: 'phone, name' });
      
    if (error) {
       console.error('Supabase upsert error:', error);
       throw error;
    }
    return true;
  } catch (err) {
    console.error('Mark contacted error:', err);
    return false;
  }
}

/**
 * Check which leads from a list have already been contacted.
 * Returns a Set of keys: "phone|name"
 */
export async function getContactedLeads(leads) {
  if (!leads || leads.length === 0) return new Set();
  
  // We need to fetch all contacted leads that match these phones
  const cleanPhones = leads
    .map(l => l.phone ? l.phone.replace(/[^0-9+]/g, '') : '')
    .filter(p => p.length > 0);
    
  if (cleanPhones.length === 0) return new Set();

  try {
    const { data, error } = await supabase
      .from('contacted_leads')
      .select('phone, name')
      .in('phone', cleanPhones);
      
    if (error) throw error;
    
    // Create a set of "phone|name"
    const contactedSet = new Set();
    (data || []).forEach(row => {
      contactedSet.add(row.phone + '|' + row.name);
    });
    
    return contactedSet;
  } catch (err) {
    console.error('Get contacted error:', err);
    return new Set();
  }
}

/**
 * Load all contacted leads into memory.
 */
export async function loadAllContactedLeads() {
  try {
    const { data, error } = await supabase
      .from('contacted_leads')
      .select('phone, name');
      
    if (error) throw error;
    
    const contactedSet = new Set();
    (data || []).forEach(row => {
      contactedSet.add(row.phone + '|' + row.name);
    });
    return contactedSet;
  } catch (err) {
    console.error('Load all contacted error:', err);
    return new Set();
  }
}

export async function unmarkAsContacted(phone, name) {
  if (!phone || !name) return false;
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const cleanName = name.trim().toLowerCase();
  
  try {
    const { error } = await supabase
      .from('contacted_leads')
      .delete()
      .match({ phone: cleanPhone, name: cleanName });
      
    if (error) {
       console.error('Supabase delete error:', error);
       throw error;
    }
    return true;
  } catch (err) {
    console.error('Unmark contacted error:', err);
    return false;
  }
}

