import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Duplicates a signature owned by the signed-in user',
  authenticated: true,
  inputSchema: z.object({ id: z.string() }),
  outputSchema: z.object({}),
  execute: async ({ input, context }) => {
    const sig = await zite.emailSignatures.findOne({ id: input.id });
    if (!sig || !sig.owner?.includes(context.user.id)) {
      throw new Error('Signature not found or not yours');
    }

    const { id, lastUpdated, isDefault, ...fields } = sig as any;
    const created = await zite.emailSignatures.create({
      record: {
        ...fields,
        signatureName: `${sig.signatureName || 'Signature'} (copy)`,
        isDefault: false,
        owner: [context.user.id],
      },
    });
    return { signature: created };
  },
});
