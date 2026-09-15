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

    const contactLines: string[] = [];
    if (s.phone) contactLines.push(`<span style="font-size:${fontSize}px;color:${textColor};">&#9742; ${s.phone}</span>`);
    if (s.website) contactLines.push(`<a href="https://${s.website}" style="font-size:${fontSize}px;color:${accent};text-decoration:none;">&#127760; ${s.website}</a>`);
    const addressParts = [s.addressLine1, s.addressLine2].filter(Boolean).join(', ');
    if (addressParts) contactLines.push(`<span style="font-size:${fontSize}px;color:${textColor};">&#128205; ${addressParts}</span>`);

    const layout = s.layout || 'Logo Left';

    if (layout === 'Stacked') {
      const html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${bodyFont},sans-serif;max-width:600px;">
  <tr><td style="padding-bottom:12px;">
    ${logoUrl ? `<img src="${logoUrl}" width="${logoSize}" height="${logoSize}" style="border:0;display:block;" alt="Logo" />` : ''}
  </td></tr>
  <tr><td>
    <p style="margin:0;font-family:${headingFont},sans-serif;font-size:${fontSize + 4}px;font-weight:bold;color:${accent};">${s.fullName || ''}</p>
    ${s.jobTitle ? `<p style="margin:2px 0 0;font-size:${fontSize}px;color:${textColor};">${s.jobTitle}</p>` : ''}
  </td></tr>
  ${divider ? `<tr><td style="padding:8px 0;"><hr style="border:0;border-top:1px solid #ddd;margin:0;" /></td></tr>` : ''}
  <tr><td style="line-height:1.6;">${contactLines.join('<br/>')}</td></tr>
  ${s.tagline ? `<tr><td style="padding-top:8px;font-size:${fontSize - 2}px;letter-spacing:1px;color:${accent};text-transform:uppercase;">${s.tagline}</td></tr>` : ''}
  ${bannerUrl ? `<tr><td style="padding-top:8px;"><img src="${bannerUrl}" width="200" style="border:0;" alt="Banner" /></td></tr>` : ''}
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
      ${s.phone ? ` <span style="font-size:${fontSize - 2}px;color:${textColor};">| ${s.phone}</span>` : ''}
      ${s.website ? ` <span style="font-size:${fontSize - 2}px;"><a href="https://${s.website}" style="color:${accent};text-decoration:none;">${s.website}</a></span>` : ''}
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
      <p style="margin:0;font-family:${headingFont},sans-serif;font-size:${fontSize + 4}px;font-weight:bold;color:${accent};">${s.fullName || ''}</p>
      ${s.jobTitle ? `<p style="margin:2px 0 0;font-size:${fontSize}px;color:${textColor};">${s.jobTitle}</p>` : ''}
      <p style="margin:8px 0 0;line-height:1.6;">${contactLines.join('<br/>')}</p>
    </td>
    <td style="vertical-align:top;padding-left:20px;text-align:center;max-width:200px;word-wrap:break-word;">
      ${bannerUrl ? `<img src="${bannerUrl}" width="180" style="border:0;display:block;" alt="Banner" />` : ''}
      ${s.tagline ? `<p style="margin:6px 0 0;font-size:${fontSize - 2}px;letter-spacing:1px;color:${accent};text-transform:uppercase;">${s.tagline}</p>` : ''}
      ${socialHtml ? `<div style="margin-top:6px;">${socialHtml}</div>` : ''}
    </td>
  </tr>
</table>`;
    return { html };
  },
});
