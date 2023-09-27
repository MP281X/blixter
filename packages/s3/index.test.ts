import { test } from 'bun:test';
import { deleteFile } from './index.ts';

test('deleteFiles', async () => {
	await deleteFile('videos', 'd2f3681b-b4b2-42c5-a30b-0d2b10dc47c7');
}, 10000);
