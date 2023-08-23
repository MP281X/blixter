import { formatZodError, zodDefault } from '$lib/helpers';
import { uploadUrl } from 's3';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';
import { rawVideo } from 'jobs';

const schema = z.object({
  _id: z.string(),
  _format: z.enum(['mp4']),
  name: z.string().min(5).max(20),
  description: z.string().max(500)
});
export const load: PageServerLoad = async () => {
  const upload = await uploadUrl('raw_videos');
  return { schema: zodDefault(schema.shape), upload };
};

export const actions: Actions = {
  upload: async ({ request }) => {
    const formData = schema.safeParse(Object.fromEntries(await request.formData()));

    if (!formData.success) return formatZodError(formData.error);
    const data = formData.data;

    await rawVideo({
      id: data._id,
      format: data._format,
      name: data.name,
      description: data.description
    });
  }
};
