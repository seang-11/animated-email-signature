import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Saves changes to the signed-in user\'s email signature',
  authenticated: true,
  inputSchema: z.object({
    id: z.string(),
    fields: z.record(z.any()),
  }),
  outputSchema: z.object({}),
  execute: async ({ input, context }) => {
    const sig = await zite.emailSignatures.findOne({ id: input.id });
    if (!sig || !sig.owner?.includes(context.user.id)) {
      throw new Error('Signature not found or not yours');
    }
    const result = await zite.emailSignatures.update({
      id: input.id,
      record: input.fields as any,
    });
    return { success: true, updated: result };
  },
});
