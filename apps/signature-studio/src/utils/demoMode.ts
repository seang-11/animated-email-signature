import { toast } from 'sonner';

const DEMO_TOAST_KEY = 'sig-studio-demo-toast-shown';

/** True when the platform rejected a write because this is a read-only marketplace demo. */
export function isDemoReadOnly(err: unknown): boolean {
  const msg = (err as any)?.message ?? String(err ?? '');
  return typeof msg === 'string' && msg.includes('DEMO_READ_ONLY');
}

/** Show the friendly demo notice. By default it shows once per session; force it for explicit actions. */
export function notifyDemo(force = false) {
  try {
    if (!force && sessionStorage.getItem(DEMO_TOAST_KEY)) return;
    sessionStorage.setItem(DEMO_TOAST_KEY, '1');
  } catch {}
  toast.info("You're viewing a demo — edits won't be saved. Copy this template to save your signatures.", {
    id: 'demo-mode',
    duration: 6000,
  });
}

/* Fictional people shown in the demo instead of the publisher's real details.
   Design settings (colors, fonts, layout) are kept so the demo still looks great. */
const PEOPLE = [
  { fullName: 'Alex Rivera', jobTitle: 'Head of Partnerships', company: 'Northwind Co.', domain: 'northwind.example', tagline: 'Building better partnerships, one handshake at a time.', phone: '(555) 010-2048' },
  { fullName: 'Jordan Lee', jobTitle: 'Marketing Director', company: 'Bluebird Studio', domain: 'bluebird.example', tagline: 'Stories that move people.', phone: '(555) 010-3172' },
  { fullName: 'Sam Patel', jobTitle: 'Customer Success Lead', company: 'Lumen Labs', domain: 'lumenlabs.example', tagline: 'Here to help you succeed.', phone: '(555) 010-4419' },
];

/** Replace every personal field on a record with a fictional person's details. */
export function toDemoSignature(record: Record<string, any>, index: number): Record<string, any> {
  const p = PEOPLE[index % PEOPLE.length];
  const handle = p.fullName.toLowerCase().replace(/\s+/g, '');
  return {
    ...record,
    __demo: true,
    signatureName: `${p.fullName} — ${p.company}`,
    fullName: p.fullName,
    jobTitle: p.jobTitle,
    company: p.company,
    tagline: record.tagline ? p.tagline : '',
    phone: record.phone ? p.phone : '',
    emailAddress: `${p.fullName.split(' ')[0].toLowerCase()}@${p.domain}`,
    website: `www.${p.domain}`,
    logo: null,
    bannerImage: null,
    logoLinkUrl: '',
    bannerLinkUrl: '',
    ctaUrl: record.ctaUrl ? `https://${p.domain}` : '',
    linkedInUrl: record.linkedInUrl ? `https://linkedin.com/in/${handle}` : '',
    instagramUrl: record.instagramUrl ? `https://instagram.com/${handle}` : '',
    facebookUrl: record.facebookUrl ? `https://facebook.com/${handle}` : '',
    threadsUrl: record.threadsUrl ? `https://threads.net/@${handle}` : '',
    xUrl: record.xUrl ? `https://x.com/${handle}` : '',
    tikTokUrl: record.tikTokUrl ? `https://tiktok.com/@${handle}` : '',
  };
}
