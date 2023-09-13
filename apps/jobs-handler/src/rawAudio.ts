import { convertAudio, getVideoInfo } from 'ffmpeg';
import fs from 'fs';
import { deleteFile, download, upload } from 's3';

type Input = {
	id: string;
	format: 'mp4';
};

export default async ({ id, format }: Input, jobID: string) => {
	console.log(`[${jobID}] deleting local and remote cache`);
	if (fs.existsSync(`${process.cwd()}/.cache/${jobID}`)) fs.rmSync(`${process.cwd()}/.cache/${jobID}`, { force: true, recursive: true });
	fs.mkdirSync(`${process.cwd()}/.cache/${jobID}`, { recursive: true });
	await deleteFile('raw_audios', id, true);

	// download the raw video
	console.log(`[${jobID}] started the raw video download`);
	await download('raw_videos', id, `${jobID}/raw.${format}`);
	console.log(`[${jobID}] downloaded the raw file`);

	// get the video info
	const info = getVideoInfo({ file: `raw.${format}`, jobID });
	if (info.resolution < 360) throw new Error('invalid resolution');

	await convertAudio({ jobID, file: `raw.${format}` });

	await upload('raw_audios', id, `${jobID}/audio.mp3`);
	console.log(`[${jobID}] uploaded the audio`);

	fs.rmSync(`${process.cwd()}/.cache/${jobID}`, { force: true, recursive: true });
};
