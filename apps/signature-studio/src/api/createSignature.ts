import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Creates a new signature for the signed-in user, optionally from a template',
  authenticated: true,
  inputSchema: z.object({
    signatureName: z.string().optional(),
    template: z.string().optional(),
    designOverrides: z.record(z.any()).optional(),
  }),
  outputSchema: z.object({}),
  execute: async ({ input, context }) => {
    const userId = context.user.id;
    const fullName = [context.user.firstName, context.user.lastName].filter(Boolean).join(' ');

    const base: Record<string, any> = {
      signatureName: input.signatureName || 'New Signature',
      owner: [userId],
      fullName: fullName || '',
      jobTitle: '',
      company: '',
      tagline: '',
      phone: '',
      emailAddress: context.user.email || '',
      website: '',
      logo: null,
      bannerImage: null,
      linkedInUrl: '',
      instagramUrl: '',
      facebookUrl: '',
      threadsUrl: '',
      xUrl: '',
      tikTokUrl: '',
      youTubeUrl: '',
      substackUrl: '',
      layout: 'Logo Left',
      accentColor: '#111111',
      textColor: '#333333',
      headingFont: 'Arial',
      bodyFont: 'Arial',
      logoSize: 96,
      baseTextSize: 14,
      bannerSize: 180,
      showDivider: true,
      roundSocialIcons: true,
      companySize: 13,
      companyColor: '',
      companyBold: false,
      socialPosition: 'under_details',
      socialIconSize: 24,
      contactIconStyle: 'dark_mode_safe',
      showCompany: true,
      showTagline: true,
      showSocials: true,
      blockSpacing: 8,
      logoAlignment: 'top',
      contactLayout: 'stacked',
      showNameAccentBar: true,
      accentBarColor: '',
      accentBarThickness: 3,
      // Name & title typography
      nameSize: 0,
      nameColor: '',
      nameBold: true,
      jobTitleSize: 0,
      jobTitleColor: '',
      jobTitleItalic: false,
      nameTitleSeparator: 'pipe',
      // Logo & banner
      logoShape: 'square',
      logoLinkUrl: '',
      bannerLinkUrl: '',
      // Dividers
      dividerColor: '#dddddd',
      dividerThickness: 1,
      // CTA
      showCta: false,      ctaText: '',
      ctaUrl: '',
      ctaBackgroundColor: '',
      ctaTextColor: '#ffffff',
      // Tagline styling
      taglineSize: 0,
      taglineColor: '',
      taglineBold: false,
      taglineItalic: false,
      taglineUppercase: true,
      taglineLetterSpacing: 1,
      // Company styling
      companyItalic: false,
      companyUppercase: false,
      companyLetterSpacing: 0,
      // Zone-based layout
      layoutZones: JSON.stringify({
        left: ['logo'],
        main: ['name', 'company', 'contacts', 'cta', 'socials', 'tagline', 'banner'],
        bottom: [],
      }),
      isDefault: false,
      template: input.template || '',
    };

    // Apply design overrides from the template
    if (input.designOverrides) {
      Object.assign(base, input.designOverrides);
    }

    // If this is their first signature, make it default
    const { records: existing } = await zite.emailSignatures.findAll({
      filters: { owner: userId },
      limit: 1,
    });
    if (existing.length === 0) {
      base.isDefault = true;
    }

    const created = await zite.emailSignatures.create({ record: base as any });
    return { signature: created };
  },
});
