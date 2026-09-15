import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Loads the current user\'s email signature or creates a default one',
  authenticated: true,
  inputSchema: z.object({}),
  outputSchema: z.object({}),
  execute: async ({ context }) => {
    const userId = context.user.id;

    const { records } = await zite.emailSignatures.findAll({
      filters: { owner: userId },
      limit: 1,
    });

    if (records[0]) return { signature: records[0] };

    // Create a default signature owned by this user, prefilled with their info
    const fullName = [context.user.firstName, context.user.lastName].filter(Boolean).join(' ');
    const created = await zite.emailSignatures.create({
      record: {
        signatureName: 'My Signature',
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
        showDivider: true,
        roundSocialIcons: true,
      },
    });
    return { signature: created };
  },
});
