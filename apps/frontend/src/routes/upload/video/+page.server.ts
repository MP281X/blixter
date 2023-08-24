import { uploadUrl } from 's3';
import type { PageServerLoad } from './$types';
import { schema } from '../upload';
import { zodDefault } from '$lib/helpers';

export const load: PageServerLoad = async () => {
	const upload = await uploadUrl('raw_videos');
	return { upload, schema: zodDefault(schema.shape) };
};
