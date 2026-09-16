import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

const SEPARATOR_MAP: Record<string, string> = { pipe: '|', bullet: '&middot;', dash: '&mdash;' };
const LOGO_RADIUS: Record<string, string> = { square: '0', rounded: '8px', circle: '50%' };

function normalizeUrl(raw: string) {
  const v = (raw || '').trim();
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export default createEndpoint({
  description: 'Generates email-client-ready HTML for the signature',
  authenticated: true,
  inputSchema: z.object({ id: z.string() }),
  outputSchema: z.object({ html: z.string() }),
  execute: async ({ input, context }) => {
    const sig = await zite.emailSignatures.findOne({ id: input.id });
    if (!sig || !sig.owner?.includes(context.user.id)) {
      throw new Error('Signature not found or not yours');
    }

    const s: any = sig;
    const accent = s.accentColor || '#111111';
    const textColor = s.textColor || '#333333';
    const headingFont = s.headingFont || 'Arial';
    const bodyFont = s.bodyFont || 'Arial';
    const logoSize = s.logoSize || 96;
    const fontSize = s.baseTextSize || 14;
    const bannerSize = s.bannerSize || 180;
    const logoUrl = s.logo?.[0]?.url || '';
    const bannerUrl = s.bannerImage?.[0]?.url || '';
    const divider = s.showDivider !== false;
    const round = s.roundSocialIcons !== false;
    const spacing = s.blockSpacing ?? 8;

    const companySize = s.companySize || 13;
    const companyColor = s.companyColor || textColor;
    const companyBold = s.companyBold ?? false;
    const socialPosition = s.socialPosition || 'under_details';
    const socialIconSize = s.socialIconSize || 24;
    const contactIconStyle = s.contactIconStyle || 'filled';
    const showCompany = s.showCompany !== false;
    const showTagline = s.showTagline !== false;
    const showAddress = s.showAddress !== false;
    const showSocials = s.showSocials !== false;
    const showContactIcons = contactIconStyle !== 'none';
    const isDarkSafe = contactIconStyle === 'dark_mode_safe';
    const logoAlign = s.logoAlignment || 'top';
    const contactLayout = s.contactLayout || 'stacked';
    const showAccentBar = s.showNameAccentBar !== false;

    // New fields
    const nameSize = s.nameSize || fontSize + 4;
    const nameColor = s.nameColor || accent;
    const nameBold = s.nameBold !== false;
    const titleSize = s.jobTitleSize || fontSize;
    const titleColor = s.jobTitleColor || textColor;
    const titleItalic = s.jobTitleItalic ?? false;
    const separator = s.nameTitleSeparator || 'pipe';
    const logoShape = s.logoShape || 'square';
    const logoLinkUrl = s.logoLinkUrl || '';
    const dividerColor = s.dividerColor || '#dddddd';
    const dividerThickness = s.dividerThickness ?? 1;
    const bannerLinkUrl = s.bannerLinkUrl || '';
    const showCta = s.showCta ?? false;
    const ctaText = s.ctaText || '';
    const ctaUrl = s.ctaUrl || '';
    const ctaBg = s.ctaBackgroundColor || accent;
    const ctaTextClr = s.ctaTextColor || '#ffffff';
    const showDisclaimer = s.showDisclaimer ?? false;
    const disclaimerText = s.disclaimerText || '';
    const disclaimerSize = s.disclaimerSize || 10;
    const pronouns = s.pronouns || '';

    const logoRadius = LOGO_RADIUS[logoShape] || '0';

    // Helpers
    const wrapLink = (url: string, inner: string) => url ? `<a href="${normalizeUrl(url)}" target="_blank" style="text-decoration:none;">${inner}</a>` : inner;

    const logoImg = logoUrl
      ? `<img src="${logoUrl}" width="${logoSize}" style="border:0;display:block;height:auto;${logoRadius !== '0' ? `border-radius:${logoRadius};` : ''}" alt="Logo" />`
      : '';
    const logoHtml = wrapLink(logoLinkUrl, logoImg);

    const bannerImg = bannerUrl
      ? `<img src="${bannerUrl}" width="${bannerSize}" style="border:0;display:block;" alt="Banner" />`
      : '';
    const bannerHtml = wrapLink(bannerLinkUrl, bannerImg);

    // Socials
    const socials: { url: string; icon: string; label: string }[] = [];
    if (s.linkedInUrl) socials.push({ url: s.linkedInUrl, icon: 'https://cdn-icons-png.flaticon.com/512/174/174857.png', label: 'LinkedIn' });
    if (s.instagramUrl) socials.push({ url: s.instagramUrl, icon: 'https://cdn-icons-png.flaticon.com/512/174/174855.png', label: 'Instagram' });
    if (s.facebookUrl) socials.push({ url: s.facebookUrl, icon: 'https://cdn-icons-png.flaticon.com/512/174/174848.png', label: 'Facebook' });
    if (s.threadsUrl) socials.push({ url: s.threadsUrl, icon: 'https://cdn-icons-png.flaticon.com/512/14079/14079772.png', label: 'Threads' });
    if (s.xUrl) socials.push({ url: s.xUrl, icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968830.png', label: 'X' });
    if (s.tikTokUrl) socials.push({ url: s.tikTokUrl, icon: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png', label: 'TikTok' });

    const socialHtml = showSocials ? socials.map(sc =>
      `<a href="${sc.url}" target="_blank" style="text-decoration:none;margin-right:4px;"><img src="${sc.icon}" alt="${sc.label}" width="${socialIconSize}" height="${socialIconSize}" style="border:0;${round ? 'border-radius:50%;' : ''}" /></a>`
    ).join('') : '';

    // Contact rows
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
    const addressParts = [s.addressLine1, s.addressLine2].filter(Boolean).join(', ');
    if (addressParts && showAddress) addRow('marker', `<span style="color:${textColor};">${addressParts}</span>`);

    let contactTable = '';
    if (contactRows.length > 0) {
      if (contactLayout === 'two_column' && contactRows.length >= 3) {
        const mid = Math.ceil(contactRows.length / 2);
        contactTable = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;"><tr><td style="vertical-align:top;padding-right:20px;"><table cellpadding="0" cellspacing="0" border="0">${contactRows.slice(0, mid).join('')}</table></td><td style="vertical-align:top;"><table cellpadding="0" cellspacing="0" border="0">${contactRows.slice(mid).join('')}</table></td></tr></table>`;
      } else {
        contactTable = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;">${contactRows.join('')}</table>`;
      }
    }

    const layout = s.layout || 'Logo Left';

    // Name line
    const pronounsHtml = pronouns ? ` <span style="font-weight:normal;font-size:${titleSize}px;color:${textColor};opacity:0.6;">(${pronouns})</span>` : '';
    const titleHtml = s.jobTitle ? (
      separator === 'new_line'
        ? `<div style="font-size:${titleSize}px;color:${titleColor};font-weight:normal;${titleItalic ? 'font-style:italic;' : ''}line-height:${titleSize + 6}px;">${s.jobTitle}</div>`
        : `<span style="color:${dividerColor};font-weight:normal;padding:0 7px;">${SEPARATOR_MAP[separator] || '|'}</span><span style="color:${titleColor};font-weight:normal;font-size:${titleSize}px;${titleItalic ? 'font-style:italic;' : ''}">${s.jobTitle}</span>`
    ) : '';

    const nameLine = `<table cellpadding="0" cellspacing="0" border="0"><tr>
      ${showAccentBar ? `<td width="${dividerThickness + 2}" style="width:${dividerThickness + 2}px;background:${accent};font-size:1px;line-height:1px;">&nbsp;</td>` : ''}
      <td style="${showAccentBar ? 'padding-left:10px;' : ''}font-family:${headingFont},sans-serif;font-size:${nameSize}px;line-height:${nameSize + 8}px;color:${nameColor};">
        <span style="font-weight:${nameBold ? 'bold' : 'normal'};">${s.fullName || ''}${pronounsHtml}</span>${titleHtml}
      </td>
    </tr></table>`;

    const companyLine = s.company && showCompany
      ? `<p style="margin:2px 0 0 ${showAccentBar ? 13 : 0}px;font-size:${companySize}px;color:${companyColor};font-weight:${companyBold ? 'bold' : 'normal'};line-height:${companySize + 5}px;">${s.company}</p>`
      : '';

    const taglineHtml = showTagline && s.tagline
      ? `<p style="margin:${spacing}px 0 0;font-size:${fontSize - 2}px;letter-spacing:1px;color:${accent};text-transform:uppercase;">${s.tagline}</p>`
      : '';

    const socialBlock = socialHtml ? `<div style="margin-top:${spacing}px;">${socialHtml}</div>` : '';

    // CTA button (bulletproof)
    const ctaBlock = showCta && ctaText && ctaUrl
      ? `<div style="margin-top:${spacing}px;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:${ctaBg};border-radius:6px;padding:10px 24px;text-align:center;"><a href="${normalizeUrl(ctaUrl)}" target="_blank" style="color:${ctaTextClr};text-decoration:none;font-size:${fontSize - 1}px;font-weight:bold;font-family:${bodyFont},sans-serif;display:inline-block;">${ctaText}</a></td></tr></table></div>`
      : '';

    // Disclaimer
    const disclaimerBlock = showDisclaimer && disclaimerText
      ? `<p style="margin:${spacing + 4}px 0 0;font-size:${disclaimerSize}px;color:#999999;line-height:${disclaimerSize + 4}px;">${disclaimerText}</p>`
      : '';

    if (layout === 'Stacked') {
      const html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;max-width:600px;">
  ${logoHtml ? `<tr><td style="padding-bottom:${spacing + 4}px;">${logoHtml}</td></tr>` : ''}
  <tr><td>${nameLine}${companyLine}</td></tr>
  ${divider ? `<tr><td style="padding:${spacing}px 0;"><hr style="border:0;border-top:${dividerThickness}px solid ${dividerColor};margin:0;" /></td></tr>` : ''}
  <tr><td style="padding-top:4px;">${contactTable}</td></tr>
  ${ctaBlock ? `<tr><td>${ctaBlock}</td></tr>` : ''}
  ${taglineHtml ? `<tr><td>${taglineHtml}</td></tr>` : ''}
  ${bannerHtml ? `<tr><td style="padding-top:${spacing}px;">${bannerHtml}</td></tr>` : ''}
  ${socialBlock ? `<tr><td>${socialBlock}</td></tr>` : ''}
  ${disclaimerBlock ? `<tr><td>${disclaimerBlock}</td></tr>` : ''}
</table>`;
      return { html };
    }

    if (layout === 'Compact') {
      const sep = SEPARATOR_MAP[separator] || '|';
      const html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;max-width:600px;">
  <tr>
    <td style="vertical-align:middle;padding-right:12px;">${logoHtml}</td>
    ${divider ? `<td style="vertical-align:middle;padding-right:12px;"><div style="width:${dividerThickness}px;height:40px;background:${dividerColor};"></div></td>` : ''}
    <td style="vertical-align:middle;">
      <span style="font-family:${headingFont},sans-serif;font-size:${nameSize}px;font-weight:${nameBold ? 'bold' : 'normal'};color:${nameColor};">${s.fullName || ''}${pronounsHtml}</span>
      ${s.jobTitle ? ` <span style="font-size:${titleSize}px;color:${titleColor};${titleItalic ? 'font-style:italic;' : ''}">${sep} ${s.jobTitle}</span>` : ''}
      ${s.company && showCompany ? ` <span style="font-size:${fontSize - 2}px;color:${companyColor};">${sep} ${s.company}</span>` : ''}
      ${s.emailAddress ? ` <span style="font-size:${fontSize - 2}px;">| <a href="mailto:${s.emailAddress}" style="color:${accent};text-decoration:none;">${s.emailAddress}</a></span>` : ''}
      ${s.phone ? ` <span style="font-size:${fontSize - 2}px;color:${textColor};">| ${s.phone}</span>` : ''}
      ${s.website ? ` <span style="font-size:${fontSize - 2}px;">| <a href="${siteHref}" target="_blank" style="color:${accent};text-decoration:none;">${siteLabel}</a></span>` : ''}
    </td>
  </tr>
  ${disclaimerBlock ? `<tr><td colspan="3">${disclaimerBlock}</td></tr>` : ''}
</table>`;
      return { html };
    }

    // Logo Left
    const socialsInMain = socialPosition === 'under_details' ? socialBlock : '';
    const socialsInRight = socialPosition === 'right_column' ? socialBlock : '';
    const hasBannerColumn = bannerUrl || taglineHtml || socialsInRight;
    const logoVAlign = logoAlign === 'middle' ? 'middle' : logoAlign === 'bottom' ? 'bottom' : 'top';

    const html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;max-width:600px;">
  <tr>
    <td style="vertical-align:${logoVAlign};padding-right:16px;">${logoHtml}</td>
    ${divider ? `<td style="vertical-align:top;padding-right:16px;"><div style="width:${dividerThickness}px;min-height:80px;background:${dividerColor};"></div></td>` : ''}
    <td style="vertical-align:top;">
      ${nameLine}
      ${companyLine}
      <div style="margin-top:${spacing}px;">${contactTable}</div>
      ${ctaBlock}
      ${socialsInMain}
    </td>
    ${hasBannerColumn ? `<td style="vertical-align:top;padding-left:20px;text-align:center;max-width:200px;word-wrap:break-word;">
      ${bannerHtml}
      ${taglineHtml}
      ${socialsInRight}
    </td>` : ''}
  </tr>
  ${disclaimerBlock ? `<tr><td colspan="4">${disclaimerBlock}</td></tr>` : ''}
</table>`;
    return { html };
  },
});
