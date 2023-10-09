import fs from 'fs';
import { transcribe, summarize } from 'ai';
import { download } from 's3';
import { db } from 'db';

type Input = {
	id: string;
};

const log = (id: string, msg: string) => console.log(`rawAudio [${id.substring(0, 5)}] ${msg}`);

export default async ({ id }: Input) => {
	// clear previous output
	try {
		log(id, 'deleting local and remote cache');
		if (fs.existsSync(`${process.cwd()}/.cache/${id}`)) fs.rmSync(`${process.cwd()}/.cache/${id}`, { force: true, recursive: true });
		fs.mkdirSync(`${process.cwd()}/.cache/${id}`, { recursive: true });

		// download the raw video
		await download('raw_audios', id, `${id}/audio.mp3`);
		log(id, 'downloaded the raw file');

		const text = await transcribe(id);
		log(id, 'converted the audio file');

		// summarize the content
		const { title, description, category } = await summarize(text);

		log(id, 'summarized the video content');

		await db
			.updateTable('videos')
			.where('id', '=', id)
			.set({
				title: title,
				description: description,
				category: category,
				status: 'categorized'
			})
			.executeTakeFirstOrThrow();

		log(id, 'updated the status');

		fs.rmSync(`${process.cwd()}/.cache/${id}`, { force: true, recursive: true });
	} catch (e) {
		throw e;
	}
};
