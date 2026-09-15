import type { SigData } from './SignatureEditor';

const SOCIAL_ICONS: Record<string, { src: string; label: string }> = {
  linkedInUrl: { src: 'https://cdn-icons-png.flaticon.com/512/174/174857.png', label: 'LinkedIn' },
  instagramUrl: { src: 'https://cdn-icons-png.flaticon.com/512/174/174855.png', label: 'Instagram' },
  facebookUrl: { src: 'https://cdn-icons-png.flaticon.com/512/174/174848.png', label: 'Facebook' },
  threadsUrl: { src: 'https://cdn-icons-png.flaticon.com/512/14079/14079772.png', label: 'Threads' },
  xUrl: { src: 'https://cdn-icons-png.flaticon.com/512/5968/5968830.png', label: 'X' },
  tikTokUrl: { src: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png', label: 'TikTok' },
};

type ContactLine = { icon: string; content: JSX.Element };

/** Icons8 serves PNGs tinted to any hex color via the URL path, so contact
 *  icons re-tint automatically when the accent color changes, and render
 *  identically on every device (unlike emoji glyphs). */
function contactIcon(name: string, hex: string) {
  return `https://img.icons8.com/ios-filled/50/${hex.replace('#', '')}/${name}.png`;
}

function ContactRow({ icon, content, fontSize }: { icon: string; content: JSX.Element; fontSize: number }) {
  const iconPx = Math.round(fontSize * 0.95);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 3 }}>
      <img
        src={icon}
        alt=""
        width={iconPx}
        height={iconPx}
        style={{ flexShrink: 0, marginTop: Math.round(fontSize * 0.25), display: 'block' }}
      />
      <span style={{ fontSize, lineHeight: `${fontSize + 6}px` }}>{content}</span>
    </div>
  );
}

