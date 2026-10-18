import type { LinkCheck } from '@shared/types';
import { VERDICT_LABEL } from '../lib/format';

interface Props {
  links: LinkCheck[];
  selectedUrl: string | null;
  onSelect: (url: string) => void;
}

/** Compact list of links; reasons open in the detail panel. */
export function LinksPanel({ links, selectedUrl, onSelect }: Props) {
  if (links.length === 0) return null;
  return (
    <div className="card">
      <div className="card-head">
        <h3>Links in the message</h3>
        <span className="muted">Unknown is not the same as safe</span>
      </div>
      <ul className="evidence-nav">
        {links.map((l) => (
          <li key={l.url}>
            <button type="button" className={`evidence-row link-row ${selectedUrl === l.url ? 'selected' : ''}`} onClick={() => onSelect(l.url)} aria-pressed={selectedUrl === l.url}>
              <code className="domain">{l.domain}</code>
              <span className={`badge verdict-${l.verdict}`}>{VERDICT_LABEL[l.verdict]}</span>
              <span className="chevron" aria-hidden>
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
