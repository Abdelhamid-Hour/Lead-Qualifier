import React, { useState, useEffect } from 'react';
import { 
  COUNTRY_TIMEZONES, 
  getCurrentTimeInTimezone, 
  convertLocalTimeToTarget, 
  isWithinBusinessHours 
} from '../utils/timezones.js';
import { saveDBSettings } from '../utils/settingsManager.js';

function Schedule({ settings, setSettings }) {
  const [blocks, setBlocks] = useState(settings.schedule || []);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_TIMEZONES[0].country);

  // Live clocks update every minute
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Keep it updated if settings change externally
    if (settings.schedule) {
      setBlocks(settings.schedule);
    }
  }, [settings.schedule]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSave = async (newBlocks) => {
    setBlocks(newBlocks);
    const newSettings = { ...settings, schedule: newBlocks };
    setSettings(newSettings);
    await saveDBSettings(newSettings);
  };

  const handleAddBlock = () => {
    const tzObj = COUNTRY_TIMEZONES.find(c => c.country === selectedCountry);
    const newBlock = {
      id: crypto.randomUUID(),
      localStartTime: startTime,
      localEndTime: endTime,
      targetCountry: tzObj.country,
      targetTimezone: tzObj.timezone
    };
    
    // Sort blocks by start time
    const newBlocks = [...blocks, newBlock].sort((a, b) => a.localStartTime.localeCompare(b.localStartTime));
    handleSave(newBlocks);
    setIsAdding(false);
  };

  const handleDeleteBlock = (id) => {
    handleSave(blocks.filter(b => b.id !== id));
  };

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <h2>🗓 Daily Targeting Schedule</h2>
        <p>Map your local work hours to target countries to ensure you are prospecting during their business hours (08:00 - 18:00).</p>
      </div>

      <div className="schedule-blocks">
        {blocks.length === 0 ? (
          <div className="empty-state">No schedule blocks created. Add one below!</div>
        ) : (
          blocks.map(block => {
            const targetStart = convertLocalTimeToTarget(block.localStartTime, block.targetTimezone);
            const targetEnd = convertLocalTimeToTarget(block.localEndTime, block.targetTimezone);
            const isStartOpen = isWithinBusinessHours(targetStart);
            const isEndOpen = isWithinBusinessHours(targetEnd);
            
            // Current live time in the target country
            const liveTargetTime = getCurrentTimeInTimezone(block.targetTimezone);

            const isWarning = !isStartOpen || !isEndOpen;

            return (
              <div key={block.id} className={`schedule-card ${isWarning ? 'warning' : 'safe'}`}>
                <div className="schedule-card-header">
                  <div className="local-time">
                    <span className="icon">🕒</span> 
                    <strong>Your Time:</strong> {block.localStartTime} - {block.localEndTime}
                  </div>
                  <button className="delete-btn" onClick={() => handleDeleteBlock(block.id)}>✕</button>
                </div>
                
                <div className="schedule-card-body">
                  <div className="target-info">
                    <h4>{block.targetCountry}</h4>
                    <div className="target-time">
                      <span>Target Time:</span> {targetStart} - {targetEnd}
                    </div>
                  </div>

                  <div className="live-status">
                    <div className="live-clock">
                      <span className="pulse"></span>
                      Now in {block.targetCountry}: <strong>{liveTargetTime}</strong>
                    </div>
                    {isWarning ? (
                      <div className="status-badge error">
                        ⚠️ Target businesses might be closed during this block!
                      </div>
                    ) : (
                      <div className="status-badge success">
                        ✅ Optimal Business Hours
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isAdding ? (
        <div className="add-block-form">
          <h3>Add New Time Block</h3>
          <div className="form-group-row">
            <div className="form-group">
              <label>Local Start Time</label>
              <input 
                type="time" 
                value={startTime} 
                onChange={e => setStartTime(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Local End Time</label>
              <input 
                type="time" 
                value={endTime} 
                onChange={e => setEndTime(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Target Country</label>
              <select 
                value={selectedCountry} 
                onChange={e => setSelectedCountry(e.target.value)}
              >
                {COUNTRY_TIMEZONES.map(c => (
                  <option key={c.code} value={c.country}>{c.country}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="cancel-btn" onClick={() => setIsAdding(false)}>Cancel</button>
            <button className="save-btn" onClick={handleAddBlock}>Add Block</button>
          </div>
        </div>
      ) : (
        <button className="add-block-btn" onClick={() => setIsAdding(true)}>
          + Add Time Block
        </button>
      )}
    </div>
  );
}

export default Schedule;
