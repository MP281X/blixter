import { Cron } from './types';
import { deleteFile, listFiles } from 's3';
import { db } from 'db';

export const cron: Cron = '10 * * * *';

export default async () => {
	console.log('delete raw videos');
	const files = await listFiles('raw_videos', '');
	if (!files) return;

	for (const file of files) {
		const timeDifference = Math.floor((new Date().getTime() - file.uploadedAt.getTime()) / (1000 * 60 * 60));
		if (timeDifference < 4) continue;

		const converted = await db.selectFrom('videos').where('id', '=', file.id).where('status', '!=', 'converted').executeTakeFirst();
		if (!converted) continue;

		await deleteFile('images', file.id);
		await deleteFile('raw_audios', file.id);
		await deleteFile('videos', file.id);
		await deleteFile('raw_videos', file.id);
		await db.deleteFrom('videos').where('id', '=', file.id).executeTakeFirst();
	}
};
