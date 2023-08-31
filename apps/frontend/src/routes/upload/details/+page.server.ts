import type { Actions, PageServerLoad } from './$types';
import { schema } from '../upload';
import { formatDbError, formatZodError, zodDefault } from '$lib/helpers';
import { rawVideo } from 'jobs';
import { db, videos } from 'db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	return { schema: zodDefault(schema.shape) };
};

export const actions: Actions = {
	upload: async ({ request }) => {
		const formData = schema.safeParse(Object.fromEntries(await request.formData()));

		if (!formData.success) return formatZodError(formData.error);
		const data = formData.data;

		try {
			await db.insert(videos).values({
				id: data._id,
				name: data.name,
				description: data.description
			});
		} catch (e) {
			return formatDbError(e);
		}

		await rawVideo({ id: data._id, format: data._format });

		throw redirect(303, '/');
	}
};
