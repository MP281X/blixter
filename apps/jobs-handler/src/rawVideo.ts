import { db } from 'db';
import fs from 'fs';
import { download, upload, deleteFile } from 's3';
import { getVideoInfo, convertVideo, convertAudio } from 'ffmpeg';
import { uploadStatus } from 'realtime';

type Input = {
	id: string;
	format: 'mp4';
};

export default async ({ id, format }: Input) => {
	// clear previous output
	await uploadStatus.send({ id, msg: 'deleting local and remote cache' });
	if (fs.existsSync(`${process.cwd()}/.cache/${id}`)) fs.rmSync(`${process.cwd()}/.cache/${id}`, { force: true, recursive: true });
	fs.mkdirSync(`${process.cwd()}/.cache/${id}`, { recursive: true });
	await deleteFile('videos', id, true);

	// download the raw video
	await download('raw_videos', id, `${id}/raw.${format}`);
	await uploadStatus.send({ id, msg: 'downloaded the raw file' });

	// get the video info
	const info = await getVideoInfo({ file: `raw.${format}`, id });
	if (info.resolution < 360) throw new Error('invalid resolution');
	await uploadStatus.send({ id, msg: 'extracted the video information' });

	// extract the audio file and upload it
	await convertAudio({ id, file: `raw.${format}` });
	await upload('raw_audios', id, `${id}/audio.mp3`);
	await uploadStatus.send({ id, msg: 'extracted the audio' });

	// generate the hls index file based on the available resolutions
	let indexFile = '#EXTM3U\n';

	if (!fs.existsSync(`${process.cwd()}/.cache/${id}/out`)) fs.mkdirSync(`${process.cwd()}/.cache/${id}/out`, { recursive: true });

	// watch the directory for file changes and upload the files
	const uploadAC = new AbortController();
	const fileUpload = upload('videos', id, `${id}/out`, uploadAC);
	await uploadStatus.send({ id, msg: 'started the hls segment upload' });

	// convert for every resolution
	const fileConversion: Promise<void>[] = [];
	if (info.resolution >= 1080) {
		fileConversion.push(
			convertVideo({
				id,
				file: `raw.${format}`,
				resolution: '1080',
				tot_frames: info.frames,
				status: async (x) => await uploadStatus.send({ id, msg: '1080p', conversion: x })
			})
		);
		indexFile += '#EXT-X-STREAM-INF:BANDWIDTH=3500000,RESOLUTION=1920x1080\n1080.m3u8\n';
	}
	if (info.resolution >= 720) {
		fileConversion.push(
			convertVideo({
				id,
				file: `raw.${format}`,
				resolution: '720',
				tot_frames: info.frames,
				status: async (x) => await uploadStatus.send({ id, msg: '720p', conversion: x })
			})
		);
		indexFile += '#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720\n720.m3u8\n';
	}
	if (info.resolution >= 360) {
		fileConversion.push(
			convertVideo({
				id,
				file: `raw.${format}`,
				resolution: '360',
				tot_frames: info.frames,
				status: async (x) => await uploadStatus.send({ id, msg: '360p', conversion: x })
			})
		);
		indexFile += '#EXT-X-STREAM-INF:BANDWIDTH=375000,RESOLUTION=640x360\n360.m3u8\n';
	}

	// await the conversion and upload the hls segment and write the hls index file to disk
	await Promise.all(fileConversion);
	await Bun.write(`${process.cwd()}/.cache/${id}/out/index.m3u8`, indexFile);

	await uploadStatus.send({ id, msg: 'converted the video in all the resolutions' });
	uploadAC.abort();
	await fileUpload;
	await uploadStatus.send({ id, msg: 'uploaded all the segments' });

	// modify the conversion status
	await db.updateTable('videos').where('id', '=', id).set({ converted: true }).executeTakeFirstOrThrow();
	await uploadStatus.send({ id, msg: 'updated the conversion status' });

	fs.rmSync(`${process.cwd()}/.cache/${id}`, { force: true, recursive: true });
};
