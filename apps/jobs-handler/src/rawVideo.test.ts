import { test } from 'bun:test';
import rawVideo from './rawVideo.ts';

test('rawVideo', async () => {
	await rawVideo({ id: 'd2f3681b-b4b2-42c5-a30b-0d2b10dc47c7', format: 'mp4' });
	process.exit(0);
}, 10000);
