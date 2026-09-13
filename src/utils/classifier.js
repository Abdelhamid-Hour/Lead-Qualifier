import { DEFAULT_SOCIAL_DOMAINS, DEFAULT_SAAS_DOMAINS } from './constants.js';

function getDomainFromUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

// Returns the auto-detected category
export function autoClassify(lead, settings) {
  const socialDomains = settings?.socialDomains || DEFAULT_SOCIAL_DOMAINS;
  const saasDomains = settings?.saasDomains || DEFAULT_SAAS_DOMAINS;

  // No website at all
  if (!lead.website || lead.website.trim() === '') {
    return 'cat1';
  }

  const domain = getDomainFromUrl(lead.website);
  if (!domain) return 'cat1';

  // Social media link
  if (socialDomains.some(sd => domain.includes(sd.replace(/^www\./, '').toLowerCase()))) {
    return 'cat1';
  }

  // SaaS redirect
  if (saasDomains.some(sd => domain.includes(sd.replace(/^www\./, '').toLowerCase()))) {
    return 'cat2';
  }

  // Default: not_checked (needs manual review or website health check)
  return 'not_checked';
}

// Checks website health via CORS proxy
export async function checkWebsiteHealth(url) {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) return 'not_checked';
    
    const data = await res.json();
    const status = data.status?.http_code;
    
    // 0 = Network error/DNS failure from proxy
    // 404 = Not found
    // 5xx = Server errors
    // Exclude 403/401/406 because many working sites block the proxy (Cloudflare, etc.)
    if (status === 0 || status === 404 || (status >= 500 && status < 600)) {
      return 'cat3';
    }
    
    const content = (data.contents || '').toLowerCase();
    const errorPatterns = [
      'erreur critique',
      'critical error',
      'there has been a critical error',
      'error establishing a database connection',
      'err_connection_refused',
      'ce site est inaccessible',
      'this site can\'t be reached',
      'site en construction',
      'under construction',
      'account suspended',
      'compte suspendu'
    ];
    
    if (errorPatterns.some(p => content.includes(p))) {
      return 'cat3';
    }
    
    return 'not_checked'; // healthy or blocking proxy, needs manual review
  } catch (err) {
    return 'not_checked'; // network error or timeout, leave for manual
  }
}
