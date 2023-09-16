import { redis } from 'cache';
import { db, newUser } from 'db';
import { deleteFile, moveFile } from 's3';
import { jobs } from 'jobs-handler';

// reset
console.log('db:reset');
Bun.spawnSync(['atlas', 'schema', 'fmt', 'schema.hcl'], {
	stdout: 'inherit',
	cwd: '../packages/db'
});
Bun.spawnSync(['atlas', 'schema', 'clean', '--auto-approve', '-u', Bun.env.POSTGRES_URL!], {
	stdout: 'inherit',
	cwd: '../packages/db'
});
Bun.spawnSync(['atlas', 'schema', 'apply', '--auto-approve', '-u', Bun.env.POSTGRES_URL!, '--to', 'file://schema.hcl'], {
	stdout: 'inherit',
	cwd: '../packages/db'
});
Bun.spawnSync(['npx', 'kysely-codegen', '--dialect', 'postgres', '--out-file', 'index.g.d.ts', '--url', Bun.env.POSTGRES_URL!], {
	stdout: 'inherit',
	cwd: '../packages/db'
});

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
		name: 'short video',
		user_id: user!.id,
		description: 'demo short video'
	})
	.returning('id')
	.executeTakeFirst();

console.log('s3:seeding');
await moveFile({ id: 'video_short.mp4', type: 'demo' }, { id: video!.id, type: 'raw_videos' });

console.log('job-hanlder:seeding');
await jobs.rawVideo.default({ id: video!.id, format: 'mp4' });

process.exit(0);
