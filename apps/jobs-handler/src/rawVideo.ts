import { db } from 'db';
import fs from 'fs';
import { download, upload, deleteFile } from 's3';
import { getVideoInfo, convertVideo, convertAudio } from 'ffmpeg';

type Input = {
	id: string;
	format: 'mp4';
};

export default async ({ id, format }: Input, jobID: string) => {
	// clear previous output
	console.log(`[${jobID}] deleting local and remote cache`);
	if (fs.existsSync(`${process.cwd()}/.cache/${jobID}`)) fs.rmSync(`${process.cwd()}/.cache/${jobID}`, { force: true, recursive: true });
	fs.mkdirSync(`${process.cwd()}/.cache/${jobID}`, { recursive: true });
	await deleteFile('videos', id, true);

	// download the raw video
	await download('raw_videos', id, `${jobID}/raw.${format}`);
	console.log(`[${jobID}] downloaded the raw file`);

	// get the video info
	const info = await getVideoInfo({ file: `raw.${format}`, jobID });
	if (info.resolution < 360) throw new Error('invalid resolution');
	console.log(`[${jobID}] extracted the video information`);

	// extract the audio file and upload it
	await convertAudio({ jobID, file: `raw.${format}` });
	await upload('raw_audios', id, `${jobID}/audio.mp3`);
	console.log(`[${jobID}] uploaded the audio`);

	// generate the hls index file based on the available resolutions
	let indexFile = '#EXTM3U\n';

	if (!fs.existsSync(`${process.cwd()}/.cache/${jobID}/out`)) fs.mkdirSync(`${process.cwd()}/.cache/${jobID}/out`, { recursive: true });

	// watch the directory for file changes and upload the files
	const uploadAC = new AbortController();
	const fileUpload = upload('videos', id, `${jobID}/out`, uploadAC);
	console.log(`[${jobID}] stated the hls segment watch/upload`);

	// convert for every resolution
	const fileConversion: Promise<void>[] = [];
	if (info.resolution >= 1080) {
		fileConversion.push(convertVideo({ jobID, file: `raw.${format}`, resolution: '1080', tot_frames: info.frames }));
		indexFile += '#EXT-X-STREAM-INF:BANDWIDTH=3500000,RESOLUTION=1920x1080\n1080.m3u8\n';
	}
	if (info.resolution >= 720) {
		fileConversion.push(convertVideo({ jobID, file: `raw.${format}`, resolution: '720', tot_frames: info.frames }));
		indexFile += '#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720\n720.m3u8\n';
	}
	if (info.resolution >= 360) {
		fileConversion.push(convertVideo({ jobID, file: `raw.${format}`, resolution: '360', tot_frames: info.frames }));
		indexFile += '#EXT-X-STREAM-INF:BANDWIDTH=375000,RESOLUTION=640x360\n360.m3u8\n';
	}

	// await the conversion and upload the hls segment and write the hls index file to disk
	await Promise.all(fileConversion);
	await Bun.write(`${process.cwd()}/.cache/${jobID}/out/index.m3u8`, indexFile);

	console.log(`[${jobID}] converted the video in all the resolutions`);
	uploadAC.abort();
	await fileUpload;
	console.log(`[${jobID}] uploaded all the segments`);

	// modify the conversion status
	await db.updateTable('videos').where('id', '=', id).set({ converted: true }).executeTakeFirstOrThrow();
	console.log(`[${jobID}] updated the conversion status`);

	fs.rmSync(`${process.cwd()}/.cache/${jobID}`, { force: true, recursive: true });
};
