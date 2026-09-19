import { useState, useMemo, useRef } from 'react';
import { Folder, Copy, Check, FileText, Plus, Trash2, Search, Download, Upload } from 'lucide-react';
import { downloadFullBackup, restoreFromBackup } from '../utils/backupManager.js';

export default function SavedLists({
  savedLists,
  currentListName,
  onLoadList,
  onNewList,
  onDeleteList,
  saveDirectory,
  onSaveDirectoryChange,
  filePath,
  onBackupRestored
}) {
  const [copied, setCopied] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');
  const restoreInputRef = useRef(null);

  const copyPath = () => {
    if (filePath) {
      navigator.clipboard.writeText(filePath).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const [search, setSearch] = useState('');

  const filteredLists = useMemo(() => {
    if (!search) return savedLists;
    return savedLists.filter(list => list.name.toLowerCase().includes(search.toLowerCase()));
  }, [savedLists, search]);

  const handleBackup = async () => {
    setBackupStatus('Backing up...');
    const result = await downloadFullBackup();
    if (result.success) {
      setBackupStatus(`✅ Backup: ${result.lists} lists, ${result.leads} leads`);
    } else {
      setBackupStatus('❌ Backup failed');
    }
    setTimeout(() => setBackupStatus(''), 4000);
  };

  const handleRestore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupStatus('Restoring...');
    const result = await restoreFromBackup(file);
    if (result.success) {
      setBackupStatus(`✅ Restored: ${result.restoredLists} lists, ${result.restoredLeads} leads`);
      if (onBackupRestored) onBackupRestored();
    } else {
      setBackupStatus(`❌ Restore failed: ${result.error}`);
    }
    e.target.value = '';
    setTimeout(() => setBackupStatus(''), 5000);
  };

  return (
    <div className="saved-lists-sidebar">
      <div className="sidebar-header" style={{ marginBottom: '8px' }}>
        <h3><FileText size={16} /> Your Lists</h3>
      </div>

      <button className="btn btn-primary btn-new-list" onClick={onNewList}>
        <Plus size={16} /> New List
      </button>

      <div className="search-input-wrapper">
        <Search size={14} />
        <input
          type="text"
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search lists..."
          style={{ width: '100%' }}
        />
      </div>

      <div className="saved-files">
        {filteredLists.map((list) => (
          <div
            key={list.name}
            className={`saved-file-item-container ${list.name === currentListName ? 'active' : ''}`}
          >
            <button
              className="saved-file-item"
              onClick={() => onLoadList(list)}
              title={list.name}
            >
              <FileText size={16} className="sidebar-icon" /> {list.name}
            </button>
            <button
              className="delete-list-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteList(list);
              }}
              title="Delete List"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {filteredLists.length === 0 && (
          <p className="no-files">No saved lists yet</p>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 0', marginTop: '12px' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>BACKUP & RESTORE</p>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-secondary"
            onClick={handleBackup}
            style={{ flex: 1, padding: '6px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <Download size={14} /> Backup
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => restoreInputRef.current?.click()}
            style={{ flex: 1, padding: '6px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <Upload size={14} /> Restore
          </button>
          <input
            ref={restoreInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleRestore}
          />
        </div>
        {backupStatus && (
          <p style={{ fontSize: '0.75rem', marginTop: '6px', color: backupStatus.startsWith('✅') ? '#10b981' : backupStatus.startsWith('❌') ? '#ef4444' : 'var(--text-muted)' }}>
            {backupStatus}
          </p>
        )}
      </div>
    </div>
  );
}
