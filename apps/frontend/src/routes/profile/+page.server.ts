import { db, sql } from 'db';
import { profileCache } from 'cache';
import type { PageServerLoad } from './$types';
import { formatDate, formatSubscribers, formatViews, formatWatchTime } from '$lib/helpers';
import { z } from 'zod';

export const load: PageServerLoad = async ({ locals, url }) => {
	const query = z.optional(z.string().uuid()).parse(url.searchParams.get('q') ?? undefined);

	const profile = (await db.selectFrom('users').where('id', '=', locals.user.id).select(['username', 'email', 'verified', 'id']).executeTakeFirst())!;
	const videos = await db
		.selectFrom('videos')
		.where('status', '=', 'categorized')
		.where('user_id', '=', locals.user.id)
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
		.limit(20)
		.execute();

	const cache = await profileCache(locals.user.id);
	if (cache) return { videos, profile, stats: cache };

	const { comments, views } = (await db
		.selectFrom('users')
		.where('users.id', '=', locals.user.id)
		.leftJoin('videos', 'videos.user_id', 'users.id')
		.leftJoin('views', 'views.video_id', 'videos.id')
		.leftJoin('comments', 'comments.video_id', 'videos.id')
		.select([sql<number>`COUNT(DISTINCT views.user_id)`.as('views'), sql<number>`COUNT(DISTINCT comments.id)`.as('comments')])
		.executeTakeFirst())!;

	const { watch_time, dislikes, likes } = (await db
		.selectFrom('views')
		.innerJoin('videos', 'videos.id', 'views.video_id')
		.where('videos.user_id', '=', locals.user.id)
		.select([
			sql<number>`SUM(CASE WHEN views.liked = true THEN 1 ELSE 0 END)`.as('likes'),
			sql<number>`SUM(CASE WHEN views.liked = false THEN 1 ELSE 0 END)`.as('dislikes'),
			sql<number>`SUM(views.watch_time) / 60`.as('watch_time')
		])
		.executeTakeFirst())!;

	const { uploaded_tot, video_tot, latest_upload } = (await db
		.selectFrom('videos')
		.where('user_id', '=', locals.user.id)
		.select([sql<number>`SUM(duration)`.as('uploaded_tot'), sql<number>`COUNT(*)`.as('video_tot'), sql<Date>`MAX(created_at)`.as('latest_upload')])
		.executeTakeFirst())!;

	const { subscribers } = (await db
		.selectFrom('subscribers')
		.where('channel_id', '=', locals.user.id)
		.select(sql<number>`count(*)`.as('subscribers'))
		.executeTakeFirst())!;

	const res = {
		videos: video_tot,
		latest_upload: formatDate(latest_upload),
		uploaded: formatWatchTime(uploaded_tot),
		views: formatViews(views),
		comments,
		watch_time: formatWatchTime(watch_time),
		subscribers: formatSubscribers(subscribers),
		likes: likes - dislikes < 0 ? 0 : likes - dislikes
	};

	await profileCache(locals.user.id, res, 60 * 5);

	return {
		videos,
		profile,
		stats: res
	};
};
