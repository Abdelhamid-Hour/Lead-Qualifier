import { supabase } from './supabaseClient.js';

/**
 * Creates a full JSON backup of all lists, leads, coverage, and settings.
 * Downloads as a .json file to the user's computer.
 */
export async function downloadFullBackup() {
  try {
    // Supabase has a default limit of 1000 rows per request.
    // We need to paginate to get ALL leads if there are more than 1000.
    let allLeads = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1);
        
      if (error) throw error;
      if (!data || data.length === 0) break;
      
      allLeads = allLeads.concat(data);
      if (data.length < pageSize) break; // Reached the end
      page++;
    }

    const [listsRes, coverageRes, settingsRes] = await Promise.all([
      supabase.from('lists').select('*').limit(10000), // Assuming < 10000 lists
      supabase.from('coverage').select('*'),
      supabase.from('settings').select('*')
    ]);

    if (listsRes.error) throw listsRes.error;

    const backup = {
      version: 1,
      created_at: new Date().toISOString(),
      lists: listsRes.data || [],
      leads: allLeads,
      coverage: coverageRes.data || [],
      settings: settingsRes.data || []
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead-qualifier-backup_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true, lists: listsRes.data?.length || 0, leads: allLeads.length };
  } catch (err) {
    console.error('Backup error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Restores data from a backup JSON file.
 * MERGES with existing data (does not wipe what's already there).
 * 
 * Strategy:
 * - For each list in the backup, find an existing list by name or create a new one.
 * - For each lead, strip the old id and list_id, assign the correct new list_id, and insert.
 * - Skip leads whose phone+list already exist to avoid duplicates.
 */
export async function restoreFromBackup(file) {
  try {
    const text = await file.text();
    const backup = JSON.parse(text);

    if (!backup.version || !backup.lists || !backup.leads) {
      throw new Error('Invalid backup file format');
    }

    let restoredLists = 0;
    let restoredLeads = 0;
    let skippedLeads = 0;
    const listIdMap = {}; // Maps old backup list_id -> new DB list_id

    // Step 1: Restore lists — find by name or create new
    for (const list of backup.lists) {
      const listName = list.name;
      if (!listName) continue;

      // Check if a list with this name already exists
      const { data: existing, error: findErr } = await supabase
        .from('lists')
        .select('id')
        .eq('name', listName)
        .limit(1);

      if (findErr) {
        console.error('Error finding list:', listName, findErr);
        continue;
      }

      if (existing && existing.length > 0) {
        // List exists — map old ID to existing ID
        listIdMap[list.id] = existing[0].id;
        restoredLists++;
      } else {
        // List doesn't exist — create it (let DB generate a new ID)
        const { data: newList, error: insertErr } = await supabase
          .from('lists')
          .insert({ name: listName, created_at: list.created_at || new Date().toISOString() })
          .select('id')
          .limit(1);

        if (insertErr) {
          console.error('Error creating list:', listName, insertErr);
          continue;
        }
        if (newList && newList.length > 0) {
          listIdMap[list.id] = newList[0].id;
          restoredLists++;
        }
      }
    }

    // Step 2: Restore leads — group by list, then bulk insert
    // First, get existing leads per list to avoid duplicates (match by phone)
    for (const [oldListId, newListId] of Object.entries(listIdMap)) {
      const leadsForList = backup.leads.filter(l => String(l.list_id) === String(oldListId));
      if (leadsForList.length === 0) continue;

      // Get existing phones in this list to skip duplicates
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('phone')
        .eq('list_id', newListId);
      
      const existingPhones = new Set((existingLeads || []).map(l => l.phone).filter(Boolean));

      // Filter out duplicates and prepare clean leads (no old id)
      const newLeads = [];
      for (const lead of leadsForList) {
        if (lead.phone && existingPhones.has(lead.phone)) {
          skippedLeads++;
          continue;
        }
        
        // Build a clean lead object without the old id — let DB auto-generate
        newLeads.push({
          list_id: newListId,
          name: lead.name || '',
          type: lead.type || '',
          phone: lead.phone || '',
          rating: lead.rating || '',
          reviews: lead.reviews || '',
          website: lead.website || '',
          gmaps_link: lead.gmaps_link || lead.gmapsLink || '',
          category: lead.category || 'not_checked',
          message: lead.message || '',
          wa_link: lead.wa_link || lead.waLink || ''
        });
      }

      if (newLeads.length === 0) continue;

      // Bulk insert in chunks of 500
      const chunkSize = 500;
      for (let i = 0; i < newLeads.length; i += chunkSize) {
        const chunk = newLeads.slice(i, i + chunkSize);
        const { error } = await supabase.from('leads').insert(chunk);
        if (!error) {
          restoredLeads += chunk.length;
        } else {
          console.error('Error restoring leads chunk:', error);
        }
      }
    }

    // Step 3: Restore coverage
    if (backup.coverage && backup.coverage.length > 0) {
      await supabase.from('coverage').upsert(backup.coverage[0]);
    }

    // Step 4: Restore settings
    if (backup.settings && backup.settings.length > 0) {
      await supabase.from('settings').upsert(backup.settings[0]);
    }

    return { success: true, restoredLists, restoredLeads, skippedLeads };
  } catch (err) {
    console.error('Restore error:', err);
    return { success: false, error: err.message };
  }
}
