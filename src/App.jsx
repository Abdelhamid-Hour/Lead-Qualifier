import { useState, useEffect, useCallback, useRef } from 'react';
import PasteZone from './components/PasteZone.jsx';
import LeadsTable from './components/LeadsTable.jsx';
import Settings from './components/Settings.jsx';
import SavedLists from './components/SavedLists.jsx';
import StatsBar from './components/StatsBar.jsx';
import CoverageMap from './components/CoverageMap.jsx';
import Schedule from './components/Schedule.jsx';
import { parseGoogleMapsHTML } from './utils/parser.js';
import { autoClassify, checkWebsiteHealth } from './utils/classifier.js';
import { buildWhatsAppLink } from './utils/phoneUtils.js';
import { selectSaveFolder, saveListToExcel, loadSavedLists, loadListFromExcel, hasFolderAccess, deleteSavedList, downloadExcel } from './utils/fileManager.js';
import { DEFAULT_MESSAGES, DEFAULT_SOCIAL_DOMAINS, DEFAULT_SAAS_DOMAINS, personalizeMessage } from './utils/constants.js';
import { loadCoverage, saveCoverage, addNiche, removeNiche, addCountry, removeCountry, addCity, removeCity, toggleScan, updateCityNote } from './utils/coverageManager.js';

import { Target, Search, Edit2, AlertCircle, CheckCircle2, Loader2, Save, Map, List, Download, Menu, X, Clock, Layers } from 'lucide-react';
import Dialog from './components/Dialog.jsx';
import { loadDBSettings, saveDBSettings } from './utils/settingsManager.js';
import { loadAllContactedLeads, markAsContacted } from './utils/contactedManager.js';

const SETTINGS_KEY = 'lq_settings';
const LAST_LIST_KEY = 'lq_last_list';

// We'll still load initial default from memory while DB loads
function getInitialSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    socialDomains: [...DEFAULT_SOCIAL_DOMAINS],
    saasDomains: [...DEFAULT_SAAS_DOMAINS],
    messages: { ...DEFAULT_MESSAGES },
    saveDirectory: ''
  };
}

