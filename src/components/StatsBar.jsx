import { useMemo } from 'react';
import { CATEGORY_COLORS } from '../utils/constants.js';
import { Users, Clock, Ban, RefreshCw, Zap, FileEdit, CheckCircle2, Palette, MessageCircle } from 'lucide-react';

export default function StatsBar({ leads }) {
  const stats = useMemo(() => {
    const counts = {
      total: leads.length,
      not_checked: 0,
      cat1: 0,
      cat2: 0,
      cat3: 0,
      cat4: 0,
      cat5: 0,
      cat6: 0,
      withWA: 0
    };
    leads.forEach(l => {
      if (counts[l.category] !== undefined) counts[l.category]++;
      if (l.waLink) counts.withWA++;
    });
    return counts;
  }, [leads]);

  if (!leads.length) return null;

  return (
    <div className="stats-bar">
      <span className="stat"><Users size={16} className="stat-icon" /> <strong>{stats.total}</strong> total</span>
      <span className="stat" style={{ color: CATEGORY_COLORS.not_checked }}><Clock size={16} /> {stats.not_checked}</span>
      <span className="stat" style={{ color: CATEGORY_COLORS.cat1 }}><Ban size={16} /> {stats.cat1}</span>
      <span className="stat" style={{ color: CATEGORY_COLORS.cat2 }}><RefreshCw size={16} /> {stats.cat2}</span>
      <span className="stat" style={{ color: CATEGORY_COLORS.cat3 }}><Zap size={16} /> {stats.cat3}</span>
      <span className="stat" style={{ color: CATEGORY_COLORS.cat4 }}><FileEdit size={16} /> {stats.cat4}</span>
      <span className="stat" style={{ color: CATEGORY_COLORS.cat5 }}><CheckCircle2 size={16} /> {stats.cat5}</span>
      <span className="stat" style={{ color: CATEGORY_COLORS.cat6 }}><Palette size={16} /> {stats.cat6}</span>
      <span className="stat wa-stat"><MessageCircle size={16} /> {stats.withWA} ready</span>
    </div>
  );
}
