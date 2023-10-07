import { uploadUrl } from 's3';
import { db, newVideo } from 'db';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { rawVideo } from 'jobs';

export const load: PageServerLoad = async () => {
	const upload = await uploadUrl('raw_videos');
	return { upload, schema: newVideo.schema };
};

export const actions: Actions = {
	info: async ({ request, locals }) => {
		const { data, errors } = await newVideo.validate(request.formData());
		if (errors) return fail(400, errors);

		const res = await db.insertInto('videos').values({ user_id: locals.user.id, id: data._id }).returning(['id']).executeTakeFirst();
		if (!res) return fail(400, { error: 'invalid username or password' });

		await rawVideo({ id: locals.user.id, video_id: res.id, format: data._format });

		throw redirect(303, '/');
	}
};
