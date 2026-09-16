import type { SigData } from './SignatureEditor';
import { getZones, type BlockId } from '../utils/zones';

/* ─── Social icon sources ─── */
const SOCIAL_ICONS: Record<string, { src: string; label: string }> = {
  linkedInUrl: { src: 'https://cdn-icons-png.flaticon.com/512/174/174857.png', label: 'LinkedIn' },
  instagramUrl: { src: 'https://cdn-icons-png.flaticon.com/512/174/174855.png', label: 'Instagram' },
  facebookUrl: { src: 'https://cdn-icons-png.flaticon.com/512/174/174848.png', label: 'Facebook' },
  threadsUrl: { src: 'https://cdn-icons-png.flaticon.com/512/14079/14079772.png', label: 'Threads' },
  xUrl: { src: 'https://cdn-icons-png.flaticon.com/512/5968/5968830.png', label: 'X' },
  tikTokUrl: { src: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png', label: 'TikTok' },
  youTubeUrl: { src: 'https://cdn-icons-png.flaticon.com/512/174/174883.png', label: 'YouTube' },
  substackUrl: { src: 'https://img.icons8.com/color/96/substack.png', label: 'Substack' },
};

type ContactLine = { icon: string; content: JSX.Element };

function contactIcon(name: string, hex: string, style: string) {
  if (style === 'dark_mode_safe') return `https://img.icons8.com/ios-filled/50/FFFFFF/${name}.png`;
  const iconStyle = style === 'outlined' ? 'ios' : 'ios-filled';
  return `https://img.icons8.com/${iconStyle}/50/${hex.replace('#', '')}/${name}.png`;
}
function webUrl(raw: string) { const v = raw.trim(); return /^https?:\/\//i.test(v) ? v : `https://${v}`; }
function webLabel(raw: string) { return raw.trim().replace(/^https?:\/\//i, '').replace(/\/$/, ''); }

function ContactRow({ icon, content, fontSize, showIcon, isDarkSafe, accent }: { icon: string; content: JSX.Element; fontSize: number; showIcon: boolean; isDarkSafe: boolean; accent: string }) {
  const iconPx = Math.round(fontSize * 0.95);
  const chipSize = iconPx + 8;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: showIcon ? 7 : 0, marginBottom: 3 }}>
      {showIcon && (isDarkSafe ? (
        <div style={{ width: chipSize, height: chipSize, borderRadius: '50%', backgroundColor: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: Math.round(fontSize * 0.15) }}>
          <img src={icon} alt="" width={iconPx} height={iconPx} style={{ display: 'block' }} />
        </div>
      ) : (
        <img src={icon} alt="" width={iconPx} height={iconPx} style={{ flexShrink: 0, marginTop: Math.round(fontSize * 0.25), display: 'block' }} />
      ))}
      <span style={{ fontSize, lineHeight: `${fontSize + 6}px`, marginTop: isDarkSafe && showIcon ? 2 : 0 }}>{content}</span>
    </div>
  );
}

function MaybeLink({ url, children }: { url?: string; children: React.ReactNode }) {
  if (!url) return <>{children}</>;
  return <a href={webUrl(url)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>{children}</a>;
}

const SEPARATOR_MAP: Record<string, string> = { pipe: '|', bullet: '·', dash: '—' };
const LOGO_RADIUS: Record<string, string> = { square: '0', rounded: '8px', circle: '50%' };

/* ─── Clickable block wrapper ─── */
function BlockWrap({ id, active, onClick, children }: { id: BlockId; active: boolean; onClick?: (id: BlockId) => void; children: React.ReactNode }) {
  if (!onClick) return <>{children}</>;
  return (
    <div
      onClick={e => { e.stopPropagation(); onClick(id); }}
      className="cursor-pointer rounded transition-all duration-200"
      style={{
        outline: active ? '2px solid rgba(62,111,231,0.5)' : 'none',
        outlineOffset: 3,
        borderRadius: 4,
      }}
    >
      {children}
    </div>
  );
}

export default function SignaturePreview({ sig, activeBlock, onBlockClick }: {
  sig: SigData;
  activeBlock?: string;
  onBlockClick?: (block: string) => void;
}) {
  const accent = sig.accentColor || '#111111';
  const textColor = sig.textColor || '#333333';
  const headingFont = sig.headingFont || 'Arial';
  const bodyFont = sig.bodyFont || 'Arial';
  const logoSize = sig.logoSize || 96;
  const fontSize = sig.baseTextSize || 14;
  const bannerSize = sig.bannerSize || 180;
  const logoUrl = sig.logo?.[0]?.url;
  const bannerUrl = sig.bannerImage?.[0]?.url;
  const showVerticalDivider = sig.showDivider !== false;
  const round = sig.roundSocialIcons !== false;
  const spacing = sig.blockSpacing ?? 8;

  const companySize = sig.companySize || 13;
  const companyColor = sig.companyColor || textColor;
  const companyBold = sig.companyBold ?? false;
  const companyItalic = sig.companyItalic ?? false;
  const companyUppercase = sig.companyUppercase ?? false;
  const companyLS = sig.companyLetterSpacing ?? 0;

  const socialIconSize = sig.socialIconSize || 24;
  const contactIconStyle = sig.contactIconStyle || 'filled';
  const showContactIcons = contactIconStyle !== 'none';
  const isDarkSafe = contactIconStyle === 'dark_mode_safe';
  const logoAlign = sig.logoAlignment || 'top';
  const contactLayout = sig.contactLayout || 'stacked';
  const showAccentBar = sig.showNameAccentBar !== false;

  const nameSize = sig.nameSize || fontSize + 4;
  const nameColor = sig.nameColor || accent;
  const nameBold = sig.nameBold !== false;
  const titleSize = sig.jobTitleSize || fontSize;
  const titleColor = sig.jobTitleColor || textColor;
  const titleItalic = sig.jobTitleItalic ?? false;
  const separator = sig.nameTitleSeparator || 'pipe';
  const logoShape = sig.logoShape || 'square';
  const logoLinkUrl = sig.logoLinkUrl || '';
  const dividerColor = sig.dividerColor || '#dddddd';
  const dividerThickness = sig.dividerThickness ?? 1;
  const bannerLinkUrl = sig.bannerLinkUrl || '';
  const showCta = sig.showCta ?? false;
  const ctaText = sig.ctaText || '';
  const ctaUrl = sig.ctaUrl || '';
  const ctaBg = sig.ctaBackgroundColor || accent;
  const ctaTextColor = sig.ctaTextColor || '#ffffff';
  const showDisclaimer = sig.showDisclaimer ?? false;
  const disclaimerText = sig.disclaimerText || '';
  const disclaimerSize = sig.disclaimerSize || 10;

  const taglineSize = sig.taglineSize || fontSize - 2;
  const taglineColor = sig.taglineColor || accent;
  const taglineBold = sig.taglineBold ?? false;
  const taglineItalic = sig.taglineItalic ?? false;
  const taglineUppercase = sig.taglineUppercase !== false;
  const taglineLS = sig.taglineLetterSpacing ?? 1;

  const logoRadius = LOGO_RADIUS[logoShape] || '0';
  const logoAlignMap: Record<string, string> = { top: 'flex-start', middle: 'center', bottom: 'flex-end' };

  const isActive = (id: BlockId) => activeBlock === id;
  const handleClick = onBlockClick as ((id: BlockId) => void) | undefined;

  /* ─── Build block elements ─── */
  const socials = Object.entries(SOCIAL_ICONS).filter(([k]) => sig[k]).map(([k, v]) => ({ url: sig[k], ...v }));

  const contactLines: ContactLine[] = [];
  if (sig.emailAddress) contactLines.push({ icon: contactIcon('new-post', accent, contactIconStyle), content: <a href={`mailto:${sig.emailAddress}`} style={{ color: accent, textDecoration: 'none' }}>{sig.emailAddress}</a> });
  if (sig.phone) contactLines.push({ icon: contactIcon('phone', accent, contactIconStyle), content: <span style={{ color: textColor }}>{sig.phone}</span> });
  if (sig.website) contactLines.push({ icon: contactIcon('domain', accent, contactIconStyle), content: <a href={webUrl(sig.website)} target="_blank" rel="noreferrer" style={{ color: accent, textDecoration: 'none' }}>{webLabel(sig.website)}</a> });

  const contactBlock = contactLines.length > 0 ? (() => {
    if (contactLayout === 'two_column' && contactLines.length >= 3) {
      const mid = Math.ceil(contactLines.length / 2);
      return (
        <div style={{ display: 'flex', gap: 20 }}>
          <div>{contactLines.slice(0, mid).map((cl, i) => <ContactRow key={i} icon={cl.icon} content={cl.content} fontSize={fontSize} showIcon={showContactIcons} isDarkSafe={isDarkSafe} accent={accent} />)}</div>
          <div>{contactLines.slice(mid).map((cl, i) => <ContactRow key={i} icon={cl.icon} content={cl.content} fontSize={fontSize} showIcon={showContactIcons} isDarkSafe={isDarkSafe} accent={accent} />)}</div>
        </div>
      );
    }
    return <div>{contactLines.map((cl, i) => <ContactRow key={i} icon={cl.icon} content={cl.content} fontSize={fontSize} showIcon={showContactIcons} isDarkSafe={isDarkSafe} accent={accent} />)}</div>;
  })() : null;

  const titleEl = sig.jobTitle && (
    separator === 'new_line' ? (
      <div style={{ fontSize: titleSize, color: titleColor, fontWeight: 'normal', fontStyle: titleItalic ? 'italic' : 'normal', lineHeight: `${titleSize + 6}px` }}>{sig.jobTitle}</div>
    ) : (
      <><span style={{ color: dividerColor, fontWeight: 'normal', padding: '0 7px' }}>{SEPARATOR_MAP[separator] || '|'}</span><span style={{ color: titleColor, fontWeight: 'normal', fontSize: titleSize, fontStyle: titleItalic ? 'italic' : 'normal' }}>{sig.jobTitle}</span></>
    )
  );

  const nameLine = (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: showAccentBar ? 10 : 0 }}>
      {showAccentBar && <div style={{ width: dividerThickness + 2, background: accent, flexShrink: 0, borderRadius: 2 }} />}
      <div style={{ fontFamily: `${headingFont}, sans-serif`, fontSize: nameSize, lineHeight: `${nameSize + 8}px`, color: nameColor }}>
        <span style={{ fontWeight: nameBold ? 'bold' : 'normal' }}>{sig.fullName}</span>
        {titleEl}
      </div>
    </div>
  );

  const companyLine = sig.company ? (
    <p style={{ margin: `2px 0 0 ${showAccentBar ? 13 : 0}px`, fontSize: companySize, color: companyColor, fontWeight: companyBold ? 'bold' : 'normal', fontStyle: companyItalic ? 'italic' : 'normal', textTransform: companyUppercase ? 'uppercase' : 'none', letterSpacing: companyLS, lineHeight: `${companySize + 5}px` }}>{sig.company}</p>
  ) : null;

  const taglineLine = sig.tagline ? (
    <p style={{ fontSize: taglineSize, letterSpacing: taglineLS, color: taglineColor, textTransform: taglineUppercase ? 'uppercase' : 'none' as any, fontWeight: taglineBold ? 'bold' : 'normal', fontStyle: taglineItalic ? 'italic' : 'normal' }}>{sig.tagline}</p>
  ) : null;

  const logoImg = logoUrl ? <MaybeLink url={logoLinkUrl}><img src={logoUrl} width={logoSize} alt="Logo" style={{ display: 'block', height: 'auto', borderRadius: logoRadius }} /></MaybeLink> : null;
  const bannerImg = bannerUrl ? <MaybeLink url={bannerLinkUrl}><img src={bannerUrl} width={bannerSize} alt="Banner" style={{ display: 'block' }} /></MaybeLink> : null;

  const ctaButton = showCta && ctaText && ctaUrl ? (
    <a href={webUrl(ctaUrl)} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '10px 24px', backgroundColor: ctaBg, color: ctaTextColor, borderRadius: '6px', textDecoration: 'none', fontSize: fontSize - 1, fontWeight: 'bold', fontFamily: `${bodyFont}, sans-serif` }}>{ctaText}</a>
  ) : null;

  const socialRow = socials.length > 0 ? (
    <div style={{ display: 'flex', gap: 4 }}>
      {socials.map(s => <a key={s.label} href={s.url} target="_blank" rel="noreferrer"><img src={s.src} alt={s.label} width={socialIconSize} height={socialIconSize} style={{ borderRadius: round ? '50%' : 0 }} /></a>)}
    </div>
  ) : null;

  const horizontalDivider = <hr style={{ border: 0, borderTop: `${dividerThickness}px solid ${dividerColor}`, margin: 0 }} />;
  const disclaimerLine = showDisclaimer && disclaimerText ? (
    <p style={{ fontSize: disclaimerSize, color: '#999999', lineHeight: `${disclaimerSize + 4}px` }}>{disclaimerText}</p>
  ) : null;

  /* ─── Block map with wrappers ─── */
  const w = (id: BlockId, el: JSX.Element | null) =>
    el ? <BlockWrap key={id} id={id} active={isActive(id)} onClick={handleClick}>{el}</BlockWrap> : null;

  const blockMap: Record<BlockId, JSX.Element | null> = {
    logo: w('logo', logoImg),
    name: w('name', nameLine),
    company: w('company', companyLine),
    tagline: w('tagline', taglineLine),
    divider: horizontalDivider,
    contacts: w('contacts', contactBlock),
    socials: w('socials', socialRow),
    banner: w('banner', bannerImg),
    cta: w('cta', ctaButton),
    disclaimer: w('disclaimer', disclaimerLine),
  };

  /* ─── Compact layout ─── */
  if (sig.layout === 'Compact') {
    return (
      <div style={{ fontFamily: `${bodyFont}, sans-serif` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {logoImg && <BlockWrap id="logo" active={isActive('logo')} onClick={handleClick}>{logoImg}</BlockWrap>}
          {showVerticalDivider && <div style={{ width: dividerThickness, height: 40, background: dividerColor }} />}
          <BlockWrap id="name" active={isActive('name')} onClick={handleClick}>
            <div>
              <span style={{ fontFamily: `${headingFont}, sans-serif`, fontSize: nameSize, fontWeight: nameBold ? 'bold' : 'normal', color: nameColor }}>{sig.fullName}</span>
              {sig.jobTitle && <span style={{ fontSize: titleSize, color: titleColor, fontStyle: titleItalic ? 'italic' : 'normal' }}> {SEPARATOR_MAP[separator] || '|'} {sig.jobTitle}</span>}
              {sig.company && <span style={{ fontSize: fontSize - 2, color: companyColor }}> {SEPARATOR_MAP[separator] || '|'} {sig.company}</span>}
              {sig.emailAddress && <span style={{ fontSize: fontSize - 2 }}> | <a href={`mailto:${sig.emailAddress}`} style={{ color: accent, textDecoration: 'none' }}>{sig.emailAddress}</a></span>}
              {sig.phone && <span style={{ fontSize: fontSize - 2, color: textColor }}> | {sig.phone}</span>}
              {sig.website && <span style={{ fontSize: fontSize - 2 }}> | <a href={webUrl(sig.website)} target="_blank" rel="noreferrer" style={{ color: accent, textDecoration: 'none' }}>{webLabel(sig.website)}</a></span>}
            </div>
          </BlockWrap>
        </div>
        {disclaimerLine && <div style={{ marginTop: spacing }}>{w('disclaimer', disclaimerLine)}</div>}
      </div>
    );
  }

  /* ─── Zone-based rendering ─── */
  const zones = getZones(sig);

  function renderZone(blocks: BlockId[]) {
    const els = blocks.map(id => ({ id, el: blockMap[id] })).filter(b => b.el);
    if (els.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing }}>
        {els.map(({ id, el }) => <div key={id}>{el}</div>)}
      </div>
    );
  }

  const leftContent = renderZone(zones.left);
  const mainContent = renderZone(zones.main);
  const rightContent = renderZone(zones.right);
  const bottomContent = renderZone(zones.bottom);

  return (
    <div style={{ fontFamily: `${bodyFont}, sans-serif`, maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: logoAlignMap[logoAlign] || 'flex-start', gap: 0 }}>
        {leftContent && <div style={{ paddingRight: 16, flexShrink: 0 }}>{leftContent}</div>}
        {showVerticalDivider && leftContent && (
          <div style={{ width: dividerThickness, background: dividerColor, marginRight: 16, flexShrink: 0, alignSelf: 'stretch' }} />
        )}
        <div style={{ flexGrow: 1 }}>{mainContent}</div>
        {rightContent && (
          <div style={{ paddingLeft: 20, flexShrink: 0, maxWidth: 200, textAlign: 'center' as const }}>{rightContent}</div>
        )}
      </div>
      {bottomContent && <div style={{ marginTop: spacing }}>{bottomContent}</div>}
    </div>
  );
}
