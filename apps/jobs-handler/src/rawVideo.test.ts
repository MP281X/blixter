import { test } from 'bun:test';
import rawVideo from './rawVideo.ts';
import { deleteFile, moveFile } from 's3';

test('rawVideo', async () => {
	const uuid = crypto.randomUUID();
	await moveFile({ id: 'video_short.mp4', type: 'demo' }, { id: uuid, type: 'raw_videos' });
	await rawVideo({ video_id: uuid, id: uuid, format: 'mp4' });

	await deleteFile('raw_audios', uuid);
	await deleteFile('raw_videos', uuid);
	await deleteFile('videos', uuid);
	await deleteFile('images', uuid);
	process.exit(0);
}, 10000);
