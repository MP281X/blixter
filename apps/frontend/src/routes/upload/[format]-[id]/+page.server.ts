import type { Actions, PageServerLoad } from './$types';
import { rawAudio, rawVideo } from 'jobs';
import { db, newVideo } from 'db';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
  return { schema: newVideo.schema };
};

export const actions: Actions = {
  upload: async ({ request, locals, params }) => {
    const { data, errors } = await newVideo.validate(request.formData(), {
      _id: params.id,
      _format: params.format as any
    });
    if (errors) return fail(400, errors);

    const res = await db
      .insertInto('videos')
      .values({
        user_id: locals.user.id,
        id: data._id,
        name: data.name,
        description: data.description
      })
      .returning(['id'])
      .executeTakeFirst();

    if (!res) return fail(400, { error: 'invalid username or password' });

    await rawVideo({ id: res.id, format: data._format });
    await rawAudio({ id: res.id, format: data._format });

    throw redirect(303, '/');
  }
};
