import { useState, useMemo } from 'react';
import { Folder, Copy, Check, FileText, Plus, Trash2, Search } from 'lucide-react';

export default function SavedLists({
  savedLists,
  currentListName,
  onLoadList,
  onNewList,
  onDeleteList,
  saveDirectory,
  onSaveDirectoryChange,
  filePath
}) {
  const [copied, setCopied] = useState(false);

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
    </div>
  );
}
