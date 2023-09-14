import { test } from 'bun:test';
import rawVideo from './rawVideo.ts';
import { db } from 'db';

test('rawVideo', async () => {
	const jobID = `rawVideo_${crypto.randomUUID().slice(0, 5)}`;

	await rawVideo({ id: 'dc81ce54-c545-417a-a5be-904f2553ed35', format: 'mp4' }, jobID);

	await db.destroy();
}, 10000);
