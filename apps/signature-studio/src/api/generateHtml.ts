import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

type BlockId = 'logo' | 'name' | 'company' | 'tagline' | 'contacts' | 'socials' | 'banner' | 'cta';
type ZonesConfig = Record<'left' | 'main' | 'right' | 'bottom', BlockId[]>;

const VALID_BLOCKS = new Set<string>(['logo', 'name', 'company', 'tagline', 'contacts', 'socials', 'banner', 'cta']);

const PRESET_ZONES: Record<string, ZonesConfig> = {
  'Logo Left': { left: ['logo'], main: ['name', 'company', 'contacts', 'cta', 'socials'], right: ['banner', 'tagline'], bottom: [] },
  Stacked: { left: [], main: ['logo', 'name', 'company', 'contacts', 'cta', 'tagline', 'banner', 'socials'], right: [], bottom: [] },
  Compact: { left: ['logo'], main: ['name', 'company', 'contacts'], right: [], bottom: [] },
};

function getZones(s: any): ZonesConfig {
  if (s.layoutZones) {
    try {
      const parsed = JSON.parse(s.layoutZones) as ZonesConfig;
      const out = {} as ZonesConfig;
      for (const z of ['left', 'main', 'right', 'bottom'] as const) out[z] = (parsed[z] || []).filter(b => VALID_BLOCKS.has(b));
      return out;
    } catch { /* fall through */ }
  }
  return PRESET_ZONES[s.layout || 'Logo Left'] || PRESET_ZONES['Logo Left'];
}

const SEPARATOR_MAP: Record<string, string> = { pipe: '|', bullet: '&middot;', dash: '&mdash;' };
const LOGO_RADIUS: Record<string, string> = { square: '0', rounded: '8px', circle: '50%' };

