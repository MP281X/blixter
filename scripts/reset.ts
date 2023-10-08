import { redis } from 'cache';
import { db, newUser } from 'db';
import { deleteFile, moveFile } from 's3';
import * as jobs from '../apps/jobs-handler/src/index.g.ts';

// reset
console.log('db:reset');

Bun.spawnSync(['psql', Bun.env.POSTGRES_URL!, '-f', 'schema.sql'], {
	stdout: 'inherit',
	stderr: 'inherit',
	cwd: '../packages/db'
}).success;

Bun.spawnSync(['npx', 'kysely-codegen', '--dialect', 'postgres', '--out-file', './index.g.d.ts', '--url', Bun.env.POSTGRES_URL!], {
	stdout: 'inherit',
	stderr: 'inherit',
	cwd: '../packages/db'
}).success;

console.log('cache:reset');
await redis.FLUSHALL();

console.log('s3:reset');
await deleteFile('raw_videos', '');
await deleteFile('videos', '');
await deleteFile('raw_audios', '');
await deleteFile('raw_images', '');
await deleteFile('images', '');

console.log('db:seeding');
const user = await db
	.insertInto('users')
	.values(
		(
			await newUser.validate(undefined, {
				username: 'admin',
				password: 'password',
				email: 'admin@gmail.com'
			})
		).data!
	)
	.returning('id')
	.executeTakeFirst();

for (const video_id of ['short', 'medium']) {
	console.log(`jobs:${video_id}`);
	const video = await db.insertInto('videos').values({ id: crypto.randomUUID(), user_id: user!.id }).returning(['id', 'title']).executeTakeFirst();

	await db
		.insertInto('views')
		.values({
			user_id: user!.id,
			video_id: video!.id,
			liked: false,
			watch_time: 60 * 3
		})
		.executeTakeFirst();

	await db
		.insertInto('comments')
		.values({
			user_id: user!.id,
			video_id: video!.id,
			comment: 'test'
		})
		.executeTakeFirst();

	console.log('s3:seeding');
	await moveFile({ id: `video_${video_id}.mp4`, type: 'demo' }, { id: video!.id, type: 'raw_videos' });

	console.log('job-hanlder:seeding');
	await jobs.rawVideo.default({ id: user!.id, format: 'mp4', video_id: video!.id });
	await jobs.rawAudio.default({ id: video!.id });

	await redis.del('jobs:rawAudio_dev');
}

process.exit(0);
