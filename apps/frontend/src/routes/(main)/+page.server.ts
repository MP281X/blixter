import { db, sql } from 'db';
import type { PageServerLoad } from './$types';
import { z } from 'zod';

const dbQuery = (query: string | undefined) => {
	let q = db.selectFrom('videos').where('videos.status', '=', 'categorized');

	if (query && query.trim() !== '') {
		query = query.trim();

		q = q.where(eb => eb.or([eb('title', 'ilike', `%${query}%`), eb('description', 'ilike', `%${query}%`), eb('category', 'ilike', `%${query}%`)]));
	}

	return q
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
		]);
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const query = z.optional(z.string().max(20)).parse(url.searchParams.get('q') ?? undefined);
	const videos = await dbQuery(query).execute();

	return { videos, user: locals.user.username };
};
