import fs from 'fs';
import { transcribe, generateEmbedding } from 'ai';
import { download } from 's3';

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

		await generateEmbedding('videos', id, text);
		log(id, 'generated the embeddings');

		fs.rmSync(`${process.cwd()}/.cache/${id}`, { force: true, recursive: true });
	} catch (e) {
		throw e;
	}
};
