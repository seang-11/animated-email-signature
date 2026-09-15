import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Saves changes to the email signature',
  authenticated: true,
  inputSchema: z.object({
    id: z.string(),
    fields: z.record(z.any()),
  }),
  outputSchema: z.object({}),
  execute: async ({ input }) => {
    const result = await zite.emailSignatures.update({
      id: input.id,
      record: input.fields as any,
    });
    return { success: true, updated: result };
  },
});
