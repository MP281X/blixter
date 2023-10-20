import { validator, hashPassword } from './src/helpers';
import { db, sql, z } from './src/helpers';
export { db, sql };

// user
export const newUser = validator(
	'users',
	'insert',
	{
		username: z.string().toLowerCase().trim().min(3).max(20),
		email: z.string().toLowerCase().trim().max(50).email(),
		password: z.string().trim().min(5).max(30).transform(hashPassword)
	},
	async (db, { username, email, password }) => await db.values({ email, password, username }).returning(['id', 'username']).executeTakeFirst()
);

export const findUser = validator(
	'users',
	'select',
	{
		username: z.string().toLowerCase().trim().min(3).max(20),
		password: z.string().trim().min(5).max(30).transform(hashPassword)
	},
	async (db, { username, password }) =>
		await db.where('username', '=', username).where('password', '=', password).select(['id', 'username']).executeTakeFirst()
);

export const newVideo = validator(
	'videos',
	'insert',
	{
		_id: z.string().uuid({ message: 'video not found' }),
		_format: z.enum(['mp4'], { invalid_type_error: 'video not found' })
	},
	async (db, { user_id, _id }) => await db.values({ user_id, id: _id }).returning('id').executeTakeFirst()
);

// comment
export const newComment = validator(
	'comments',
	'insert',
	{ comment: z.string().max(50) },
	async (db, { video_id, user_id, comment }) => await db.values({ video_id, user_id, comment }).returningAll().executeTakeFirst()
);

// like
export const updateLike = validator(
	'views',
	'update',
	{
		liked: z.boolean().nullable()
	},
	async (db, { liked, user_id, video_id }) => await db.where('user_id', '=', user_id).where('video_id', '=', video_id).set({ liked }).execute()
);

// watch time
export const updateWatchTime = validator(
	'views',
	'update',
	{
		watch_time: z.number().min(0)
	},
	async (db, { user_id, video_id, watch_time }) =>
		await db.where('user_id', '=', user_id).where('video_id', '=', video_id).set({ watch_time }).execute()
);
