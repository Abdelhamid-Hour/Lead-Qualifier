import { useState } from 'react';
import { ClipboardPaste, SearchCode, X } from 'lucide-react';

export default function PasteZone({ onParse }) {
  const [content, setContent] = useState('');
  const hasContent = content.trim().length > 0;

  const handleParse = () => {
    if (hasContent) {
      onParse(content);
      setContent('');
    }
  };

  const handleClear = () => {
    setContent('');
  };

  return (
    <div className="paste-zone">
      <div className="paste-zone-header">
        <h3><ClipboardPaste size={18} className="text-primary" /> Paste Google Maps HTML</h3>
        <div className="paste-zone-actions">
          {hasContent && (
            <button className="btn btn-ghost btn-sm" onClick={handleClear}>
              <X size={14} /> Clear
            </button>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={handleParse}
            disabled={!hasContent}
          >
            <SearchCode size={16} /> Parse & Classify
          </button>
        </div>
      </div>
      <textarea
        className="paste-input"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Select all results in Google Maps left panel (or use your extension) → Ctrl+C → Ctrl+V here"
        style={{ width: '100%', minHeight: '150px', resize: 'vertical' }}
      />
    </div>
  );
}
