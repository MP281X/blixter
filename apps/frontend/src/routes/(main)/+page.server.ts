import { db, sql } from 'db';
import type { PageServerLoad } from './$types';
import { z } from 'zod';

export const load: PageServerLoad = async ({ locals, url }) => {
	const query = z.optional(z.string().uuid()).parse(url.searchParams.get('q') ?? undefined);

	const videos = await db
		.selectFrom('videos')
		.where('videos.status', '=', 'converted')
		.limit(20)
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
		.execute();

	return { videos, user: locals.user.username };
};