export default function SignaturePreview({ sig }: { sig: SigData }) {
  const accent = sig.accentColor || '#111111';
  const textColor = sig.textColor || '#333333';
  const headingFont = sig.headingFont || 'Arial';
  const bodyFont = sig.bodyFont || 'Arial';
  const logoSize = sig.logoSize || 96;
  const fontSize = sig.baseTextSize || 14;
  const bannerSize = sig.bannerSize || 180;
  const logoUrl = sig.logo?.[0]?.url;
  const bannerUrl = sig.bannerImage?.[0]?.url;
  const divider = sig.showDivider !== false;
  const round = sig.roundSocialIcons !== false;
  const layout = sig.layout || 'Logo Left';

  const socials = Object.entries(SOCIAL_ICONS)
    .filter(([key]) => sig[key])
    .map(([key, v]) => ({ url: sig[key], ...v }));

  // Build contact lines: email, phone, website, address
  const contactLines: ContactLine[] = [];
  if (sig.emailAddress) contactLines.push({ icon: contactIcon('new-post', accent), content: <a href={`mailto:${sig.emailAddress}`} style={{ color: accent, textDecoration: 'none' }}>{sig.emailAddress}</a> });
  if (sig.phone) contactLines.push({ icon: contactIcon('phone', accent), content: <span style={{ color: textColor }}>{sig.phone}</span> });
  if (sig.website) contactLines.push({ icon: contactIcon('domain', accent), content: <a href={`https://${sig.website}`} style={{ color: accent, textDecoration: 'none' }}>{sig.website}</a> });
  const addr = [sig.addressLine1, sig.addressLine2].filter(Boolean).join(', ');
  if (addr) contactLines.push({ icon: contactIcon('marker', accent), content: <span style={{ color: textColor }}>{addr}</span> });

  const contactBlock = contactLines.length > 0 && (
    <div style={{ marginTop: 8 }}>
      {contactLines.map((cl, i) => (
        <ContactRow key={i} icon={cl.icon} content={cl.content} fontSize={fontSize} />
      ))}
    </div>
  );

  // Name + job title on one line, behind a thin accent rule
  const nameLine = (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
      <div style={{ width: 3, background: accent, flexShrink: 0, borderRadius: 2 }} />
      <div
        style={{
          fontFamily: `${headingFont}, sans-serif`,
          fontSize: fontSize + 4,
          lineHeight: `${fontSize + 12}px`,
          color: accent,
        }}
      >
        <span style={{ fontWeight: 'bold' }}>{sig.fullName}</span>
        {sig.jobTitle && (
          <>
            <span style={{ color: '#c4c4c4', fontWeight: 'normal', padding: '0 7px' }}>|</span>
            <span style={{ color: textColor, fontWeight: 'normal' }}>{sig.jobTitle}</span>
          </>
        )}
      </div>
    </div>
  );

  const socialRow = socials.length > 0 && (
    <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
      {socials.map(s => (
        <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
          <img src={s.src} alt={s.label} width={24} height={24} style={{ borderRadius: round ? '50%' : 0 }} />
        </a>
      ))}
    </div>
  );

  if (layout === 'Stacked') {
    return (
      <div style={{ fontFamily: `${bodyFont}, sans-serif`, maxWidth: 600 }}>
        {logoUrl && <img src={logoUrl} width={logoSize} height={logoSize} alt="Logo" style={{ marginBottom: 10 }} />}
        {nameLine}
        {divider && <hr style={{ border: 0, borderTop: '1px solid #ddd', margin: '8px 0' }} />}
        {contactBlock}
        {sig.tagline && <p style={{ marginTop: 8, fontSize: fontSize - 2, letterSpacing: 1, color: accent, textTransform: 'uppercase' }}>{sig.tagline}</p>}
        {bannerUrl && <img src={bannerUrl} width={bannerSize} alt="Banner" style={{ marginTop: 8 }} />}
        {socialRow}
      </div>
    );
  }

  if (layout === 'Compact') {
    return (
      <div style={{ fontFamily: `${bodyFont}, sans-serif`, display: 'flex', alignItems: 'center', gap: 12 }}>
        {logoUrl && <img src={logoUrl} width={Math.round(logoSize * 0.6)} alt="Logo" />}
        {divider && <div style={{ width: 1, height: 40, background: '#ddd' }} />}
        <div>
          <span style={{ fontFamily: `${headingFont}, sans-serif`, fontSize, fontWeight: 'bold', color: accent }}>{sig.fullName}</span>
          {sig.jobTitle && <span style={{ fontSize: fontSize - 2, color: textColor }}> | {sig.jobTitle}</span>}
          {sig.emailAddress && <span style={{ fontSize: fontSize - 2 }}> | <a href={`mailto:${sig.emailAddress}`} style={{ color: accent, textDecoration: 'none' }}>{sig.emailAddress}</a></span>}
          {sig.phone && <span style={{ fontSize: fontSize - 2, color: textColor }}> | {sig.phone}</span>}
        </div>
      </div>
    );
  }

  // Logo Left (default)
  return (
    <div style={{ fontFamily: `${bodyFont}, sans-serif`, display: 'flex', gap: 0, maxWidth: 600 }}>
      {logoUrl && (
        <div style={{ paddingRight: 16, flexShrink: 0 }}>
          <img src={logoUrl} width={logoSize} height={logoSize} alt="Logo" />
        </div>
      )}
      {divider && <div style={{ width: 1, background: '#ddd', marginRight: 16, flexShrink: 0 }} />}
      <div style={{ flexGrow: 1 }}>
        {nameLine}
        {contactBlock}
      </div>
      <div style={{ paddingLeft: 20, textAlign: 'center', flexShrink: 0, maxWidth: 200 }}>
        {bannerUrl && <img src={bannerUrl} width={bannerSize} alt="Banner" />}
        {sig.tagline && <p style={{ margin: '6px 0 0', fontSize: fontSize - 2, letterSpacing: 1, color: accent, textTransform: 'uppercase' }}>{sig.tagline}</p>}
        {socialRow}
      </div>
    </div>
  );
}
