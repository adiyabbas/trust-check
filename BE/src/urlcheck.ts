import type { LinkCheck, LinkVerdict, TextSpan } from '../../shared/types';
import { config } from './config';

const SHORTENERS = new Set(['bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'rb.gy', 'is.gd', 'shorturl.at', 'tiny.cc', 'goo.gl', 'ow.ly', 'rebrand.ly']);
const RISKY_TLDS = ['.xyz', '.top', '.club', '.tk', '.ml', '.ga', '.cf', '.gq', '.buzz', '.site', '.online', '.icu', '.link', '.click'];
const OFFICIAL_SUFFIXES = ['.ac.in', '.edu', '.edu.in', '.gov.in', '.nic.in', '.gov', '.res.in'];
const TWO_PART_SUFFIXES = ['.ac.in', '.co.in', '.edu.in', '.gov.in', '.nic.in', '.res.in', '.org.in', '.net.in', '.co.uk', '.com.au'];
const LOOKALIKE_WORDS = ['verify', 'verification', 'official', 'secure', 'login', 'update', 'claim', 'gov-', 'govt', 'scholarship-', '-scholarship', 'kyc'];

// Scheme-less URLs are only accepted when they end in a well-known TLD, so
// things like "B.Tech", "8.5" or "e.g." are not mistaken for links.
const KNOWN_TLDS = new Set([
  'com', 'in', 'org', 'net', 'co', 'io', 'me', 'app', 'info', 'biz', 'edu', 'gov', 'ac', 'xyz', 'top', 'club', 'tk', 'ml', 'ga', 'cf', 'gq',
  'buzz', 'site', 'online', 'icu', 'link', 'click', 'ly', 'gl', 'gd', 'cc', 'at', 'gy', 'uk', 'us', 'au', 'example',
]);

const URL_RE = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s<>"')\]]*)?/gi;

export interface FoundUrl extends TextSpan {
  url: string;
}

export function extractUrls(text: string): FoundUrl[] {
  const out: FoundUrl[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(URL_RE)) {
    const start = m.index;
    const raw = m[0].replace(/[.,;:!?)]+$/, '');
    const end = start + raw.length;
    const before = text[start - 1] ?? ' ';
    const after = text[end] ?? ' ';
    // Part of an email address or UPI id, or glued to a word: not a link.
    if (before === '@' || after === '@' || /[a-z0-9]/i.test(before)) continue;
    const hasScheme = /^https?:\/\//i.test(raw);
    const host = domainOf(raw);
    const tld = host.split('.').pop() ?? '';
    if (!hasScheme && !KNOWN_TLDS.has(tld)) continue;
    if (/^\d+(\.\d+)+$/.test(host) && !/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) continue; // "8.5", "2026.27"
    if (seen.has(raw.toLowerCase())) continue;
    seen.add(raw.toLowerCase());
    out.push({ url: raw, start, end, text: raw });
  }
  return out;
}

function domainOf(url: string): string {
  try {
    const withScheme = /^https?:\/\//i.test(url) ? url : `http://${url}`;
    return new URL(withScheme).hostname.toLowerCase();
  } catch {
    return url.toLowerCase().split('/')[0];
  }
}

function heuristics(url: string, domain: string): { verdict: LinkVerdict; reasons: string[] } {
  const reasons: string[] = [];
  let suspicious = 0;
  const official = OFFICIAL_SUFFIXES.some((t) => domain.endsWith(t));

  if (SHORTENERS.has(domain)) {
    reasons.push('Shortened link hides the real destination.');
    suspicious += 2;
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) {
    reasons.push('Raw IP address instead of a domain name.');
    suspicious += 2;
  }
  if (RISKY_TLDS.some((t) => domain.endsWith(t))) {
    reasons.push('Cheap, frequently abused top-level domain.');
    suspicious += 1;
  }
  if (!official && LOOKALIKE_WORDS.some((w) => domain.includes(w))) {
    reasons.push('Domain uses trust words ("verify", "official", "secure") that real institutions rarely need.');
    suspicious += 1;
  }
  const suffix = TWO_PART_SUFFIXES.find((s) => domain.endsWith(s));
  const labels = (suffix ? domain.slice(0, -suffix.length) : domain.replace(/\.[a-z]+$/, '')).split('.').filter(Boolean).length;
  if (labels >= 3) {
    reasons.push('Many sub-domains, a common way to hide the real site.');
    suspicious += 1;
  }
  if (domain.endsWith('.example')) {
    reasons.push('Reserved demo domain (.example) used for this test message.');
  }
  if (/^http:\/\//i.test(url)) {
    reasons.push('Not HTTPS.');
    suspicious += 1;
  }

  if (official && suspicious === 0) {
    reasons.push('Restricted institutional / government domain. Still open it yourself rather than via the link.');
    return { verdict: 'likely-official', reasons };
  }
  if (suspicious >= 1) return { verdict: 'suspicious', reasons };
  reasons.push('Unknown domain. Not known to be malicious, but not verified either.');
  return { verdict: 'unverified', reasons };
}

async function safeBrowsing(urls: string[]): Promise<Set<string>> {
  const flagged = new Set<string>();
  if (!config.safeBrowsingKey || urls.length === 0) return flagged;
  try {
    const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${config.safeBrowsingKey}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'trustcheck', clientVersion: '0.1' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: urls.map((url) => ({ url: /^https?:\/\//i.test(url) ? url : `http://${url}` })),
        },
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return flagged;
    const data = (await res.json()) as { matches?: { threat?: { url?: string } }[] };
    for (const m of data.matches ?? []) if (m.threat?.url) flagged.add(m.threat.url.replace(/^https?:\/\//i, ''));
  } catch (err) {
    console.warn('[urlcheck] Safe Browsing lookup failed:', (err as Error).message);
  }
  return flagged;
}

export async function checkLinks(message: string): Promise<{ links: LinkCheck[]; spans: TextSpan[] }> {
  const found = extractUrls(message);
  const flagged = await safeBrowsing(found.map((f) => f.url));
  const links = found.map(({ url }) => {
    const domain = domainOf(url);
    const h = heuristics(url, domain);
    if (flagged.has(url.replace(/^https?:\/\//i, ''))) {
      return { url, domain, verdict: 'flagged' as LinkVerdict, reasons: ['Listed by Google Safe Browsing.', ...h.reasons] };
    }
    return { url, domain, ...h };
  });
  return { links, spans: found.map(({ start, end, text }) => ({ start, end, text })) };
}
