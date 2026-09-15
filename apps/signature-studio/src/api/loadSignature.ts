import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Loads the current email signature or returns defaults',
  authenticated: true,
  inputSchema: z.object({}),
  outputSchema: z.object({}),
  execute: async ({ context }) => {
    const { records } = await zite.emailSignatures.findAll({
      filters: { signatureName: { not: null } },
      limit: 1,
    });
    if (records[0]) return { signature: records[0] };
    // Create default
    const created = await zite.emailSignatures.create({
      record: {
        signatureName: 'My Signature',
        fullName: '',
        jobTitle: '',
        company: '',
        tagline: '',
        phone: '',
        emailAddress: '',
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
        showDivider: true,
        roundSocialIcons: true,
      },
    });
    return { signature: created };
  },
});
