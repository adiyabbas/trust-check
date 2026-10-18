import type { AnalysisMode } from '@shared/types';
import { MODE_TEXT } from '../lib/format';

const CONTACT = {
  linkedin: 'https://www.linkedin.com/in/ashad-abbas/',
  email: 'abbasashad15@gmail.com',
  phone: '8535097644',
  whatsapp: 'https://wa.me/918535097644',
};

export function Footer({ mode }: { mode: AnalysisMode }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="logo" aria-hidden>
              ✓
            </span>
            <span className="footer-name">TrustCheck.ai</span>
          </div>
          <p className="footer-tagline">Student scam-awareness and AI-writing assistant.</p>
          <p className="footer-disclaimer">College project. {MODE_TEXT[mode].disclaimer}</p>
        </div>

        <div className="footer-col">
          <h4>Product</h4>
          <ul>
            <li>Scam check</li>
            <li>AI-writing check</li>
            <li>Education mode</li>
            <li>Verification assistant</li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contact us</h4>
          <ul className="contact-list">
            <li>
              <a href={CONTACT.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn profile">
                <LinkedInIcon /> <span>ashad-abbas</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT.email}`} aria-label="Send email">
                <MailIcon /> <span>{CONTACT.email}</span>
              </a>
            </li>
            <li>
              <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
                <WhatsAppIcon /> <span>+91 {CONTACT.phone}</span>
              </a>
            </li>
          </ul>
          <div className="social-row">
            <a href={CONTACT.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" title="LinkedIn">
              <LinkedInIcon />
            </a>
            <a href={`mailto:${CONTACT.email}`} aria-label="Email" title="Email">
              <MailIcon />
            </a>
            <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp" title="WhatsApp">
              <WhatsAppIcon />
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} TrustCheck. Built for a college hackathon.</span>
        <span>Rules decide. AI explains. You verify.</span>
      </div>
    </footer>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 0 1 7 2.9 9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.9 9.88zm8.42-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.14 1.59 5.95L0 24l6.3-1.65a11.88 11.88 0 0 0 5.74 1.46h.01c6.55 0 11.89-5.33 11.89-11.89 0-3.18-1.24-6.16-3.47-8.41z" />
    </svg>
  );
}
