import { useState } from 'react';
import { Settings as SettingsIcon, ChevronDown, ChevronUp, RotateCcw, Globe, RefreshCw, Zap, FileEdit, Palette } from 'lucide-react';
import { DEFAULT_TEMPLATES } from '../utils/constants.js';

export default function Settings({ settings, onUpdateSettings, onResetSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('domains');
  const [editLang, setEditLang] = useState(settings.activeLanguage || 'fr');

  const handleDomainChange = (field, value) => {
    const domains = value.split('\n').map(d => d.trim()).filter(Boolean);
    onUpdateSettings({ ...settings, [field]: domains });
  };

  const handleMessageChange = (key, value) => {
    onUpdateSettings({
      ...settings,
      messageLanguages: {
        ...settings.messageLanguages,
        [editLang]: {
          ...(settings.messageLanguages?.[editLang] || {}),
          [key]: value
        }
      }
    });
  };

  const handleActiveLangChange = (lang) => {
    onUpdateSettings({
      ...settings,
      activeLanguage: lang
    });
    setEditLang(lang); // Automatically switch editor to active language
  };

  const catLabels = {
    cat1: { label: 'No Website', icon: <Globe size={14} className="text-danger" /> },
    cat2: { label: 'SaaS Redirect', icon: <RefreshCw size={14} className="text-warning" /> },
    cat3: { label: 'Broken Website', icon: <Zap size={14} className="text-danger" /> },
    cat4: { label: 'No Reservation', icon: <FileEdit size={14} className="text-warning" /> },
    cat6: { label: 'Needs Redesign', icon: <Palette size={14} className="text-primary" /> }
  };

  return (
    <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
      <div className="settings-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '16px' }}>
        <button className="settings-toggle" onClick={() => setIsOpen(!isOpen)} style={{ flex: 1 }}>
          <SettingsIcon size={16} /> Settings {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isOpen && (
          <button className="btn btn-ghost btn-sm" onClick={onResetSettings} title="Reset to Defaults">
            <RotateCcw size={14} /> Reset
          </button>
        )}
      </div>
      {isOpen && (
        <div className="settings-content">
          <div className="settings-tabs">
            <button
              className={`tab ${activeTab === 'domains' ? 'active' : ''}`}
              onClick={() => setActiveTab('domains')}
            >Domains</button>
            <button
              className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >Messages</button>
          </div>

          {activeTab === 'domains' && (
            <div className="settings-domains">
              <div className="domain-group">
                <label>Social Media Domains (one per line)</label>
                <textarea
                  value={settings.socialDomains.join('\n')}
                  onChange={(e) => handleDomainChange('socialDomains', e.target.value)}
                  rows={6}
                />
              </div>
              <div className="domain-group">
                <label>SaaS Platform Domains (one per line)</label>
                <textarea
                  value={settings.saasDomains.join('\n')}
                  onChange={(e) => handleDomainChange('saasDomains', e.target.value)}
                  rows={6}
                />
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="settings-messages">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ margin: 0, fontWeight: 'bold' }}>Active Target Language:</label>
                  <select 
                    value={settings.activeLanguage || 'fr'} 
                    onChange={(e) => handleActiveLangChange(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '4px', background: '#27272a', border: '1px solid #3f3f46', color: 'white' }}
                  >
                    {Object.entries(DEFAULT_TEMPLATES).map(([key, tpl]) => (
                      <option key={key} value={key}>{tpl.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ margin: 0 }}>Editing Language:</label>
                  <select 
                    value={editLang} 
                    onChange={(e) => setEditLang(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '4px', background: '#27272a', border: '1px solid #3f3f46', color: 'white' }}
                  >
                    {Object.entries(DEFAULT_TEMPLATES).map(([key, tpl]) => (
                      <option key={key} value={key}>{tpl.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {['cat1', 'cat2', 'cat3', 'cat4', 'cat6'].map(key => (
                <div className="message-group" key={key}>
                  <label>{catLabels[key].icon} {catLabels[key].label} Message</label>
                  <textarea
                    value={settings.messageLanguages?.[editLang]?.[key] || ''}
                    onChange={(e) => handleMessageChange(key, e.target.value)}
                    rows={4}
                    placeholder={`Write your message for ${DEFAULT_TEMPLATES[editLang]?.name} here...`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
