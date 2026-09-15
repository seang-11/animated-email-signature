import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

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

    const s = sig;
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
    const spacing = (s as any).blockSpacing ?? 8;

    // New customization
    const companySize = (s as any).companySize || 13;
    const companyColor = (s as any).companyColor || textColor;
    const companyBold = (s as any).companyBold ?? false;
    const socialPosition = (s as any).socialPosition || 'under_details';
    const socialIconSize = (s as any).socialIconSize || 24;
    const contactIconStyle = (s as any).contactIconStyle || 'filled';
    const showCompany = (s as any).showCompany !== false;
    const showTagline = (s as any).showTagline !== false;
    const showAddress = (s as any).showAddress !== false;
    const showSocials = (s as any).showSocials !== false;
    const showContactIcons = contactIconStyle !== 'none';

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

    const iconPx = Math.round(fontSize * 0.95);
    const iconStylePath = contactIconStyle === 'outlined' ? 'ios' : 'ios-filled';
    const iconUrl = (name: string) => `https://img.icons8.com/${iconStylePath}/50/${accent.replace('#', '')}/${name}.png`;
    const rawSite = (s.website || '').trim();
    const siteHref = /^https?:\/\//i.test(rawSite) ? rawSite : `https://${rawSite}`;
    const siteLabel = rawSite.replace(/^https?:\/\//i, '').replace(/\/$/, '');

    const contactRows: string[] = [];
    function addRow(iconName: string, content: string) {
      if (showContactIcons) {
        contactRows.push(
          `<tr><td style="vertical-align:top;padding:3px 7px 3px 0;line-height:0;"><img src="${iconUrl(iconName)}" width="${iconPx}" height="${iconPx}" alt="" style="border:0;display:block;" /></td><td style="vertical-align:top;font-size:${fontSize}px;line-height:${fontSize + 6}px;padding:1px 0;">${content}</td></tr>`
        );
      } else {
        contactRows.push(
          `<tr><td style="vertical-align:top;font-size:${fontSize}px;line-height:${fontSize + 6}px;padding:2px 0;">${content}</td></tr>`
        );
      }
    }
    if (s.emailAddress) addRow('new-post', `<a href="mailto:${s.emailAddress}" style="color:${accent};text-decoration:none;">${s.emailAddress}</a>`);
    if (s.phone) addRow('phone', `<span style="color:${textColor};">${s.phone}</span>`);
    if (s.website) addRow('domain', `<a href="${siteHref}" target="_blank" style="color:${accent};text-decoration:none;">${siteLabel}</a>`);
    const addressParts = [s.addressLine1, s.addressLine2].filter(Boolean).join(', ');
    if (addressParts && showAddress) addRow('marker', `<span style="color:${textColor};">${addressParts}</span>`);

    const contactTable = contactRows.length > 0
      ? `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;">${contactRows.join('')}</table>`
      : '';

    const layout = s.layout || 'Logo Left';

    const nameLine = `<table cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="3" style="width:3px;background:${accent};font-size:1px;line-height:1px;">&nbsp;</td>
      <td style="padding-left:10px;font-family:${headingFont},sans-serif;font-size:${fontSize + 4}px;line-height:${fontSize + 12}px;color:${accent};">
        <strong>${s.fullName || ''}</strong>${s.jobTitle ? `<span style="color:#c4c4c4;font-weight:normal;padding:0 7px;">|</span><span style="color:${textColor};font-weight:normal;">${s.jobTitle}</span>` : ''}
      </td>
    </tr></table>`;

    const companyLine = s.company && showCompany
      ? `<p style="margin:2px 0 0 13px;font-size:${companySize}px;color:${companyColor};font-weight:${companyBold ? 'bold' : 'normal'};line-height:${companySize + 5}px;">${s.company}</p>`
      : '';

    const taglineHtml = showTagline && s.tagline
      ? `<p style="margin:${spacing}px 0 0;font-size:${fontSize - 2}px;letter-spacing:1px;color:${accent};text-transform:uppercase;">${s.tagline}</p>`
      : '';

    const socialBlock = socialHtml ? `<div style="margin-top:${spacing}px;">${socialHtml}</div>` : '';

    if (layout === 'Stacked') {
      const html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;max-width:600px;">
  <tr><td style="padding-bottom:${spacing + 4}px;">
    ${logoUrl ? `<img src="${logoUrl}" width="${logoSize}" height="${logoSize}" style="border:0;display:block;" alt="Logo" />` : ''}
  </td></tr>
  <tr><td>
    ${nameLine}
    ${companyLine}
  </td></tr>
  ${divider ? `<tr><td style="padding:${spacing}px 0;"><hr style="border:0;border-top:1px solid #ddd;margin:0;" /></td></tr>` : ''}
  <tr><td style="padding-top:4px;">${contactTable}</td></tr>
  ${taglineHtml ? `<tr><td>${taglineHtml}</td></tr>` : ''}
  ${bannerUrl ? `<tr><td style="padding-top:${spacing}px;"><img src="${bannerUrl}" width="${bannerSize}" style="border:0;" alt="Banner" /></td></tr>` : ''}
  ${socialBlock ? `<tr><td>${socialBlock}</td></tr>` : ''}
</table>`;
      return { html };
    }

    if (layout === 'Compact') {
      const html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;max-width:600px;">
  <tr>
    <td style="vertical-align:middle;padding-right:12px;">
      ${logoUrl ? `<img src="${logoUrl}" width="${Math.round(logoSize * 0.6)}" style="border:0;" alt="Logo" />` : ''}
    </td>
    ${divider ? `<td style="vertical-align:middle;padding-right:12px;"><div style="width:1px;height:40px;background:#ddd;"></div></td>` : ''}
    <td style="vertical-align:middle;">
      <span style="font-family:${headingFont},sans-serif;font-size:${fontSize}px;font-weight:bold;color:${accent};">${s.fullName || ''}</span>
      ${s.jobTitle ? ` <span style="font-size:${fontSize - 2}px;color:${textColor};">| ${s.jobTitle}</span>` : ''}
      ${s.company && showCompany ? ` <span style="font-size:${fontSize - 2}px;color:${companyColor};">| ${s.company}</span>` : ''}
      ${s.emailAddress ? ` <span style="font-size:${fontSize - 2}px;">| <a href="mailto:${s.emailAddress}" style="color:${accent};text-decoration:none;">${s.emailAddress}</a></span>` : ''}
      ${s.phone ? ` <span style="font-size:${fontSize - 2}px;color:${textColor};">| ${s.phone}</span>` : ''}
      ${s.website ? ` <span style="font-size:${fontSize - 2}px;">| <a href="${siteHref}" target="_blank" style="color:${accent};text-decoration:none;">${siteLabel}</a></span>` : ''}
    </td>
  </tr>
</table>`;
      return { html };
    }

    // Default: Logo Left — social position is configurable
    const socialsInMain = socialPosition === 'under_details' ? socialBlock : '';
    const socialsInRight = socialPosition === 'right_column' ? socialBlock : '';
    const hasBannerColumn = bannerUrl || taglineHtml || socialsInRight;

    const html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;max-width:600px;">
  <tr>
    <td style="vertical-align:top;padding-right:16px;">
      ${logoUrl ? `<img src="${logoUrl}" width="${logoSize}" height="${logoSize}" style="border:0;display:block;" alt="Logo" />` : ''}
    </td>
    ${divider ? `<td style="vertical-align:top;padding-right:16px;"><div style="width:1px;min-height:80px;background:#ddd;"></div></td>` : ''}
    <td style="vertical-align:top;">
      ${nameLine}
      ${companyLine}
      <div style="margin-top:${spacing}px;">${contactTable}</div>
      ${socialsInMain}
    </td>
    ${hasBannerColumn ? `<td style="vertical-align:top;padding-left:20px;text-align:center;max-width:200px;word-wrap:break-word;">
      ${bannerUrl ? `<img src="${bannerUrl}" width="${bannerSize}" style="border:0;display:block;" alt="Banner" />` : ''}
      ${taglineHtml}
      ${socialsInRight}
    </td>` : ''}
  </tr>
</table>`;
    return { html };
  },
});
