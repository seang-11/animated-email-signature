import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Generates email-client-ready HTML for the signature',
  authenticated: true,
  inputSchema: z.object({ id: z.string() }),
  outputSchema: z.object({ html: z.string() }),
  execute: async ({ input }) => {
    const sig = await zite.emailSignatures.findOne({ id: input.id });
    if (!sig) throw new Error('Signature not found');

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

    const socials: { url: string; icon: string; label: string }[] = [];
    if (s.linkedInUrl) socials.push({ url: s.linkedInUrl, icon: 'https://cdn-icons-png.flaticon.com/512/174/174857.png', label: 'LinkedIn' });
    if (s.instagramUrl) socials.push({ url: s.instagramUrl, icon: 'https://cdn-icons-png.flaticon.com/512/174/174855.png', label: 'Instagram' });
    if (s.facebookUrl) socials.push({ url: s.facebookUrl, icon: 'https://cdn-icons-png.flaticon.com/512/174/174848.png', label: 'Facebook' });
    if (s.threadsUrl) socials.push({ url: s.threadsUrl, icon: 'https://cdn-icons-png.flaticon.com/512/14079/14079772.png', label: 'Threads' });
    if (s.xUrl) socials.push({ url: s.xUrl, icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968830.png', label: 'X' });
    if (s.tikTokUrl) socials.push({ url: s.tikTokUrl, icon: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png', label: 'TikTok' });

    const socialHtml = socials.map(sc =>
      `<a href="${sc.url}" target="_blank" style="text-decoration:none;margin-right:4px;"><img src="${sc.icon}" alt="${sc.label}" width="24" height="24" style="border:0;${round ? 'border-radius:50%;' : ''}" /></a>`
    ).join('');

    // Build contact rows as a nested table for email-client reliability.
    // Icons8 serves PNGs tinted to any hex via the URL path, so icons follow
    // the accent color and render identically in every client (unlike emoji).
    // Order: email, phone, website, address
    const iconPx = Math.round(fontSize * 0.95);
    const iconUrl = (name: string) => `https://img.icons8.com/ios-filled/50/${accent.replace('#', '')}/${name}.png`;
    // Website may be entered with or without a scheme — normalize so the link
    // always resolves (and never becomes https://https://...).
    const rawSite = (s.website || '').trim();
    const siteHref = /^https?:\/\//i.test(rawSite) ? rawSite : `https://${rawSite}`;
    const siteLabel = rawSite.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    const contactRows: string[] = [];
    function addRow(iconName: string, content: string) {
      contactRows.push(
        `<tr><td style="vertical-align:top;padding:3px 7px 3px 0;line-height:0;"><img src="${iconUrl(iconName)}" width="${iconPx}" height="${iconPx}" alt="" style="border:0;display:block;" /></td><td style="vertical-align:top;font-size:${fontSize}px;line-height:${fontSize + 6}px;padding:1px 0;">${content}</td></tr>`
      );
    }
    if (s.emailAddress) addRow('new-post', `<a href="mailto:${s.emailAddress}" style="color:${accent};text-decoration:none;">${s.emailAddress}</a>`);
    if (s.phone) addRow('phone', `<span style="color:${textColor};">${s.phone}</span>`);
    if (s.website) addRow('domain', `<a href="${siteHref}" target="_blank" style="color:${accent};text-decoration:none;">${siteLabel}</a>`);
    const addressParts = [s.addressLine1, s.addressLine2].filter(Boolean).join(', ');
    if (addressParts) addRow('marker', `<span style="color:${textColor};">${addressParts}</span>`);

    const contactTable = contactRows.length > 0
      ? `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;">${contactRows.join('')}</table>`
      : '';

    const layout = s.layout || 'Logo Left';

    // Name + job title on one line, behind a thin accent rule.
    // Table-based so the rule keeps its height in every email client.
    const nameLine = `<table cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="3" style="width:3px;background:${accent};font-size:1px;line-height:1px;">&nbsp;</td>
      <td style="padding-left:10px;font-family:${headingFont},sans-serif;font-size:${fontSize + 4}px;line-height:${fontSize + 12}px;color:${accent};">
        <strong>${s.fullName || ''}</strong>${s.jobTitle ? `<span style="color:#c4c4c4;font-weight:normal;padding:0 7px;">|</span><span style="color:${textColor};font-weight:normal;">${s.jobTitle}</span>` : ''}
      </td>
    </tr></table>`;

    if (layout === 'Stacked') {
      const html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;max-width:600px;">
  <tr><td style="padding-bottom:12px;">
    ${logoUrl ? `<img src="${logoUrl}" width="${logoSize}" height="${logoSize}" style="border:0;display:block;" alt="Logo" />` : ''}
  </td></tr>
  <tr><td>
    ${nameLine}
  </td></tr>
  ${divider ? `<tr><td style="padding:8px 0;"><hr style="border:0;border-top:1px solid #ddd;margin:0;" /></td></tr>` : ''}
  <tr><td style="padding-top:4px;">${contactTable}</td></tr>
  ${s.tagline ? `<tr><td style="padding-top:8px;font-size:${fontSize - 2}px;letter-spacing:1px;color:${accent};text-transform:uppercase;">${s.tagline}</td></tr>` : ''}
  ${bannerUrl ? `<tr><td style="padding-top:8px;"><img src="${bannerUrl}" width="${bannerSize}" style="border:0;" alt="Banner" /></td></tr>` : ''}
  ${socialHtml ? `<tr><td style="padding-top:8px;">${socialHtml}</td></tr>` : ''}
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
      ${s.emailAddress ? ` <span style="font-size:${fontSize - 2}px;">| <a href="mailto:${s.emailAddress}" style="color:${accent};text-decoration:none;">${s.emailAddress}</a></span>` : ''}
      ${s.phone ? ` <span style="font-size:${fontSize - 2}px;color:${textColor};">| ${s.phone}</span>` : ''}
      ${s.website ? ` <span style="font-size:${fontSize - 2}px;">| <a href="${siteHref}" target="_blank" style="color:${accent};text-decoration:none;">${siteLabel}</a></span>` : ''}
    </td>
  </tr>
</table>`;
      return { html };
    }

    // Default: Logo Left
    const html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;max-width:600px;">
  <tr>
    <td style="vertical-align:top;padding-right:16px;">
      ${logoUrl ? `<img src="${logoUrl}" width="${logoSize}" height="${logoSize}" style="border:0;display:block;" alt="Logo" />` : ''}
    </td>
    ${divider ? `<td style="vertical-align:top;padding-right:16px;"><div style="width:1px;min-height:80px;background:#ddd;"></div></td>` : ''}
    <td style="vertical-align:top;">
      ${nameLine}
      <div style="margin-top:8px;">${contactTable}</div>
    </td>
    <td style="vertical-align:top;padding-left:20px;text-align:center;max-width:200px;word-wrap:break-word;">
      ${bannerUrl ? `<img src="${bannerUrl}" width="${bannerSize}" style="border:0;display:block;" alt="Banner" />` : ''}
      ${s.tagline ? `<p style="margin:6px 0 0;font-size:${fontSize - 2}px;letter-spacing:1px;color:${accent};text-transform:uppercase;">${s.tagline}</p>` : ''}
      ${socialHtml ? `<div style="margin-top:6px;">${socialHtml}</div>` : ''}
    </td>
  </tr>
</table>`;
    return { html };
  },
});
