import { db, sql } from 'db';
import type { PageServerLoad } from './$types';
import { z } from 'zod';
// import { searchEmbedding } from 'ai';

export const load: PageServerLoad = async ({ locals, url }) => {
	const query = z.optional(z.string().max(20)).parse(url.searchParams.get('q') ?? undefined);
	if (query && query.trim() !== '') {
		// const queryRes = await searchEmbedding('videos', query);
		// if (queryRes.length === 0) return { videos: [], user: locals.user.username };

		// console.log(queryRes);
		const videos = await db
			.selectFrom('videos')
			.where('videos.status', '=', 'converted')
			// .where('videos.title', 'in', queryRes)
			.where('videos.title', 'ilike', query)
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
	}

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
