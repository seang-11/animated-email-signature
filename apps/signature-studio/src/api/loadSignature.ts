import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Lists all signatures for the signed-in user, loading the default or first one',
  authenticated: true,
  inputSchema: z.object({
    signatureId: z.string().optional(),
  }),
  outputSchema: z.object({}),
  execute: async ({ input, context }) => {
    const userId = context.user.id;

    const { records } = await zite.emailSignatures.findAll({
      filters: { owner: userId },
      limit: 50,
    });

    if (records.length === 0) {
      // No signatures — signal first-run so the frontend shows the template gallery
      return { signatures: [], signature: null, firstRun: true };
    }

    // Pick the requested one, or the default, or the first
    let active = input.signatureId
      ? records.find(r => r.id === input.signatureId)
      : records.find(r => r.isDefault) || records[0];

    if (!active) active = records[0];

    return { signatures: records, signature: active, firstRun: false };
  },
});
