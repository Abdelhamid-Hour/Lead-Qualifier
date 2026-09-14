import { supabase } from './supabaseClient.js';
import * as XLSX from 'xlsx';
import { CATEGORY_LABELS } from './constants.js';

export async function selectSaveFolder() { return 'saved_leads'; }
export function hasFolderAccess() { return true; }

export function sanitizeFileName(name) {
  if (!name) return `Untitled_List_${Date.now()}`;
  return name.replace(/[^a-zA-Z0-9_\-\s\u00C0-\u024F]/g, '').replace(/\s+/g, '_').substring(0, 100) || 'leads';
}

const saveLocks = {};

export async function saveListToExcel(listName, leads, saveDirectory) {
  const cleanName = sanitizeFileName(listName);
  
  while (saveLocks[cleanName]) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  saveLocks[cleanName] = true;
  
  try {
    let { data: listData, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('name', cleanName)
      .single();

    if (listError && listError.code === 'PGRST116') {
      const { data: newList, error: insertError } = await supabase
        .from('lists')
        .insert({ name: cleanName })
        .select()
        .single();
      if (insertError) throw insertError;
      listData = newList;
    } else if (listError) {
      throw listError;
    }

    const listId = listData.id;

    // Remove old leads
    await supabase.from('leads').delete().eq('list_id', listId);

    // Insert new leads
    if (leads.length > 0) {
      const leadsToInsert = leads.map(l => ({
        list_id: listId,
        name: l.name,
        type: l.type || '',
        phone: l.phone || '',
        rating: l.rating || '',
        reviews: l.reviews || '',
        website: l.website || '',
        gmaps_link: l.gmapsLink || '',
        category: l.category || 'not_checked',
        message: l.message || '',
        wa_link: l.waLink || ''
      }));
      const { error: insertErr } = await supabase.from('leads').insert(leadsToInsert);
      if (insertErr) throw insertErr;
    }
    return { path: cleanName };
  } catch (err) {
    console.error('Save error:', err);
    return null;
  } finally {
    saveLocks[cleanName] = false;
  }
}

export async function loadSavedLists(saveDirectory) {
  try {
    const { data, error } = await supabase
      .from('lists')
      .select('name')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(f => ({ name: f.name }));
  } catch (err) {
    console.error('List error:', err);
    return [];
  }
}

export async function loadListFromExcel(listItem, saveDirectory) {
  try {
    const cleanName = sanitizeFileName(listItem.name);
    const { data: listData, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('name', cleanName)
      .single();

    if (listError) throw listError;

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('list_id', listData.id)
      .order('created_at', { ascending: true });

    if (leadsError) throw leadsError;

    return leads.map((row, index) => ({
      id: Date.now() + index, // keep local React keys
      name: row.name,
      type: row.type,
      phone: row.phone,
      rating: row.rating,
      reviews: row.reviews,
      website: row.website,
      gmapsLink: row.gmaps_link,
      category: row.category,
      message: row.message,
      waLink: row.wa_link
    }));
  } catch (err) {
    console.error('Load error:', err);
    return null; // Return null instead of [] to indicate failure
  }
}

export async function deleteSavedList(listName, saveDirectory) {
  try {
    const cleanName = sanitizeFileName(listName);
    const { data, error } = await supabase
      .from('lists')
      .delete()
      .eq('name', cleanName);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Delete error:', err);
    return null;
  }
}

export function downloadExcel(listName, leads) {
  const fileName = sanitizeFileName(listName) + '.xlsx';
  const rows = leads.map(lead => ({
    'Name': lead.name,
    'Type': lead.type || '',
    'Reviews': lead.reviews || '',
    'WhatsApp Link': lead.waLink ? 'Message' : '',
    'Phone': lead.phone || '',
    'Rate': lead.rating || '',
    'Website': lead.website ? 'Visit' : '',
    'Google Maps Link': lead.gmapsLink ? 'Maps' : '',
    'Category': CATEGORY_LABELS[lead.category] || lead.category,
    'First Msg': lead.message || ''
  }));
  
  const ws = XLSX.utils.json_to_sheet(rows);
  leads.forEach((lead, index) => {
    const rowNum = index + 2;
    if (lead.waLink && ws[`D${rowNum}`]) {
      ws[`D${rowNum}`].l = { Target: lead.waLink };
      ws[`D${rowNum}`].v = '💬 Send Message';
    }
    if (lead.website && ws[`G${rowNum}`]) {
      ws[`G${rowNum}`].l = { Target: lead.website };
      ws[`G${rowNum}`].v = '🔗 Visit Website';
    }
    if (lead.gmapsLink && ws[`H${rowNum}`]) {
      ws[`H${rowNum}`].l = { Target: lead.gmapsLink };
      ws[`H${rowNum}`].v = '📍 Open Maps';
    }
  });

  ws['!cols'] = [
    { wch: 35 }, { wch: 15 }, { wch: 10 }, { wch: 25 },
    { wch: 20 }, { wch: 6 },  { wch: 20 }, { wch: 20 }, 
    { wch: 20 }, { wch: 80 }
  ];

  ws['!rows'] = [];
  for (let i = 0; i <= leads.length; i++) {
    ws['!rows'].push({ hpt: 18 });
  }
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  XLSX.writeFile(wb, fileName);
}

