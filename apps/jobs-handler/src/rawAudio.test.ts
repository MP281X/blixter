import { test } from 'bun:test';
import rawAudio from './rawAudio.ts';
import { deleteFile, moveFile } from 's3';

test('rawAudio', async () => {
	const uuid = crypto.randomUUID();
	await moveFile({ id: 'audio_short.mp3', type: 'demo' }, { id: uuid, type: 'raw_audios' });
	await rawAudio({ id: uuid });

	await deleteFile('raw_audios', uuid);
	process.exit(0);
}, 100000);
