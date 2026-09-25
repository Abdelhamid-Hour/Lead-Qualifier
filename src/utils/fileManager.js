import { supabase } from './supabaseClient.js';
import * as XLSX from 'xlsx';
import { CATEGORY_LABELS } from './constants.js';

export async function selectSaveFolder() { return 'saved_leads'; }
export function hasFolderAccess() { return true; }

export function sanitizeFileName(name) {
  if (!name) return `Untitled_List_${Date.now()}`;
  return name.replace(/[^a-zA-Z0-9_\-\s\u00C0-\u024F]/g, '').replace(/\s+/g, '_').substring(0, 100) || 'leads';
}

const saveVersions = {};

export async function saveListToExcel(listName, leads, saveDirectory) {
  const cleanName = sanitizeFileName(listName);
  
  // "Latest wins" mechanism: Increment version for this list
  const version = (saveVersions[cleanName] || 0) + 1;
  saveVersions[cleanName] = version;
  
  try {
    let { data: listData, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('name', cleanName)
      .limit(1);

    if (listError) throw listError;
    if (saveVersions[cleanName] !== version) return { path: cleanName, superseded: true };

    if (!listData || listData.length === 0) {
      const { data: newList, error: insertError } = await supabase
        .from('lists')
        .insert({ name: cleanName })
        .select()
        .limit(1);
      if (insertError) throw insertError;
      listData = newList[0];
    } else {
      listData = listData[0];
    }

    const listId = listData.id;
    if (saveVersions[cleanName] !== version) return { path: cleanName, superseded: true };

    // SAFETY CHECK: If we are about to save 0 leads, check if DB already has leads.
    // If it does, REFUSE to wipe them — this is almost certainly a bug/race condition.
    if (leads.length === 0) {
      const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('list_id', listId);
      if (count > 0) {
        console.warn('SAFETY: Blocked saving 0 leads over', count, 'existing leads for list:', cleanName);
        return { path: cleanName };
      }
    }

    // 1. Fetch current IDs from DB
    const { data: existingIdsData, error: fetchErr } = await supabase
      .from('leads')
      .select('id')
      .eq('list_id', listId);
    
    if (fetchErr) throw fetchErr;
    if (saveVersions[cleanName] !== version) return { path: cleanName, superseded: true };
    
    const existingDbIds = existingIdsData.map(row => row.id);

    // 2. Format leads for upsert
    const currentLeadIds = new Set();
    const leadsToUpsert = [];
    
    if (leads.length > 0) {
      for (const l of leads) {
        const id = l.id || crypto.randomUUID();
        currentLeadIds.add(id);
        leadsToUpsert.push({
          id: id,
          list_id: listId,
          name: l.name ? String(l.name) : '',
          type: l.type ? String(l.type) : '',
          phone: l.phone ? String(l.phone) : '',
          rating: l.rating ? String(l.rating) : '',
          reviews: l.reviews ? String(l.reviews) : '',
          website: l.website ? String(l.website) : '',
          gmaps_link: l.gmapsLink ? String(l.gmapsLink) : '',
          category: l.category ? String(l.category) : 'not_checked',
          message: l.message ? String(l.message) : '',
          wa_link: l.waLink ? String(l.waLink) : ''
        });
      }
      
      // 3. Upsert leads in chunks
      const CHUNK_SIZE = 500;
      for (let i = 0; i < leadsToUpsert.length; i += CHUNK_SIZE) {
        if (saveVersions[cleanName] !== version) return { path: cleanName, superseded: true };
        const chunk = leadsToUpsert.slice(i, i + CHUNK_SIZE);
        const { error: upsertErr } = await supabase.from('leads').upsert(chunk);
        if (upsertErr) throw upsertErr;
      }
    }

    // 4. Identify obsolete IDs to delete
    const idsToDelete = existingDbIds.filter(id => !currentLeadIds.has(id));
    
    // 5. Delete obsolete IDs in chunks
    if (idsToDelete.length > 0) {
      const CHUNK_SIZE = 500;
      for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
        if (saveVersions[cleanName] !== version) return { path: cleanName, superseded: true };
        const deleteChunk = idsToDelete.slice(i, i + CHUNK_SIZE);
        const { error: deleteErr } = await supabase
          .from('leads')
          .delete()
          .in('id', deleteChunk);
        if (deleteErr) throw deleteErr;
      }
    }
    return { path: cleanName };
  } catch (err) {
    console.error('Save error:', err);
    return null;
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
      .limit(1);

    if (listError) throw listError;
    if (!listData || listData.length === 0) return null;

    let allLeads = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: leadsPage, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('list_id', listData[0].id)
        .order('created_at', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (leadsError) throw leadsError;

      if (leadsPage && leadsPage.length > 0) {
        allLeads = allLeads.concat(leadsPage);
        if (leadsPage.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    return allLeads.map((row) => ({
      id: row.id, // CRITICAL FIX: Keep original DB ID instead of crypto.randomUUID()
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

