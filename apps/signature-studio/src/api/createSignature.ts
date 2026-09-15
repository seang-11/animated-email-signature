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
      addressLine1: '',
      addressLine2: '',
      logo: null,
      bannerImage: null,
      linkedInUrl: '',
      instagramUrl: '',
      facebookUrl: '',
      threadsUrl: '',
      xUrl: '',
      tikTokUrl: '',
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
      contactIconStyle: 'filled',
      showCompany: true,
      showTagline: true,
      showAddress: true,
      showSocials: true,
      blockSpacing: 8,
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
