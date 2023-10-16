import { uploadUrl } from 's3';
import { newVideo } from 'db';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { rawVideo } from 'jobs';

export const load: PageServerLoad = async () => {
	const upload = await uploadUrl('raw_videos');
	return { upload, schema: newVideo.schema };
};

export const actions: Actions = {
	info: async ({ request, locals }) => {
		const { data, validated, errors } = await newVideo.query(request.formData(), { user_id: locals.user.id });
		if (errors) return fail(400, errors);

		await rawVideo({ id: locals.user.id, video_id: data.id, format: validated._format });

		throw redirect(303, '/');
	}
};
