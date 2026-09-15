import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Deletes a signature owned by the signed-in user',
  authenticated: true,
  inputSchema: z.object({ id: z.string() }),
  outputSchema: z.object({}),
  execute: async ({ input, context }) => {
    const sig = await zite.emailSignatures.findOne({ id: input.id });
    if (!sig || !sig.owner?.includes(context.user.id)) {
      throw new Error('Signature not found or not yours');
    }
    // Don't allow deleting last signature
    const { records } = await zite.emailSignatures.findAll({
      filters: { owner: context.user.id },
      limit: 2,
    });
    if (records.length <= 1) {
      throw new Error('Cannot delete your only signature');
    }

    await zite.emailSignatures.delete({ id: input.id });

    // If deleted was default, make another one default
    if (sig.isDefault) {
      const remaining = records.find(r => r.id !== input.id);
      if (remaining) {
        await zite.emailSignatures.update({ id: remaining.id, record: { isDefault: true } });
      }
    }

    return { success: true };
  },
});