const deduplicateLeads = (leadsList) => {
  const seen = new Set();
  return leadsList.filter(l => {
    const key = `${l.name || ''}|${l.phone || ''}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export default function App() {
  const [settings, setSettings] = useState(getInitialSettings);
  const [leads, setLeads] = useState([]);
  const [listName, setListName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showWithWaOnly, setShowWithWaOnly] = useState(false);
  const [savedLists, setSavedLists] = useState([]);
  const [filePath, setFilePath] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkProgress, setCheckProgress] = useState({ done: 0, total: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [dialogState, setDialogState] = useState({ isOpen: false, title: '', message: '', type: 'confirm', onConfirm: null, confirmText: 'OK', cancelText: 'Cancel' });
  const nameInputRef = useRef(null);
  const [activeView, setActiveView] = useState('leads');
  const [coverageData, setCoverageData] = useState({ niches: [], countries: [] });
  const [selectedNiche, setSelectedNiche] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [contactedSet, setContactedSet] = useState(new Set());
  const initialLoadDoneRef = useRef(false);

  // Load DB settings on mount
  const settingsLoadedRef = useRef(false);
  useEffect(() => {
    loadDBSettings().then(dbSettings => {
      setSettings(prev => ({ ...prev, ...dbSettings }));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...getInitialSettings(), ...dbSettings }));
      settingsLoadedRef.current = true;
    });
  }, []);

  // Save settings on change — only after initial DB load
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (settingsLoadedRef.current) {
      saveDBSettings(settings);
    }
  }, [settings]);

  // Recalculate lead messages when templates change
  const prevMessagesRef = useRef(JSON.stringify(settings.messages));
  useEffect(() => {
    const currentMessages = JSON.stringify(settings.messages);
    if (currentMessages !== prevMessagesRef.current) {
      prevMessagesRef.current = currentMessages;
      setLeads(prevLeads => {
        let changed = false;
        const newLeads = prevLeads.map(lead => {
          if (lead.category !== 'not_checked' && lead.category !== 'cat5') {
            const newMessage = personalizeMessage(settings.messages[lead.category] || '', lead.name);
            const newWaLink = buildWhatsAppLink(lead.phone, newMessage);
            if (lead.message !== newMessage || lead.waLink !== newWaLink) {
              changed = true;
              return { ...lead, message: newMessage, waLink: newWaLink };
            }
          }
          return lead;
        });
        return changed ? newLeads : prevLeads;
      });
    }
  }, [settings.messages]);

  // Load saved lists from directory
  const refreshSavedLists = useCallback(async () => {
    const lists = await loadSavedLists(settings.saveDirectory);
    setSavedLists(lists);
  }, [settings.saveDirectory]);

  // Auto-save debounced — BLOCKED until initial load is done
  const saveTimeoutRef = useRef(null);
  useEffect(() => {
    // CRITICAL: Never auto-save before the initial load completes
    if (!initialLoadDoneRef.current) return;
    if (!listName) return;
    
    // Prevent creating ghost files: don't save if there are no leads AND the file doesn't exist yet
    if (leads.length === 0 && !filePath) {
      return;
    }
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      const result = await saveListToExcel(listName, leads, settings.saveDirectory);
      if (result && result.path) {
        setFilePath(result.path);
        localStorage.setItem(LAST_LIST_KEY, listName);
        refreshSavedLists();
      }
      setIsSaving(false);
    }, 1500);
    
    return () => clearTimeout(saveTimeoutRef.current);
  }, [leads, listName, settings.saveDirectory, refreshSavedLists, filePath]);

  // Initial load
  useEffect(() => {
    setIsLoadingApp(true);
    Promise.all([
      refreshSavedLists(),
      (async () => {
        const lastList = localStorage.getItem(LAST_LIST_KEY);
        if (lastList) {
          const loadedLeads = await loadListFromExcel({ name: lastList }, settings.saveDirectory);
          if (loadedLeads && loadedLeads.length > 0) {
            setLeads(loadedLeads);
            setListName(lastList);
          }
        }
      })(),
      loadCoverage(settings.saveDirectory).then(data => {
        if (data !== null) {
          setCoverageData(data);
          if (data.niches?.length > 0) {
            setSelectedNiche(data.niches[0]);
          }
          coverageInitializedRef.current = true;
        }
      }),
      loadAllContactedLeads().then(setContactedSet)
    ]).catch(err => {
      console.error('Initial load error:', err);
    }).finally(() => {
      initialLoadDoneRef.current = true;
      setIsLoadingApp(false);
    });
    
    // Failsafe: if promises hang, force unlock after 5 seconds
    const failsafe = setTimeout(() => {
      initialLoadDoneRef.current = true;
      setIsLoadingApp(false);
    }, 5000);
    return () => clearTimeout(failsafe);
  }, [refreshSavedLists, settings.saveDirectory]);

  // Auto-save coverage (debounced)
  const coverageSaveRef = useRef(null);
  const coverageInitializedRef = useRef(false);
  useEffect(() => {
    // Skip the very first render to avoid overwriting with empty data
    if (!coverageInitializedRef.current) return;
    
    if (coverageSaveRef.current) clearTimeout(coverageSaveRef.current);
    coverageSaveRef.current = setTimeout(() => {
      saveCoverage(coverageData, settings.saveDirectory);
    }, 1000);
    return () => clearTimeout(coverageSaveRef.current);
  }, [coverageData, settings.saveDirectory]);

  // Sync leads count to coverage if editing a linked list
  useEffect(() => {
    if (activeView === 'leads' && listName && coverageInitializedRef.current) {
      setCoverageData(prev => {
        let isUpdated = false;
        const next = {
          ...prev,
          countries: prev.countries.map(country => ({
            ...country,
            cities: country.cities.map(city => {
              let cityUpdated = false;
              const newScans = { ...city.scans };
              for (const niche in newScans) {
                if (newScans[niche].linkedList === listName) {
                  if (newScans[niche].leadsCount !== leads.length) {
                    newScans[niche] = { ...newScans[niche], leadsCount: leads.length };
                    cityUpdated = true;
                    isUpdated = true;
                  }
                }
              }
              return cityUpdated ? { ...city, scans: newScans } : city;
            })
          }))
        };
        return isUpdated ? next : prev;
      });
    }
  }, [leads, listName, activeView]);
  // Parse pasted HTML
  const handleParse = async (html) => {
    const parsed = parseGoogleMapsHTML(html);
    if (parsed.length === 0) {
      setDialogState({
        isOpen: true,
        type: 'alert',
        title: 'No Results Found',
        message: 'Make sure you copied the Google Maps results panel.',
        onConfirm: null,
      });
      return;
    }

    // Auto-classify
    const classified = parsed.map(lead => {
      const category = autoClassify(lead, settings);
      let message = '';
      let waLink = '';
      if (category !== 'not_checked' && category !== 'cat5') {
        message = personalizeMessage(settings.messages[category] || '', lead.name);
        waLink = buildWhatsAppLink(lead.phone, message);
      }
      return { ...lead, category, message, waLink };
    });

    const processLeads = (replace) => {
      let finalLeads = [];
      if (replace) {
        finalLeads = deduplicateLeads(classified);
      } else {
        finalLeads = deduplicateLeads([...leads, ...classified]);
      }
      setLeads(finalLeads);
      
      if (!listName && replace) {
        const now = new Date();
        const defaultName = `Leads_${now.toISOString().slice(0, 10)}_${now.getHours()}h${String(now.getMinutes()).padStart(2, '0')}`;
        setListName(defaultName);
      }
      checkHealth(finalLeads);
    };

    // Merge with existing or create new list
    if (leads.length > 0) {
      setDialogState({
        isOpen: true,
        type: 'confirm',
        title: 'Replace Current List?',
        message: 'You already have leads in the current list.\n\nClick REPLACE to overwrite the current list with the new data.\nClick ADD to merge the new data into the current list.',
        confirmText: 'Replace',
        cancelText: 'Add',
        onConfirm: () => processLeads(true),
        onCancel: () => processLeads(false)
      });
    } else {
      processLeads(true);
    }
    
    // Moved website health check into checkHealth function to avoid async issues
  };

  const checkHealth = async (classified) => {
    const toCheck = classified.filter(l => l.category === 'not_checked' && l.website);
    if (toCheck.length > 0) {
      setIsChecking(true);
      setCheckProgress({ done: 0, total: toCheck.length });

      for (let i = 0; i < toCheck.length; i++) {
        const lead = toCheck[i];
        const healthResult = await checkWebsiteHealth(lead.website);
        if (healthResult === 'cat3') {
          setLeads(prev => prev.map(l => {
            // Only update if the user hasn't manually changed it already
            if (l.id === lead.id && l.category === 'not_checked') {
              const message = personalizeMessage(settings.messages.cat3 || '', l.name);
              const waLink = buildWhatsAppLink(l.phone, message);
              return { ...l, category: 'cat3', message, waLink };
            }
            return l;
          }));
        }
        setCheckProgress({ done: i + 1, total: toCheck.length });
      }
      setIsChecking(false);
    }
  };



  // Update a single lead
  const handleUpdateLead = (leadId, updates) => {
    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, ...updates } : l
    ));
  };

  const handleDeleteLead = (leadId) => {
    setDialogState({
      isOpen: true,
      type: 'confirm',
      title: 'Remove Lead?',
      message: 'Are you sure you want to remove this lead?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      onConfirm: () => {
        setLeads(prev => prev.filter(l => l.id !== leadId));
      }
    });
  };

  const handleLoadList = async (listItem) => {
    setIsSidebarOpen(false);
    
    // FORCE SAVE CURRENT LIST
    if (listName && leads.length > 0) {
      setIsSaving(true);
      const saveResult = await saveListToExcel(listName, leads, settings.saveDirectory);
      setIsSaving(false);
      if (!saveResult) {
        setDialogState({
          isOpen: true,
          type: 'alert',
          title: 'Save Error',
          message: 'Failed to save the current list to the database. Please try again or check your connection.',
          confirmText: 'OK'
        });
        return;
      }
    }
    
    setIsLoadingLeads(true);
    const loadedLeads = await loadListFromExcel(listItem, settings.saveDirectory);
    if (loadedLeads !== null) {
      setLeads(loadedLeads);
      setListName(listItem.name);
      setActiveView('leads');
    } else {
      setDialogState({
        isOpen: true,
        title: 'Load Error',
        message: 'Failed to load the list from the database. Please check your connection.',
        type: 'alert',
        confirmText: 'OK'
      });
    }
    setIsLoadingLeads(false);
  };

  // New list
  const handleNewList = async (skipSave = false) => {
    // FORCE SAVE CURRENT LIST
    if (!skipSave && listName && leads.length > 0) {
      setIsSaving(true);
      const saveResult = await saveListToExcel(listName, leads, settings.saveDirectory);
      setIsSaving(false);
      if (!saveResult) {
        setDialogState({
          isOpen: true,
          type: 'alert',
          title: 'Save Error',
          message: 'Failed to save the current list. Cannot create a new list until the current one is saved.',
          confirmText: 'OK'
        });
        return;
      }
    }
    
    setLeads([]);
    const now = new Date();
    const defaultName = `Leads_${now.toISOString().slice(0, 10)}_${now.getHours()}h${String(now.getMinutes()).padStart(2, '0')}`;
    setListName(defaultName);
    setFilePath('');
    setSearchQuery('');
    setActiveView('leads');
    setIsSidebarOpen(false);
  };

  const handleDeleteList = (list) => {
    setDialogState({
      isOpen: true,
      type: 'confirm',
      title: 'Delete List?',
      message: `Are you sure you want to delete "${list.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await deleteSavedList(list.name, settings.saveDirectory);
        if (listName === list.name) {
          await handleNewList(true);
        }
        refreshSavedLists();
      },
      onCloseOverride: null
    });
  };



  // Rename
  const handleStartRename = () => {
    setEditName(listName);
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const handleFinishRename = async () => {
    if (!editName.trim() || editName === listName) {
      setIsEditingName(false);
      return;
    }

    // Check if name exists in other lists
    const nameExists = savedLists.some(l => l.name === editName);
    
    if (nameExists) {
      setDialogState({
        isOpen: true,
        type: 'alert',
        title: 'Name Already Exists',
        message: 'A list with this name already exists. Please choose a different name.',
        onConfirm: null
      });
      return; // stay in edit mode
    }
    
    // It was renamed! Delete the old file so we don't duplicate.
    await deleteSavedList(listName, settings.saveDirectory);
    
    // Update the real list name (this triggers auto-save which creates the new file)
    setListName(editName);
    setIsEditingName(false);
  };

  // === Coverage Handlers ===
  const handleAddNiche = (nicheName) => {
    setCoverageData(prev => addNiche(prev, nicheName));
  };
  const handleRemoveNiche = (nicheName) => {
    setCoverageData(prev => removeNiche(prev, nicheName));
  };
  const handleAddCountry = (countryName) => {
    setCoverageData(prev => addCountry(prev, countryName));
  };
  const handleRemoveCountry = (countryName) => {
    setCoverageData(prev => removeCountry(prev, countryName));
  };
  const handleAddCity = (countryName, cityName) => {
    setCoverageData(prev => addCity(prev, countryName, cityName));
  };
  const handleRemoveCity = async (countryName, cityName, deleteFiles = false) => {
    if (deleteFiles) {
      const city = coverageData.countries.find(c => c.name === countryName)?.cities.find(c => c.name === cityName);
      if (city && city.scans) {
        const promises = [];
        for (const niche in city.scans) {
          const linkedList = city.scans[niche].linkedList;
          if (linkedList) {
            promises.push(deleteSavedList(linkedList, settings.saveDirectory));
          }
        }
        await Promise.all(promises);
        refreshSavedLists();
      }
    }
    setCoverageData(prev => removeCity(prev, countryName, cityName));
  };
  const handleToggleScan = (countryName, cityName, niche) => {
    setCoverageData(prev => toggleScan(prev, countryName, cityName, niche));
  };
  const handleOpenCityList = async (linkedListName) => {
    if (!linkedListName) return;
    
    // FORCE SAVE CURRENT LIST
    if (listName && leads.length > 0) {
      setIsSaving(true);
      const saveResult = await saveListToExcel(listName, leads, settings.saveDirectory);
      setIsSaving(false);
      if (!saveResult) {
        setDialogState({
          isOpen: true,
          type: 'alert',
          title: 'Save Error',
          message: 'Failed to save the current list to the database. Please check your connection.',
          confirmText: 'OK'
        });
        return;
      }
    }
    
    setIsLoadingLeads(true);
    const loadedLeads = await loadListFromExcel({ name: linkedListName }, settings.saveDirectory);
    if (loadedLeads !== null) {
      // List exists in DB — load it
      setLeads(loadedLeads);
      setListName(linkedListName);
      setActiveView('leads');
      localStorage.setItem(LAST_LIST_KEY, linkedListName);
    } else {
      // List doesn't exist yet — open empty view with the name pre-set
      // The list will be created in DB only when the user pastes and parses leads
      setLeads([]);
      setListName(linkedListName);
      setFilePath('');
      setActiveView('leads');
    }
    setIsLoadingLeads(false);
    setIsSidebarOpen(false);
  };

  const showDialog = (opts) => {
    setDialogState({ isOpen: true, ...opts });
  };

  if (isLoadingApp) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <Loader2 size={32} className="animate-spin text-primary" />
        <p style={{ color: 'var(--text-muted)' }}>Loading Lead Qualifier...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1><Target className="text-primary" /> Lead Qualifier</h1>
          <div className="view-tabs">
            <button 
              className={`view-tab ${activeView === 'leads' ? 'active' : ''}`}
              onClick={() => setActiveView('leads')}
            >
              <List size={16} /> Leads
            </button>
            <button 
              className={`view-tab ${activeView === 'coverage' ? 'active' : ''}`}
              onClick={() => setActiveView('coverage')}
            >
              <Map size={16} /> Coverage Map
            </button>
            <button 
              className={`view-tab ${activeView === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveView('schedule')}
            >
              <Clock size={16} /> Schedule
            </button>
          </div>
        </div>
        {isChecking && (
          <div className="checking-badge">
            <Search size={16} /> Checking websites... {checkProgress.done}/{checkProgress.total}
          </div>
        )}
      </header>

      <div className="app-layout">
        {isSidebarOpen && (
          <div 
            className="sidebar-backdrop" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <SavedLists
            savedLists={savedLists}
            currentListName={listName}
            onLoadList={handleLoadList}
            onNewList={handleNewList}
            onDeleteList={handleDeleteList}
            saveDirectory={settings.saveDirectory}
            onSaveDirectoryChange={(dir) => setSettings({ ...settings, saveDirectory: dir })}
            filePath={filePath}
            onBackupRestored={refreshSavedLists}
          />
        </aside>

        <main className="main-content">
          {activeView === 'leads' && (
            <>
              <Settings
                settings={settings}
                onUpdateSettings={setSettings}
                onResetSettings={() => {
                  setDialogState({
                    isOpen: true,
                    type: 'confirm',
                    title: 'Reset Settings?',
                    message: 'Are you sure you want to reset all settings and messages to their defaults?',
                    confirmText: 'Reset',
                    cancelText: 'Cancel',
                    onConfirm: () => {
                      setSettings({
                        socialDomains: [...DEFAULT_SOCIAL_DOMAINS],
                        saasDomains: [...DEFAULT_SAAS_DOMAINS],
                        messages: { ...DEFAULT_MESSAGES },
                        saveDirectory: settings.saveDirectory
                      });
                    },
                    onCloseOverride: null
                  });
                }}
              />

              <PasteZone onParse={handleParse} />

              <div className="list-header">
                <div className="list-name-section" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isEditingName ? (
                      <input
                        ref={nameInputRef}
                        className="list-name-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleFinishRename}
                        onKeyDown={(e) => e.key === 'Enter' && handleFinishRename()}
                      />
                  ) : (
                    <h2 className="list-name" onClick={handleStartRename}>
                      {listName || 'Untitled List'}
                      <Edit2 size={16} className="edit-icon" />
                    </h2>
                  )}
                  {isSaving && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#a1a1aa' }}>
                      <Loader2 size={12} className="animate-spin" /> Saving...
                    </span>
                  )}
                  {!isSaving && filePath && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#10b981' }}>
                      <Save size={12} /> Saved
                    </span>
                  )}
                  {leads.length > 0 && (
                    <>
                      <button 
                        onClick={() => {
                          const deduped = deduplicateLeads(leads);
                          setLeads(deduped);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}
                        title="Remove Duplicates"
                      >
                        <Layers size={14} /> Deduplicate
                      </button>
                      <button 
                        onClick={() => downloadExcel(listName, leads)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}
                        title="Download as Excel File"
                      >
                        <Download size={14} /> Download .xlsx
                      </button>
                    </>
                  )}
                </div>
                <div className="list-actions">
                  <div className="filter-wa-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
                    <input 
                      type="checkbox" 
                      id="filterWa" 
                      checked={showWithWaOnly} 
                      onChange={(e) => setShowWithWaOnly(e.target.checked)} 
                    />
                    <label htmlFor="filterWa" style={{ fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Has WA Link</label>
                  </div>
                  <div className="search-input-wrapper">
                    <Search size={14} />
                    <input
                      className="search-input"
                      type="text"
                      placeholder="Search leads..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {isLoadingLeads ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Loader2 size={32} className="animate-spin text-primary" style={{ margin: '0 auto 16px' }} />
                  <p>Loading leads...</p>
                </div>
              ) : (
                <>
                  <StatsBar leads={leads} />
                  <LeadsTable
                    leads={leads}
                    onUpdateLead={handleUpdateLead}
                    onDeleteLead={handleDeleteLead}
                    messages={settings.messages}
                    searchQuery={searchQuery}
                    showWithWaOnly={showWithWaOnly}
                    contactedSet={contactedSet}
                    onMarkContacted={async (lead) => {
                      if (!lead.phone || !lead.name) return;
                      const cleanPhone = lead.phone.replace(/[^0-9+]/g, '');
                      const cleanName = lead.name.trim().toLowerCase();
                      const key = cleanPhone + '|' + cleanName;
                      if (!contactedSet.has(key)) {
                        setContactedSet(prev => new Set(prev).add(key));
                        await markAsContacted(lead.phone, lead.name, listName);
                      }
                    }}
                  />
                </>
              )}
            </>
          )}

          {activeView === 'coverage' && (
            <CoverageMap
              coverageData={coverageData}
              selectedNiche={selectedNiche}
              onSelectNiche={setSelectedNiche}
              onAddNiche={handleAddNiche}
              onRemoveNiche={handleRemoveNiche}
              onAddCountry={handleAddCountry}
              onRemoveCountry={handleRemoveCountry}
              onAddCity={handleAddCity}
              onRemoveCity={handleRemoveCity}
              onToggleScan={handleToggleScan}
              onOpenCityList={handleOpenCityList}
              onUpdateCityNote={(country, city, note) => setCoverageData(prev => updateCityNote(prev, country, city, note))}
              savedLists={savedLists}
              onShowDialog={showDialog}
            />
          )}

          {activeView === 'schedule' && (
            <Schedule 
              settings={settings}
              setSettings={setSettings}
            />
          )}
        </main>
      </div>

      <Dialog
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        extraActionText={dialogState.extraActionText}
        onExtraAction={() => {
          if (dialogState.onExtraAction) dialogState.onExtraAction();
          setDialogState({ ...dialogState, isOpen: false });
        }}
        onConfirm={dialogState.onConfirm}
        onCancel={() => {
          if (dialogState.onCancel) dialogState.onCancel();
          setDialogState({ ...dialogState, isOpen: false });
        }}
        onClose={() => {
          setDialogState({ ...dialogState, isOpen: false });
        }}
      />
    </div>
  );
}
