import { test } from 'bun:test';
import rawAudio from './rawAudio.ts';
import { db } from 'db';

test('rawAudio', async () => {
	const jobID = 'rawAudio_0';

	await rawAudio({ id: 'dc81ce54-c545-417a-a5be-904f2553ed35', format: 'mp4' }, jobID);

	await db.destroy();
}, 10000);
