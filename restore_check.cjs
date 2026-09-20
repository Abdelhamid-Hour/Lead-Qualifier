// Deep analysis: get true counts and check for the cleared list
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nbvujpbfpnuwedloatur.supabase.co';
const supabaseKey = 'sb_publishable_W88wkiT3OJI2Op9OXYdooQ_7uN_psjh';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepCheck() {
  // 1. Get true total count
  const { count: totalCount } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true });
  console.log(`TRUE total leads count in DB: ${totalCount}`);
  
  // 2. Which list was cleared? Check the empty ones
  const emptyLists = [
    'Car_rental-morocco-tanger',
    'Car_rental-Mauritius-main',
    'Car_rental-France-Marseille'
  ];
  
  console.log('\n=== EMPTY LISTS ===');
  for (const name of emptyLists) {
    const { data: listData } = await supabase
      .from('lists')
      .select('id, created_at')
      .eq('name', name)
      .limit(1);
    if (listData && listData.length > 0) {
      console.log(`"${name}" => id=${listData[0].id}, created=${listData[0].created_at}`);
    }
  }
  
  // 3. Check if Supabase has Point-in-Time Recovery or any audit logs
  // Supabase free tier doesn't have PITR. Let's check if the "deleted" lists
  // from the merge feature were actually deleted from the `lists` table
  console.log('\n=== CHECKING DELETED LIST NAMES (from merge) ===');
  // The merge feature deleted old lists. Let's see which lists DON'T exist anymore.
  // We know from the coverage map the following lists might have been merged:
  
  // 4. Check if there are leads with list_ids that no longer match any list
  const { data: allListIds } = await supabase.from('lists').select('id');
  const validIds = new Set(allListIds.map(l => l.id));
  
  // Get ALL leads in batches (Supabase limits to 1000)
  let offset = 0;
  let orphanedLeads = [];
  let totalFetched = 0;
  while (true) {
    const { data: batch } = await supabase
      .from('leads')
      .select('id, list_id, name, phone')
      .range(offset, offset + 999);
    if (!batch || batch.length === 0) break;
    totalFetched += batch.length;
    const orphans = batch.filter(l => !validIds.has(l.list_id));
    orphanedLeads = [...orphanedLeads, ...orphans];
    offset += batch.length;
    if (batch.length < 1000) break;
  }
  
  console.log(`Total leads fetched across all pages: ${totalFetched}`);
  console.log(`Orphaned leads (their list was deleted): ${orphanedLeads.length}`);
  if (orphanedLeads.length > 0) {
    const grouped = {};
    orphanedLeads.forEach(l => {
      if (!grouped[l.list_id]) grouped[l.list_id] = [];
      grouped[l.list_id].push(l);
    });
    for (const [lid, leads] of Object.entries(grouped)) {
      console.log(`  Orphan group list_id=${lid}: ${leads.length} leads`);
      console.log(`    First 3: ${leads.slice(0, 3).map(l => l.name).join(', ')}`);
    }
    console.log('\n>>> THESE ORPHANED LEADS CAN BE RECOVERED! <<<');
  }
  
  // 5. Check the local xlsx file
  const XLSX = require('xlsx');
  const fs = require('fs');
  const savedDir = './saved_leads';
  if (fs.existsSync(savedDir)) {
    const files = fs.readdirSync(savedDir).filter(f => f.endsWith('.xlsx'));
    console.log('\n=== LOCAL EXCEL FILES (potential backups) ===');
    for (const file of files) {
      const wb = XLSX.readFile(`${savedDir}/${file}`);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      console.log(`  ${file}: ${data.length} leads`);
    }
  }
  
  // 6. Full listing of each list's lead count
  console.log('\n=== FULL LEAD COUNTS PER LIST ===');
  for (const list of allListIds) {
    const { count } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('list_id', list.id);
    
    const { data: listInfo } = await supabase
      .from('lists')
      .select('name')
      .eq('id', list.id)
      .single();
    
    console.log(`  "${listInfo?.name}" => ${count} leads`);
  }
}

deepCheck().catch(console.error);
