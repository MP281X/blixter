import { test } from 'bun:test';
import rawVideo from './rawVideo.ts';

test('rawVideo', async () => {
	await rawVideo({ id: 'dc81ce54-c545-417a-a5be-904f2553ed35', format: 'mp4' });
}, 10000);
