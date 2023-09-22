import { db, sql } from 'db';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { z } from 'zod';

export const ssr = false;
export const load: PageServerLoad = async ({ locals, params }) => {
	const id = z.string().uuid().parse(params.id);

	const video = await db
		.selectFrom('videos')
		.where('videos.id', '=', id)
		.where('videos.status', '=', 'converted')
		.innerJoin('users', 'users.id', 'videos.user_id')
		.select([
			'videos.title',
			'videos.id',
			'videos.user_id',
			'videos.duration',
			'videos.created_at',
			'users.username',
			'videos.user_id',
			sql<number>`(select count(*) from views where views.video_id = videos.id)`.as('views')
		])
		.executeTakeFirst();
	if (!video) throw error(404, 'video not found');

	try {
		await db.insertInto('views').values({ user_id: locals.user.id, video_id: video.id }).executeTakeFirst();
	} catch {}

	return { video, user: locals.user.username };
};
