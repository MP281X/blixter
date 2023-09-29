import { db, newComment, sql } from 'db';
import type { PageServerLoad } from './$types';
import { error, type Actions, fail } from '@sveltejs/kit';
import { z } from 'zod';
import { videoCache } from 'cache';
import { comments } from 'realtime';

export const ssr = false;
export const load: PageServerLoad = async ({ locals, params }) => {
	const id = z.string().uuid().parse(params.id);

	try {
		await db.insertInto('views').values({ user_id: locals.user.id, video_id: id }).executeTakeFirst();
	} catch {}

	const comments = await db
		.selectFrom('comments')
		.where('video_id', '=', id)
		.orderBy('created_at', 'desc')
		.limit(20)
		.innerJoin('users', 'users.id', 'user_id')
		.select(['users.username', 'comments.id', 'comments.comment', 'comments.created_at', 'comments.user_id'])
		.execute();

	const cache = await videoCache(locals.user.id);
	if (cache) return { ...cache, comments, user: locals.user.username };

	const video = await db
		.selectFrom('videos')
		.where('videos.id', '=', id)
		.where('videos.status', '=', 'converted')
		.innerJoin('users', 'users.id', 'videos.user_id')
		.select([
			'videos.title',
			'videos.description',
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

	const { subscribers } = (await db
		.selectFrom('subscribers')
		.where('channel_id', '=', locals.user.id)
		.select(sql<number>`count(*)`.as('subscribers'))
		.executeTakeFirst())!;

	const res = { ...video, subscribers };
	await videoCache(id, res, 60 * 5);

	return {
		...res,
		comments,
		user: locals.user.username
	};
};

export const actions: Actions = {
	comment: async ({ request, locals, params }) => {
		const id = z.string().uuid().parse(params.id);

		const { data, errors } = await newComment.validate(request.formData());
		if (errors) return fail(400, errors);

		const res = await db
			.insertInto('comments')
			.values({
				video_id: id,
				user_id: locals.user.id,
				comment: data.comment
			})
			.returningAll()
			.executeTakeFirst();
		if (!res) return fail(400, { error: 'invalid username or password' });

		await comments.send(id, {
			user_id: locals.user.id,
			username: locals.user.username,
			created_at: res.created_at,
			comment: res.comment
		});
	}
};
