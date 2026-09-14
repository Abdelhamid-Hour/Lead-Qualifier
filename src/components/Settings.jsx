import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, ChevronDown, ChevronUp, RotateCcw, Globe, RefreshCw, Zap, FileEdit, Palette, Save } from 'lucide-react';

export default function Settings({ settings, onUpdateSettings, onResetSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('messages');
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleDomainChange = (field, value) => {
    const domains = value.split('\n').map(d => d.trim()).filter(Boolean);
    setLocalSettings({ ...localSettings, [field]: domains });
  };

  const handleMessageChange = (key, value) => {
    setLocalSettings({
      ...localSettings,
      messages: { ...localSettings.messages, [key]: value }
    });
  };

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setIsOpen(false);
  };

  const handleReset = () => {
    onResetSettings();
    setIsOpen(false);
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost btn-sm" onClick={handleReset} title="Reset to Defaults">
              <RotateCcw size={14} /> Reset
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} title="Save Settings">
              <Save size={14} /> Save
            </button>
          </div>
        )}
      </div>
      {isOpen && (
        <div className="settings-content">
          <div className="settings-tabs">
            <button
              className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >Messages</button>
            <button
              className={`tab ${activeTab === 'domains' ? 'active' : ''}`}
              onClick={() => setActiveTab('domains')}
            >Domains</button>
          </div>

          {activeTab === 'domains' && (
            <div className="settings-domains">
              <div className="domain-group">
                <label>Social Media Domains (one per line)</label>
                <textarea
                  value={localSettings.socialDomains.join('\n')}
                  onChange={(e) => handleDomainChange('socialDomains', e.target.value)}
                  rows={6}
                />
              </div>
              <div className="domain-group">
                <label>SaaS Platform Domains (one per line)</label>
                <textarea
                  value={localSettings.saasDomains.join('\n')}
                  onChange={(e) => handleDomainChange('saasDomains', e.target.value)}
                  rows={6}
                />
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="settings-messages">
              {['cat1', 'cat2', 'cat3', 'cat4', 'cat6'].map(key => (
                <div className="message-group" key={key}>
                  <label>{catLabels[key].icon} {catLabels[key].label} Message</label>
                  <textarea
                    value={localSettings.messages[key] || ''}
                    onChange={(e) => handleMessageChange(key, e.target.value)}
                    rows={4}
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
