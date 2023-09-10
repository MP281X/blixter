import { test } from 'bun:test';
import rawVideo from './rawVideo.ts';

test('rawVideo', async () => await rawVideo({ id: '9ac7773b-f2c4-4532-abdc-3b2980d99882', format: 'mp4' }), 20000);
