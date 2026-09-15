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

    // If setting this as default, unset the current default first
    if (input.fields.isDefault === true && !sig.isDefault) {
      const { records } = await zite.emailSignatures.findAll({
        filters: { owner: context.user.id, isDefault: true },
        limit: 10,
      });
      for (const r of records) {
        if (r.id !== input.id) {
          await zite.emailSignatures.update({ id: r.id, record: { isDefault: false } });
        }
      }
    }

    const result = await zite.emailSignatures.update({
      id: input.id,
      record: input.fields as any,
    });
    return { success: true, updated: result };
  },
});
