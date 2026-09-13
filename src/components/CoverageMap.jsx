import { useState, useMemo } from 'react';
import { 
  ChevronDown, ChevronRight, Plus, Trash2, Search, 
  MapPin, FolderOpen, Check, Square, CheckSquare,
  Globe, X
} from 'lucide-react';

export default function CoverageMap({ 
  coverageData, 
  selectedNiche, 
  onSelectNiche,
  onAddNiche, 
  onRemoveNiche, 
  onAddCountry, 
  onRemoveCountry, 
  onAddCity, 
  onRemoveCity, 
  onToggleScan, 
  onOpenCityList,
  savedLists,
  onShowDialog
}) {
  const [search, setSearch] = useState('');
  const [newNiche, setNewNiche] = useState('');
  const [showNicheInput, setShowNicheInput] = useState(false);
  const [newCountry, setNewCountry] = useState('');
  const [showCountryInput, setShowCountryInput] = useState(false);
  const [newCityFor, setNewCityFor] = useState(null); // countryName or null
  const [newCityName, setNewCityName] = useState('');
  const [collapsedCountries, setCollapsedCountries] = useState({});

  const niches = coverageData.niches || [];
  const countries = coverageData.countries || [];

  // Filter countries/cities by search
  const filteredCountries = useMemo(() => {
    if (!search) return countries;
    const q = search.toLowerCase();
    return countries
      .map(country => {
        const countryMatch = country.name.toLowerCase().includes(q);
        const filteredCities = country.cities.filter(c => c.name.toLowerCase().includes(q));
        if (countryMatch) return country;
        if (filteredCities.length > 0) return { ...country, cities: filteredCities };
        return null;
      })
      .filter(Boolean);
  }, [countries, search]);

  // Compute progress for the selected niche
  const getCountryProgress = (country) => {
    if (!selectedNiche) return { scanned: 0, total: 0 };
    const total = country.cities.length;
    const scanned = country.cities.filter(c => c.scans?.[selectedNiche]?.scanned).length;
    return { scanned, total };
  };

  const overallProgress = useMemo(() => {
    if (!selectedNiche) return { scanned: 0, total: 0 };
    let scanned = 0, total = 0;
    countries.forEach(country => {
      country.cities.forEach(city => {
        total++;
        if (city.scans?.[selectedNiche]?.scanned) scanned++;
      });
    });
    return { scanned, total };
  }, [countries, selectedNiche]);

  const toggleCollapse = (countryName) => {
    setCollapsedCountries(prev => ({ ...prev, [countryName]: !prev[countryName] }));
  };

  const handleAddNiche = () => {
    const trimmed = newNiche.trim();
    if (!trimmed) return;
    if (niches.includes(trimmed)) {
      onShowDialog({ type: 'alert', title: 'Niche Exists', message: `"${trimmed}" already exists.` });
      return;
    }
    onAddNiche(trimmed);
    onSelectNiche(trimmed);
    setNewNiche('');
    setShowNicheInput(false);
  };

  const handleDeleteNiche = () => {
    if (!selectedNiche) return;
    onShowDialog({
      type: 'confirm',
      title: 'Delete Niche?',
      message: `Delete "${selectedNiche}" and all its scan data? The linked list files will NOT be deleted.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        onRemoveNiche(selectedNiche);
        onSelectNiche(niches.length > 1 ? niches.find(n => n !== selectedNiche) : '');
      }
    });
  };

  const handleAddCountry = () => {
    const trimmed = newCountry.trim();
    if (!trimmed) return;
    if (countries.some(c => c.name === trimmed)) {
      onShowDialog({ type: 'alert', title: 'Country Exists', message: `"${trimmed}" already exists.` });
      return;
    }
    onAddCountry(trimmed);
    setNewCountry('');
    setShowCountryInput(false);
  };

  const handleDeleteCountry = (countryName) => {
    onShowDialog({
      type: 'confirm',
      title: 'Delete Country?',
      message: `Delete "${countryName}" and all its cities? The linked list files will NOT be deleted.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => onRemoveCountry(countryName)
    });
  };

  const handleAddCity = (countryName) => {
    const trimmed = newCityName.trim();
    if (!trimmed) return;
    const country = countries.find(c => c.name === countryName);
    if (country?.cities.some(c => c.name === trimmed)) {
      onShowDialog({ type: 'alert', title: 'City Exists', message: `"${trimmed}" already exists in ${countryName}.` });
      return;
    }
    onAddCity(countryName, trimmed);
    setNewCityName('');
    setNewCityFor(null);
  };

  const handleDeleteCity = (countryName, cityName) => {
    onShowDialog({
      type: 'confirm',
      title: 'Delete City?',
      message: `Delete "${cityName}" from ${countryName}?`,
      confirmText: 'Delete City Only',
      cancelText: 'Cancel',
      onConfirm: () => onRemoveCity(countryName, cityName, false),
      extraActionText: 'Delete City & Files',
      onExtraAction: () => onRemoveCity(countryName, cityName, true)
    });
  };

  // Empty state
  if (niches.length === 0) {
    return (
      <div className="coverage-map">
        <div className="coverage-empty">
          <Globe size={48} strokeWidth={1} style={{ color: '#3f3f46', marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px', color: '#e4e4e7' }}>Area Marketing Tracker</h3>
          <p style={{ color: '#71717a', marginBottom: '20px' }}>Start by adding a niche to track your geographic coverage.</p>
          <div className="coverage-add-niche-empty">
            <input
              type="text"
              placeholder="Enter niche name (e.g. Car rental)"
              value={newNiche}
              onChange={(e) => setNewNiche(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNiche()}
              className="coverage-input"
              autoFocus
            />
            <button className="btn btn-primary" onClick={handleAddNiche} disabled={!newNiche.trim()}>
              <Plus size={16} /> Add Niche
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="coverage-map">
      {/* Niche Selector Bar */}
      <div className="coverage-niche-bar">
        <div className="coverage-niche-selector">
          <label>Niche:</label>
          <select 
            value={selectedNiche} 
            onChange={(e) => onSelectNiche(e.target.value)}
            className="coverage-niche-dropdown"
          >
            {niches.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          
          {showNicheInput ? (
            <div className="coverage-inline-add">
              <input
                type="text"
                placeholder="New niche name..."
                value={newNiche}
                onChange={(e) => setNewNiche(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddNiche();
                  if (e.key === 'Escape') { setShowNicheInput(false); setNewNiche(''); }
                }}
                className="coverage-input coverage-input-sm"
                autoFocus
              />
              <button className="btn btn-primary btn-sm" onClick={handleAddNiche}><Plus size={14} /></button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowNicheInput(false); setNewNiche(''); }}><X size={14} /></button>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowNicheInput(true)} title="Add Niche">
              <Plus size={16} />
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleDeleteNiche} title="Delete Niche" style={{ color: '#ef4444' }}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Overall Progress */}
      {selectedNiche && overallProgress.total > 0 && (
        <div className="coverage-overall-progress">
          <div className="coverage-progress-label">
            Overall: <strong>{overallProgress.scanned}/{overallProgress.total}</strong> cities scanned
          </div>
          <div className="coverage-progress-bar">
            <div 
              className="coverage-progress-fill"
              style={{ width: `${overallProgress.total ? (overallProgress.scanned / overallProgress.total * 100) : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="coverage-controls">
        {showCountryInput ? (
          <div className="coverage-inline-add">
            <input
              type="text"
              placeholder="Country name..."
              value={newCountry}
              onChange={(e) => setNewCountry(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCountry();
                if (e.key === 'Escape') { setShowCountryInput(false); setNewCountry(''); }
              }}
              className="coverage-input"
              autoFocus
            />
            <button className="btn btn-primary btn-sm" onClick={handleAddCountry}><Plus size={14} /> Add</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowCountryInput(false); setNewCountry(''); }}><X size={14} /></button>
          </div>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={() => setShowCountryInput(true)}>
            <Plus size={16} /> Add Country
          </button>
        )}
        <div className="search-input-wrapper">
          <Search size={14} />
          <input
            type="text"
            className="search-input"
            placeholder="Search countries / cities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Countries List */}
      <div className="coverage-countries">
        {filteredCountries.map(country => {
          const progress = getCountryProgress(country);
          const isCollapsed = collapsedCountries[country.name];
          
          return (
            <div key={country.name} className="coverage-country-card">
              <div className="coverage-country-header" onClick={() => toggleCollapse(country.name)}>
                <div className="coverage-country-title">
                  {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  <MapPin size={16} className="coverage-country-icon" />
                  <span className="coverage-country-name">{country.name}</span>
                </div>
                <div className="coverage-country-meta">
                  {selectedNiche && (
                    <>
                      <div className="coverage-progress-bar coverage-progress-bar-sm">
                        <div 
                          className="coverage-progress-fill"
                          style={{ width: `${progress.total ? (progress.scanned / progress.total * 100) : 0}%` }}
                        />
                      </div>
                      <span className="coverage-country-count">{progress.scanned}/{progress.total}</span>
                    </>
                  )}
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => { e.stopPropagation(); handleDeleteCountry(country.name); }}
                    title="Delete Country"
                    style={{ color: '#ef4444' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                <div className="coverage-cities">
                  {country.cities.map(city => {
                    const scan = city.scans?.[selectedNiche] || {};
                    const leadsCount = scan.leadsCount || 0;
                    
                    return (
                      <div key={city.name} className={`coverage-city-row ${scan.scanned ? 'scanned' : ''}`}>
                        <button 
                          className="coverage-scan-checkbox"
                          onClick={() => onToggleScan(country.name, city.name, selectedNiche)}
                          title={scan.scanned ? 'Mark as not scanned' : 'Mark as scanned'}
                        >
                          {scan.scanned 
                            ? <CheckSquare size={18} className="text-success" /> 
                            : <Square size={18} className="text-muted" />
                          }
                        </button>
                        <span className="coverage-city-name">{city.name}</span>
                        <span className="coverage-city-leads">
                          {leadsCount > 0 ? `${leadsCount} leads` : '0 leads'}
                        </span>
                        {scan.date && (
                          <span className="coverage-city-date">{scan.date}</span>
                        )}
                        <button
                          className="btn btn-ghost btn-sm coverage-open-btn"
                          onClick={() => onOpenCityList(scan.linkedList)}
                          title={`Open ${scan.linkedList}`}
                        >
                          <FolderOpen size={14} /> Open
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDeleteCity(country.name, city.name)}
                          title="Delete City"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                  
                  {/* Add City */}
                  {newCityFor === country.name ? (
                    <div className="coverage-inline-add coverage-add-city">
                      <input
                        type="text"
                        placeholder="City name..."
                        value={newCityName}
                        onChange={(e) => setNewCityName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddCity(country.name);
                          if (e.key === 'Escape') { setNewCityFor(null); setNewCityName(''); }
                        }}
                        className="coverage-input coverage-input-sm"
                        autoFocus
                      />
                      <button className="btn btn-primary btn-sm" onClick={() => handleAddCity(country.name)}>
                        <Plus size={14} /> Add
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setNewCityFor(null); setNewCityName(''); }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="btn btn-ghost btn-sm coverage-add-city-btn"
                      onClick={() => { setNewCityFor(country.name); setNewCityName(''); }}
                    >
                      <Plus size={14} /> Add City
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredCountries.length === 0 && countries.length > 0 && (
          <p className="coverage-no-results">No countries/cities match your search.</p>
        )}

        {countries.length === 0 && (
          <div className="coverage-empty-countries">
            <p style={{ color: '#71717a' }}>No countries yet. Add one to start tracking your coverage.</p>
          </div>
        )}
      </div>
    </div>
  );
}
