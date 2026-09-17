// Map of common countries/regions to their IANA timezone strings
export const COUNTRY_TIMEZONES = [
  { country: 'France', timezone: 'Europe/Paris', code: 'FR' },
  { country: 'United Kingdom', timezone: 'Europe/London', code: 'UK' },
  { country: 'United States (EST)', timezone: 'America/New_York', code: 'US-EST' },
  { country: 'United States (CST)', timezone: 'America/Chicago', code: 'US-CST' },
  { country: 'United States (MST)', timezone: 'America/Denver', code: 'US-MST' },
  { country: 'United States (PST)', timezone: 'America/Los_Angeles', code: 'US-PST' },
  { country: 'Canada (EST)', timezone: 'America/Toronto', code: 'CA-EST' },
  { country: 'Canada (PST)', timezone: 'America/Vancouver', code: 'CA-PST' },
  { country: 'Australia (Sydney)', timezone: 'Australia/Sydney', code: 'AU-SYD' },
  { country: 'Guadeloupe', timezone: 'America/Guadeloupe', code: 'GP' },
  { country: 'Martinique', timezone: 'America/Martinique', code: 'MQ' },
  { country: 'Réunion', timezone: 'Indian/Reunion', code: 'RE' },
  { country: 'Guyane Française', timezone: 'America/Cayenne', code: 'GF' },
  { country: 'Mayotte', timezone: 'Indian/Mayotte', code: 'YT' },
  { country: 'Switzerland', timezone: 'Europe/Zurich', code: 'CH' },
  { country: 'Belgium', timezone: 'Europe/Brussels', code: 'BE' },
  { country: 'Luxembourg', timezone: 'Europe/Luxembourg', code: 'LU' },
  { country: 'Spain', timezone: 'Europe/Madrid', code: 'ES' },
  { country: 'Germany', timezone: 'Europe/Berlin', code: 'DE' },
  { country: 'Italy', timezone: 'Europe/Rome', code: 'IT' },
  { country: 'Portugal', timezone: 'Europe/Lisbon', code: 'PT' },
  { country: 'United Arab Emirates', timezone: 'Asia/Dubai', code: 'AE' },
];

/**
 * Gets the current time in the given timezone
 */
export function getCurrentTimeInTimezone(timezone) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date());
  } catch (e) {
    return '--:--';
  }
}

/**
 * Calculates the equivalent time in the target timezone given a local time string (HH:MM)
 */
export function convertLocalTimeToTarget(localTimeString, targetTimezone) {
  if (!localTimeString || !targetTimezone) return null;
  
  try {
    const [hours, minutes] = localTimeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  } catch (e) {
    return '--:--';
  }
}

/**
 * Checks if a given time string (HH:MM) falls within business hours (08:00 - 18:00)
 */
export function isWithinBusinessHours(timeString, startHour = 8, endHour = 18) {
  if (!timeString || timeString === '--:--') return true; // Default true to avoid false alarms
  
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const timeValue = hours + (minutes / 60);
    return timeValue >= startHour && timeValue < endHour;
  } catch (e) {
    return true;
  }
}
