import { redis } from 'cache';
import { db, newUser } from 'db';
import { deleteFile, moveFile } from 's3';
import { jobs } from 'jobs-handler';

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
await deleteFile('raw_videos', '', true);
await deleteFile('videos', '', true);
await deleteFile('raw_audios', '', true);
await deleteFile('raw_images', '', true);
await deleteFile('images', '', true);

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

const video = await db
	.insertInto('videos')
	.values({
		id: 'd2f3681b-b4b2-42c5-a30b-0d2b10dc47c7',
		title: 'short video',
		user_id: user!.id,
		description: 'demo short video'
	})
	.returning('id')
	.executeTakeFirst();

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
await moveFile({ id: 'video_short.mp4', type: 'demo' }, { id: video!.id, type: 'raw_videos' });

console.log('job-hanlder:seeding');
await jobs.rawVideo.default({ id: user!.id, format: 'mp4', video_id: video!.id });

process.exit(0);
