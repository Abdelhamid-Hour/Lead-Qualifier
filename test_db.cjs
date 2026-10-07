
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});
import('@supabase/supabase-js').then(supabase => {
  const client = supabase.createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  client.from('contacted_leads').upsert({
    phone: '+1234567890',
    name: 'test lead',
    first_list: 'test',
    contacted_at: new Date().toISOString()
  }, { onConflict: 'phone, name' }).then(res => {
    console.log(JSON.stringify(res, null, 2));
  });
});
