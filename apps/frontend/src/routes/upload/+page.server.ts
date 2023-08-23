import { zodDefault } from '$lib/helpers';
import { uploadUrl, downloadUrl } from 's3';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';

const schema = z.object({});
export const load: PageServerLoad = async () => {
	const upload = await uploadUrl('raw_videos');
	return { schema: zodDefault(schema.shape), upload };
};

export const actions: Actions = {
	upload: async () => {
		// const formData = videoSchema.add.safeParse(Object.fromEntries(await request.formData()));
		//
		// if (!formData.success) return formatZodError(formData.error);
		// const data = formData.data;
		//
		const res = await uploadUrl('videos');
		const res2 = await downloadUrl('videos', 'b30f5a45-adcb-4a42-9838-2cd3170a1b07');

		console.log(res);
		console.log(res2);
		// if (!id) return formatError('unable to save the video');
		//
		// try {
		// 	await db.insert(videos).values({
		// 		id: id,
		// 		name: data.name,
		// 		description: data.description
		// 	});
		// } catch (e) {
		// 	return formatDbError(e);
		// }
	}
};
