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

function contactIcon(name: string, hex: string, style: string) {
  if (style === 'dark_mode_safe') {
    // White glyph — rendered inside a colored circle for dark-mode safety
    return `https://img.icons8.com/ios-filled/50/FFFFFF/${name}.png`;
  }
  const iconStyle = style === 'outlined' ? 'ios' : 'ios-filled';
  return `https://img.icons8.com/${iconStyle}/50/${hex.replace('#', '')}/${name}.png`;
}

function webUrl(raw: string) {
  const v = raw.trim();
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

function webLabel(raw: string) {
  return raw.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function ContactRow({ icon, content, fontSize, showIcon, isDarkSafe, accent }: { icon: string; content: JSX.Element; fontSize: number; showIcon: boolean; isDarkSafe: boolean; accent: string }) {
  const iconPx = Math.round(fontSize * 0.95);
  const chipSize = iconPx + 8;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: showIcon ? 7 : 0, marginBottom: 3 }}>
      {showIcon && (
        isDarkSafe ? (
          <div style={{
            width: chipSize, height: chipSize, borderRadius: '50%',
            backgroundColor: accent, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
            marginTop: Math.round(fontSize * 0.15),
          }}>
            <img src={icon} alt="" width={iconPx} height={iconPx} style={{ display: 'block' }} />
          </div>
        ) : (
          <img
            src={icon} alt="" width={iconPx} height={iconPx}
            style={{ flexShrink: 0, marginTop: Math.round(fontSize * 0.25), display: 'block' }}
          />
        )
      )}
      <span style={{ fontSize, lineHeight: `${fontSize + 6}px`, marginTop: isDarkSafe && showIcon ? 2 : 0 }}>{content}</span>
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
  const spacing = sig.blockSpacing ?? 8;

  // New customization fields
  const companySize = sig.companySize || 13;
  const companyColor = sig.companyColor || textColor;
  const companyBold = sig.companyBold ?? false;
  const socialPosition = sig.socialPosition || 'under_details';
  const socialIconSize = sig.socialIconSize || 24;
  const contactIconStyle = sig.contactIconStyle || 'filled';
  const showCompany = sig.showCompany !== false;
  const showTagline = sig.showTagline !== false;
  const showAddress = sig.showAddress !== false;
  const showSocials = sig.showSocials !== false;
  const showContactIcons = contactIconStyle !== 'none';
  const isDarkSafe = contactIconStyle === 'dark_mode_safe';
  const logoAlign = sig.logoAlignment || 'top';
  const contactLayout = sig.contactLayout || 'stacked';
  const logoAlignMap: Record<string, string> = { top: 'flex-start', middle: 'center', bottom: 'flex-end' };
  const showAccentBar = sig.showNameAccentBar !== false;

  const socials = Object.entries(SOCIAL_ICONS)
    .filter(([key]) => sig[key])
    .map(([key, v]) => ({ url: sig[key], ...v }));

  // Build contact lines: email, phone, website, address
  const contactLines: ContactLine[] = [];
  if (sig.emailAddress) contactLines.push({ icon: contactIcon('new-post', accent, contactIconStyle), content: <a href={`mailto:${sig.emailAddress}`} style={{ color: accent, textDecoration: 'none' }}>{sig.emailAddress}</a> });
  if (sig.phone) contactLines.push({ icon: contactIcon('phone', accent, contactIconStyle), content: <span style={{ color: textColor }}>{sig.phone}</span> });
  if (sig.website) contactLines.push({ icon: contactIcon('domain', accent, contactIconStyle), content: <a href={webUrl(sig.website)} target="_blank" rel="noreferrer" style={{ color: accent, textDecoration: 'none' }}>{webLabel(sig.website)}</a> });
  const addr = [sig.addressLine1, sig.addressLine2].filter(Boolean).join(', ');
  if (addr && showAddress) contactLines.push({ icon: contactIcon('marker', accent, contactIconStyle), content: <span style={{ color: textColor }}>{addr}</span> });

  const contactBlock = contactLines.length > 0 && (() => {
    if (contactLayout === 'two_column' && contactLines.length >= 3) {
      const mid = Math.ceil(contactLines.length / 2);
      const left = contactLines.slice(0, mid);
      const right = contactLines.slice(mid);
      return (
        <div style={{ marginTop: spacing, display: 'flex', gap: 20 }}>
          <div>{left.map((cl, i) => <ContactRow key={i} icon={cl.icon} content={cl.content} fontSize={fontSize} showIcon={showContactIcons} isDarkSafe={isDarkSafe} accent={accent} />)}</div>
          <div>{right.map((cl, i) => <ContactRow key={i} icon={cl.icon} content={cl.content} fontSize={fontSize} showIcon={showContactIcons} isDarkSafe={isDarkSafe} accent={accent} />)}</div>
        </div>
      );
    }
    return (
      <div style={{ marginTop: spacing }}>
        {contactLines.map((cl, i) => (
          <ContactRow key={i} icon={cl.icon} content={cl.content} fontSize={fontSize} showIcon={showContactIcons} isDarkSafe={isDarkSafe} accent={accent} />
        ))}
      </div>
    );
  })();

  // Company line
  const companyLine = sig.company && showCompany && (
    <p style={{
      margin: `2px 0 0 ${showAccentBar ? 13 : 0}px`,
      fontSize: companySize,
      color: companyColor,
      fontWeight: companyBold ? 'bold' : 'normal',
      lineHeight: `${companySize + 5}px`,
    }}>
      {sig.company}
    </p>
  );

  // Name + job title on one line, optionally behind a thin accent rule
  const nameLine = (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: showAccentBar ? 10 : 0 }}>
      {showAccentBar && <div style={{ width: 3, background: accent, flexShrink: 0, borderRadius: 2 }} />}
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

  const socialRow = showSocials && socials.length > 0 && (
    <div style={{ marginTop: spacing, display: 'flex', gap: 4 }}>
      {socials.map(s => (
        <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
          <img src={s.src} alt={s.label} width={socialIconSize} height={socialIconSize} style={{ borderRadius: round ? '50%' : 0 }} />
        </a>
      ))}
    </div>
  );

  const taglineLine = showTagline && sig.tagline && (
    <p style={{ marginTop: spacing, fontSize: fontSize - 2, letterSpacing: 1, color: accent, textTransform: 'uppercase' as const }}>{sig.tagline}</p>
  );

  if (layout === 'Stacked') {
    return (
      <div style={{ fontFamily: `${bodyFont}, sans-serif`, maxWidth: 600 }}>
        {logoUrl && <img src={logoUrl} width={logoSize} height={logoSize} alt="Logo" style={{ marginBottom: spacing + 2 }} />}
        {nameLine}
        {companyLine}
        {divider && <hr style={{ border: 0, borderTop: '1px solid #ddd', margin: `${spacing}px 0` }} />}
        {contactBlock}
        {taglineLine}
        {bannerUrl && <img src={bannerUrl} width={bannerSize} alt="Banner" style={{ marginTop: spacing }} />}
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
          {sig.company && showCompany && <span style={{ fontSize: fontSize - 2, color: companyColor }}> | {sig.company}</span>}
          {sig.emailAddress && <span style={{ fontSize: fontSize - 2 }}> | <a href={`mailto:${sig.emailAddress}`} style={{ color: accent, textDecoration: 'none' }}>{sig.emailAddress}</a></span>}
          {sig.phone && <span style={{ fontSize: fontSize - 2, color: textColor }}> | {sig.phone}</span>}
          {sig.website && <span style={{ fontSize: fontSize - 2 }}> | <a href={webUrl(sig.website)} target="_blank" rel="noreferrer" style={{ color: accent, textDecoration: 'none' }}>{webLabel(sig.website)}</a></span>}
        </div>
      </div>
    );
  }

  // Logo Left (default) — social position is configurable
  const rightColumnContent = (
    <div style={{ paddingLeft: 20, textAlign: 'center' as const, flexShrink: 0, maxWidth: 200 }}>
      {bannerUrl && <img src={bannerUrl} width={bannerSize} alt="Banner" />}
      {taglineLine}
      {socialPosition === 'right_column' && socialRow}
    </div>
  );

  const hasRightContent = bannerUrl || (showTagline && sig.tagline) || socialPosition === 'right_column';

  return (
    <div style={{ fontFamily: `${bodyFont}, sans-serif`, display: 'flex', alignItems: logoAlignMap[logoAlign] || 'flex-start', gap: 0, maxWidth: 600 }}>
      {logoUrl && (
        <div style={{ paddingRight: 16, flexShrink: 0 }}>
          <img src={logoUrl} width={logoSize} height={logoSize} alt="Logo" />
        </div>
      )}
      {divider && <div style={{ width: 1, background: '#ddd', marginRight: 16, flexShrink: 0, alignSelf: 'stretch' }} />}
      <div style={{ flexGrow: 1 }}>
        {nameLine}
        {companyLine}
        {contactBlock}
        {socialPosition === 'under_details' && socialRow}
      </div>
      {hasRightContent && rightColumnContent}
      {socialPosition === 'under_banner' && !hasRightContent && socialRow}
    </div>
  );
}
