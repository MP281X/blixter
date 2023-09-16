import { test } from 'bun:test';
import { deleteFile } from './index.ts';

test('deleteFiles', async () => {
	await deleteFile('videos', '', true);
}, 10000);
