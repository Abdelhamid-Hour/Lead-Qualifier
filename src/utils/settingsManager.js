import { supabase } from './supabaseClient.js';
import { DEFAULT_MESSAGES, DEFAULT_SOCIAL_DOMAINS, DEFAULT_SAAS_DOMAINS } from './constants.js';

export async function loadDBSettings() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('data')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (data && data.data) {
      return data.data;
    }
  } catch (err) {
    console.error('Settings load error:', err);
  }
  
  return {
    socialDomains: [...DEFAULT_SOCIAL_DOMAINS],
    saasDomains: [...DEFAULT_SAAS_DOMAINS],
    messages: { ...DEFAULT_MESSAGES }
  };
}

export async function saveDBSettings(settingsData) {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ id: 1, data: settingsData });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Settings save error:', err);
    return false;
  }
}
