import { uploadUrl } from 's3';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const upload = await uploadUrl('raw_videos');
	return { upload };
};
