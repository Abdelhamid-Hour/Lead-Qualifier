import { supabase } from './supabaseClient.js';

/**
 * Creates a full JSON backup of all lists, leads, coverage, and settings.
 * Downloads as a .json file to the user's computer.
 */
export async function downloadFullBackup() {
  try {
    const [listsRes, leadsRes, coverageRes, settingsRes] = await Promise.all([
      supabase.from('lists').select('*'),
      supabase.from('leads').select('*'),
      supabase.from('coverage').select('*'),
      supabase.from('settings').select('*')
    ]);

    if (listsRes.error) throw listsRes.error;
    if (leadsRes.error) throw leadsRes.error;

    const backup = {
      version: 1,
      created_at: new Date().toISOString(),
      lists: listsRes.data || [],
      leads: leadsRes.data || [],
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
    return { success: true, lists: listsRes.data?.length || 0, leads: leadsRes.data?.length || 0 };
  } catch (err) {
    console.error('Backup error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Restores data from a backup JSON file.
 * MERGES with existing data (does not wipe what's already there).
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

    // Restore lists (upsert to avoid duplicates)
    for (const list of backup.lists) {
      const { data: existing } = await supabase
        .from('lists')
        .select('id')
        .eq('name', list.name)
        .single();

      if (!existing) {
        const { error } = await supabase.from('lists').insert({
          id: list.id,
          name: list.name,
          created_at: list.created_at
        });
        if (!error) restoredLists++;
      } else {
        restoredLists++;
      }
    }

    // Restore leads (only insert leads that don't exist yet)
    for (const lead of backup.leads) {
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('id', lead.id)
        .single();

      if (!existing) {
        const { error } = await supabase.from('leads').insert(lead);
        if (!error) restoredLeads++;
      }
    }

    // Restore coverage
    if (backup.coverage && backup.coverage.length > 0) {
      await supabase.from('coverage').upsert(backup.coverage[0]);
    }

    // Restore settings
    if (backup.settings && backup.settings.length > 0) {
      await supabase.from('settings').upsert(backup.settings[0]);
    }

    return { success: true, restoredLists, restoredLeads };
  } catch (err) {
    console.error('Restore error:', err);
    return { success: false, error: err.message };
  }
}
