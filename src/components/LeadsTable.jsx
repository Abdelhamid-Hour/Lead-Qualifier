import { useState, useMemo } from 'react';
import { CATEGORY_LABELS, CATEGORY_COLORS, personalizeMessage } from '../utils/constants.js';
import { buildWhatsAppLink } from '../utils/phoneUtils.js';
import { ExternalLink, MessageCircle, MapPin, Star, Trash2 } from 'lucide-react';

export default function LeadsTable({ leads, onUpdateLead, onDeleteLead, messages, searchQuery }) {
  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter(l =>
      (l.name || '').toLowerCase().includes(q) ||
      (l.phone || '').toLowerCase().includes(q) ||
      (l.website || '').toLowerCase().includes(q)
    );
  }, [leads, searchQuery]);

  const handleCategoryChange = (lead, newCategory) => {
    let message = '';
    let waLink = '';

    if (newCategory === 'cat5' || newCategory === 'not_checked') {
      message = '';
      waLink = '';
    } else if (messages[newCategory]) {
      message = personalizeMessage(messages[newCategory], lead.name);
      waLink = buildWhatsAppLink(lead.phone, message);
    }

    onUpdateLead(lead.id, {
      category: newCategory,
      message,
      waLink
    });
  };

  if (!leads.length) {
    return (
      <div className="empty-table">
        <p>No leads yet. Paste Google Maps results above to get started.</p>
      </div>
    );
  }

  return (
    <div className="leads-table-wrapper">
      <table className="leads-table">
        <thead>
          <tr>
            <th className="th-index">#</th>
            <th className="th-name">Name</th>
            <th className="th-type">Type</th>
            <th className="th-reviews">Reviews</th>
            <th className="th-wa">WA Link</th>
            <th className="th-phone">Phone</th>
            <th className="th-rate">Rate</th>
            <th className="th-website">Website</th>
            <th className="th-gmaps">Maps</th>
            <th className="th-category">Status</th>
            <th className="th-msg">First Msg</th>
            <th className="th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredLeads.map((lead, index) => (
            <tr key={lead.id} className={`lead-row cat-${lead.category}`}>
              <td className="td-index">{index + 1}</td>
              <td className="td-name" title={lead.name}>
                <div className="name-content">
                  <span className="name-text">{lead.name}</span>
                </div>
              </td>
              <td className="td-type" style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>{lead.type || '—'}</td>
              <td className="td-reviews">{lead.reviews}</td>
              <td className="td-wa">
                {lead.waLink ? (
                  <a href={lead.waLink} target="_blank" rel="noopener noreferrer" className="wa-link" title="Open WhatsApp">
                    <MessageCircle size={18} fill="currentColor" strokeWidth={1.5} />
                  </a>
                ) : (
                  <span className="no-wa">—</span>
                )}
              </td>
              <td className="td-phone">{lead.phone}</td>
              <td className="td-rate">
                {lead.rating ? (
                  <span className="rating"><Star size={14} className="text-warning" fill="#eab308" stroke="none" /> {lead.rating}</span>
                ) : '—'}
              </td>
              <td className="td-website">
                {lead.website ? (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className="website-link" title={lead.website}>
                    <ExternalLink size={14} /> Visit
                  </a>
                ) : (
                  <span className="no-website">None</span>
                )}
              </td>
              <td className="td-gmaps">
                {lead.gmapsLink ? (
                  <a href={lead.gmapsLink} target="_blank" rel="noopener noreferrer" className="gmaps-link" title="Open in Google Maps">
                    <MapPin size={16} />
                  </a>
                ) : '—'}
              </td>
              <td className="td-category">
                <select
                  className="category-select"
                  value={lead.category}
                  onChange={(e) => handleCategoryChange(lead, e.target.value)}
                  style={{ borderColor: CATEGORY_COLORS[lead.category] }}
                >
                  <option value="not_checked">Not Checked</option>
                  <option value="cat1">No Website</option>
                  <option value="cat2">SaaS Redirect</option>
                  <option value="cat3">Broken Website</option>
                  <option value="cat4">No Reservation</option>
                  <option value="cat5">All Good</option>
                  <option value="cat6">Needs Redesign</option>
                </select>
              </td>
              <td className="td-msg">
                <div className="msg-preview" title={lead.message || 'No message'}>
                  {lead.message ? lead.message.substring(0, 50) + '...' : '—'}
                </div>
              </td>
              <td className="td-actions">
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => onDeleteLead(lead.id)}
                  title="Remove Lead"
                  style={{ padding: '4px', color: '#ef4444' }}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