function normalizeUrl(raw: string) { const v = (raw || '').trim(); return /^https?:\/\//i.test(v) ? v : `https://${v}`; }

export default createEndpoint({
  description: 'Generates email-client-ready HTML for the signature',
  authenticated: true,
  inputSchema: z.object({ id: z.string() }),
  outputSchema: z.object({ html: z.string() }),
  execute: async ({ input, context }) => {
    const sig = await zite.emailSignatures.findOne({ id: input.id });
    if (!sig || !sig.owner?.includes(context.user.id)) throw new Error('Signature not found or not yours');
    const s: any = sig;

    /* ─── Extract values ─── */
    const accent = s.accentColor || '#111111';
    const textColor = s.textColor || '#333333';
    const headingFont = s.headingFont || 'Arial';
    const bodyFont = s.bodyFont || 'Arial';
    const logoSize = s.logoSize || 96;
    const fontSize = s.baseTextSize || 14;
    const bannerSize = s.bannerSize || 180;
    const logoUrl = s.logo?.[0]?.url || '';
    const bannerUrl = s.bannerImage?.[0]?.url || '';
    const showVerticalDivider = s.showDivider !== false;
    const round = s.roundSocialIcons !== false;
    const spacing = s.blockSpacing ?? 8;

    const companySize = s.companySize || 13;
    const companyColor = s.companyColor || textColor;
    const companyBold = s.companyBold ?? false;
    const companyItalic = s.companyItalic ?? false;
    const companyUppercase = s.companyUppercase ?? false;
    const companyLS = s.companyLetterSpacing ?? 0;

    const socialIconSize = s.socialIconSize || 24;
    const contactIconStyle = s.contactIconStyle || 'filled';
    const showContactIcons = contactIconStyle !== 'none';    const isDarkSafe = contactIconStyle === 'dark_mode_safe';
    const logoAlign = s.logoAlignment || 'top';
    const contactLayout = s.contactLayout || 'stacked';
    const showAccentBar = s.showNameAccentBar !== false;
    const accentBarColor = s.accentBarColor || accent;
    const accentBarThickness = s.accentBarThickness ?? 3;

    const nameSize = s.nameSize || fontSize + 4;
    const nameColor = s.nameColor || accent;
    const nameBold = s.nameBold !== false;
    const titleSize = s.jobTitleSize || fontSize;
    const titleColor = s.jobTitleColor || textColor;
    const titleItalic = s.jobTitleItalic ?? false;
    const separator = s.nameTitleSeparator || 'pipe';
    const logoShape = (s.logoShape || 'square').toLowerCase();
    const logoLinkUrl = s.logoLinkUrl || '';
    const dividerColor = s.dividerColor || '#dddddd';
    const dividerThickness = s.dividerThickness ?? 1;
    const bannerLinkUrl = s.bannerLinkUrl || '';
    const ctaText = s.ctaText || '';
    const ctaUrl = s.ctaUrl || '';
    const showCta = !!(ctaText && ctaUrl);
    const ctaBg = s.ctaBackgroundColor || accent;
    const ctaTextClr = s.ctaTextColor || '#ffffff';

    const taglineSize = s.taglineSize || fontSize - 2;
    const taglineColor = s.taglineColor || accent;
    const taglineBold = s.taglineBold ?? false;
    const taglineItalic = s.taglineItalic ?? false;
    const taglineUppercase = s.taglineUppercase !== false;
    const taglineLS = s.taglineLetterSpacing ?? 1;

    const logoRadius = LOGO_RADIUS[logoShape] || '0';

    /* ─── Helpers ─── */
    const wrapLink = (url: string, inner: string) => url ? `<a href="${normalizeUrl(url)}" target="_blank" style="text-decoration:none;">${inner}</a>` : inner;

    const logoImg = logoUrl ? `<img src="${logoUrl}" width="${logoSize}" style="border:0;display:block;height:auto;${logoRadius !== '0' ? `border-radius:${logoRadius};` : ''}" alt="Logo" />` : '';
    const logoHtml = wrapLink(logoLinkUrl, logoImg);
    const bannerImg = bannerUrl ? `<img src="${bannerUrl}" width="${bannerSize}" style="border:0;display:block;" alt="Banner" />` : '';
    const bannerHtml = wrapLink(bannerLinkUrl, bannerImg);

    /* ─── Socials ─── */
    const socialsList: { url: string; icon: string; label: string }[] = [];
    if (s.linkedInUrl) socialsList.push({ url: s.linkedInUrl, icon: 'https://cdn-icons-png.flaticon.com/512/174/174857.png', label: 'LinkedIn' });
    if (s.instagramUrl) socialsList.push({ url: s.instagramUrl, icon: 'https://cdn-icons-png.flaticon.com/512/174/174855.png', label: 'Instagram' });
    if (s.facebookUrl) socialsList.push({ url: s.facebookUrl, icon: 'https://cdn-icons-png.flaticon.com/512/174/174848.png', label: 'Facebook' });
    if (s.threadsUrl) socialsList.push({ url: s.threadsUrl, icon: 'https://cdn-icons-png.flaticon.com/512/14079/14079772.png', label: 'Threads' });
    if (s.xUrl) socialsList.push({ url: s.xUrl, icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968830.png', label: 'X' });
    if (s.tikTokUrl) socialsList.push({ url: s.tikTokUrl, icon: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png', label: 'TikTok' });
    if (s.youTubeUrl) socialsList.push({ url: s.youTubeUrl, icon: 'https://cdn-icons-png.flaticon.com/512/174/174883.png', label: 'YouTube' });
    if (s.substackUrl) socialsList.push({ url: s.substackUrl, icon: 'https://img.icons8.com/color/96/substack.png', label: 'Substack' });

    const socialHtml = socialsList.map(sc =>
      `<a href="${sc.url}" target="_blank" style="text-decoration:none;margin-right:4px;"><img src="${sc.icon}" alt="${sc.label}" width="${socialIconSize}" height="${socialIconSize}" style="border:0;${round ? 'border-radius:50%;' : ''}" /></a>`
    ).join('');

    /* ─── Contact rows ─── */
    const iconPx = Math.round(fontSize * 0.95);
    const chipSize = iconPx + 8;
    const iconStylePath = isDarkSafe ? 'ios-filled' : (contactIconStyle === 'outlined' ? 'ios' : 'ios-filled');
    const iconColor = isDarkSafe ? 'FFFFFF' : accent.replace('#', '');
    const iconUrl = (name: string) => `https://img.icons8.com/${iconStylePath}/50/${iconColor}/${name}.png`;
    const rawSite = (s.website || '').trim();
    const siteHref = /^https?:\/\//i.test(rawSite) ? rawSite : `https://${rawSite}`;
    const siteLabel = rawSite.replace(/^https?:\/\//i, '').replace(/\/$/, '');

    const contactRows: string[] = [];
    function addRow(iconName: string, content: string) {
      if (showContactIcons) {
        if (isDarkSafe) {
          contactRows.push(`<tr><td style="vertical-align:top;padding:3px 7px 3px 0;line-height:0;"><table cellpadding="0" cellspacing="0" border="0"><tr><td width="${chipSize}" height="${chipSize}" style="width:${chipSize}px;height:${chipSize}px;background-color:${accent};border-radius:50%;text-align:center;vertical-align:middle;line-height:0;"><img src="${iconUrl(iconName)}" width="${iconPx}" height="${iconPx}" alt="" style="border:0;display:inline-block;" /></td></tr></table></td><td style="vertical-align:top;font-size:${fontSize}px;line-height:${fontSize + 6}px;padding:3px 0;">${content}</td></tr>`);
        } else {
          contactRows.push(`<tr><td style="vertical-align:top;padding:3px 7px 3px 0;line-height:0;"><img src="${iconUrl(iconName)}" width="${iconPx}" height="${iconPx}" alt="" style="border:0;display:block;" /></td><td style="vertical-align:top;font-size:${fontSize}px;line-height:${fontSize + 6}px;padding:1px 0;">${content}</td></tr>`);
        }
      } else {
        contactRows.push(`<tr><td style="vertical-align:top;font-size:${fontSize}px;line-height:${fontSize + 6}px;padding:2px 0;">${content}</td></tr>`);
      }
    }
    if (s.emailAddress) addRow('new-post', `<a href="mailto:${s.emailAddress}" style="color:${accent};text-decoration:none;">${s.emailAddress}</a>`);
    if (s.phone) addRow('phone', `<span style="color:${textColor};">${s.phone}</span>`);
    if (s.website) addRow('domain', `<a href="${siteHref}" target="_blank" style="color:${accent};text-decoration:none;">${siteLabel}</a>`);


    let contactTable = '';
    if (contactRows.length > 0) {
      if (contactLayout === 'two_column' && contactRows.length >= 3) {
        const mid = Math.ceil(contactRows.length / 2);
        contactTable = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;"><tr><td style="vertical-align:top;padding-right:20px;"><table cellpadding="0" cellspacing="0" border="0">${contactRows.slice(0, mid).join('')}</table></td><td style="vertical-align:top;"><table cellpadding="0" cellspacing="0" border="0">${contactRows.slice(mid).join('')}</table></td></tr></table>`;
      } else {
        contactTable = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;">${contactRows.join('')}</table>`;
      }
    }

    /* ─── Name line ─── */
    const titleHtml = s.jobTitle ? (
      separator === 'new_line'
        ? `<div style="font-size:${titleSize}px;color:${titleColor};font-weight:normal;${titleItalic ? 'font-style:italic;' : ''}line-height:${titleSize + 6}px;">${s.jobTitle}</div>`
        : `<span style="color:${dividerColor};font-weight:normal;padding:0 7px;">${SEPARATOR_MAP[separator] || '|'}</span><span style="color:${titleColor};font-weight:normal;font-size:${titleSize}px;${titleItalic ? 'font-style:italic;' : ''}">${s.jobTitle}</span>`
    ) : '';

    const nameLineHtml = `<div style="font-family:${headingFont},sans-serif;font-size:${nameSize}px;line-height:${nameSize + 8}px;color:${nameColor};"><span style="font-weight:${nameBold ? 'bold' : 'normal'};">${s.fullName || ''}</span>${titleHtml}</div>`;

    /* ─── Company line ─── */
    const companyLineHtml = s.company
      ? `<p style="margin:2px 0 0 0;font-size:${companySize}px;color:${companyColor};font-weight:${companyBold ? 'bold' : 'normal'};${companyItalic ? 'font-style:italic;' : ''}${companyUppercase ? 'text-transform:uppercase;' : ''}${companyLS ? `letter-spacing:${companyLS}px;` : ''}line-height:${companySize + 5}px;">${s.company}</p>`
      : '';

    /* ─── Tagline ─── */
    const taglineHtml = s.tagline
      ? `<p style="margin:0;font-size:${taglineSize}px;letter-spacing:${taglineLS}px;color:${taglineColor};${taglineUppercase ? 'text-transform:uppercase;' : ''}${taglineBold ? 'font-weight:bold;' : ''}${taglineItalic ? 'font-style:italic;' : ''}">${s.tagline}</p>`
      : '';

    const socialBlock = socialHtml ? `<div style="margin:0;">${socialHtml}</div>` : '';

    const ctaBlock = showCta && ctaText && ctaUrl
      ? `<table cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:${ctaBg};border-radius:6px;padding:10px 24px;text-align:center;"><a href="${normalizeUrl(ctaUrl)}" target="_blank" style="color:${ctaTextClr};text-decoration:none;font-size:${fontSize - 1}px;font-weight:bold;font-family:${bodyFont},sans-serif;display:inline-block;">${ctaText}</a></td></tr></table>`
      : '';

    /* ─── Block map ─── */
    const blockMap: Record<BlockId, string> = {
      logo: logoHtml, name: nameLineHtml, company: companyLineHtml, tagline: taglineHtml,
      contacts: contactTable, socials: socialBlock, banner: bannerHtml,
      cta: ctaBlock,
    };

    /* ─── Compact layout ─── */
    const layout = s.layout || 'Logo Left';
    if (layout === 'Compact') {
      const sep = SEPARATOR_MAP[separator] || '|';
      const html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;max-width:600px;"><tr><td style="vertical-align:middle;padding-right:12px;">${logoHtml}</td>${showVerticalDivider ? `<td style="vertical-align:middle;padding-right:12px;"><div style="width:${dividerThickness}px;height:40px;background:${dividerColor};"></div></td>` : ''}<td style="vertical-align:middle;"><span style="font-family:${headingFont},sans-serif;font-size:${nameSize}px;font-weight:${nameBold ? 'bold' : 'normal'};color:${nameColor};">${s.fullName || ''}</span>${s.jobTitle ? ` <span style="font-size:${titleSize}px;color:${titleColor};${titleItalic ? 'font-style:italic;' : ''}">${sep} ${s.jobTitle}</span>` : ''}${s.company ? ` <span style="font-size:${fontSize - 2}px;color:${companyColor};">${sep} ${s.company}</span>` : ''}${s.emailAddress ? ` <span style="font-size:${fontSize - 2}px;">| <a href="mailto:${s.emailAddress}" style="color:${accent};text-decoration:none;">${s.emailAddress}</a></span>` : ''}${s.phone ? ` <span style="font-size:${fontSize - 2}px;color:${textColor};">| ${s.phone}</span>` : ''}${s.website ? ` <span style="font-size:${fontSize - 2}px;">| <a href="${siteHref}" target="_blank" style="color:${accent};text-decoration:none;">${siteLabel}</a></span>` : ''}</td></tr></table>`;
      return { html };
    }

    /* ─── Zone-based rendering ─── */
    const zones = getZones(s);

    const BAR_BLOCKS = new Set<BlockId>(['name', 'company', 'tagline']);

    function stack(items: string[]): string {
      return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;">${items.map((html, i) => `<tr><td${i < items.length - 1 ? ` style="padding-bottom:${spacing}px;"` : ''}>${html}</td></tr>`).join('')}</table>`;
    }

    function renderZoneHtml(blocks: BlockId[]): string {
      const items: string[] = [];
      let i = 0;
      while (i < blocks.length) {
        if (showAccentBar && BAR_BLOCKS.has(blocks[i])) {
          const run: string[] = [];
          while (i < blocks.length && BAR_BLOCKS.has(blocks[i])) {
            if (blockMap[blocks[i]]) run.push(blockMap[blocks[i]]);
            i++;
          }
          if (run.length > 0) {
            // One continuous bar alongside the whole name/company/tagline group
            const inner = run.map((html, idx) => `<tr><td${idx > 0 ? ' style="padding-top:2px;"' : ''}>${html}</td></tr>`).join('');
            items.push(`<table cellpadding="0" cellspacing="0" border="0"><tr><td width="${accentBarThickness}" style="width:${accentBarThickness}px;background:${accentBarColor};font-size:1px;line-height:1px;">&nbsp;</td><td style="padding-left:10px;"><table cellpadding="0" cellspacing="0" border="0">${inner}</table></td></tr></table>`);
          }
          continue;
        }
        if (blockMap[blocks[i]]) items.push(blockMap[blocks[i]]);
        i++;
      }
      if (items.length === 0) return '';
      return stack(items);
    }

    const leftHtml = renderZoneHtml(zones.left);
    const mainHtml = renderZoneHtml(zones.main);
    const rightHtml = renderZoneHtml(zones.right);
    const bottomHtml = renderZoneHtml(zones.bottom);
    const logoVAlign = logoAlign === 'middle' ? 'middle' : logoAlign === 'bottom' ? 'bottom' : 'top';

    let cols = '';
    if (leftHtml) cols += `<td style="vertical-align:${logoVAlign};padding-right:16px;">${leftHtml}</td>`;
    if (showVerticalDivider && leftHtml) cols += `<td style="vertical-align:top;padding-right:16px;"><div style="width:${dividerThickness}px;min-height:80px;background:${dividerColor};"></div></td>`;
    cols += `<td style="vertical-align:top;">${mainHtml}</td>`;
    if (rightHtml) cols += `<td style="vertical-align:top;padding-left:20px;text-align:center;max-width:200px;">${rightHtml}</td>`;

    const colCount = (leftHtml ? 1 : 0) + (showVerticalDivider && leftHtml ? 1 : 0) + 1 + (rightHtml ? 1 : 0);

    const html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;max-width:600px;"><tr>${cols}</tr>${bottomHtml ? `<tr><td colspan="${colCount}" style="padding-top:${spacing}px;">${bottomHtml}</td></tr>` : ''}</table>`;
    return { html };
  },
});
