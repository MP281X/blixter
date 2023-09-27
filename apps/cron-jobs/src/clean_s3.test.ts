import { test } from 'bun:test';
import clean_s3 from './clean_s3.ts';

test('rawVideo', async () => {
	await clean_s3();
	process.exit(0);
}, 10000);
