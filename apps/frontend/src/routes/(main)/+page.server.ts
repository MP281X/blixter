import { db } from 'db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const res = await db.selectFrom('videos').where('converted', '=', true).select(['name', 'description', 'id', 'user_id']).limit(20).execute();

	return { videos: res, user: locals.user.username };
};
