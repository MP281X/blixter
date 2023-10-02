import { db } from 'db';
import fs from 'fs';
import { download, upload, deleteFile } from 's3';
import { getVideoInfo, convertVideo, extractAudio, extractPreview } from 'ffmpeg';
import { uploadStatus } from 'realtime';
import { rawAudio } from 'jobs';

type Input = {
	id: string;
	video_id: string;
	format: 'mp4';
};

const log = (id: string, msg: string) => console.log(`rawVideo [${id.substring(0, 5)}] ${msg}`);

export default async ({ id, video_id, format }: Input) => {
	// clear previous output
	try {
		await db.updateTable('videos').where('id', '=', video_id).set({ status: 'converting' }).executeTakeFirstOrThrow();

		log(video_id, 'deleting local and remote cache');
		if (fs.existsSync(`${process.cwd()}/.cache/${video_id}`)) fs.rmSync(`${process.cwd()}/.cache/${video_id}`, { force: true, recursive: true });
		fs.mkdirSync(`${process.cwd()}/.cache/${video_id}`, { recursive: true });
		await deleteFile('videos', video_id);

		// download the raw video
		await download('raw_videos', video_id, `${video_id}/raw.${format}`);
		log(video_id, 'downloaded the raw file');

		// get the video info
		const info = await getVideoInfo({ file: `raw.${format}`, id: video_id });
		if (info.resolution < 360) throw new Error('invalid resolution');
		log(video_id, 'extracted the video information');

		// extract the audio file and upload it
		await extractAudio({ id: video_id, file: `raw.${format}` });
		await upload('raw_audios', video_id, `${video_id}/audio.mp3`);
		log(video_id, 'extracted the audio');

		// extract the preview image and upload it
		await extractPreview({ id: video_id, file: `raw.${format}` });
		await upload('images', video_id, `${video_id}/preview.png`);
		log(video_id, 'extracted the preview img');

		await uploadStatus.send(id, { video_id, status: 'start' });

		// generate the hls index file based on the available resolutions
		let indexFile = '#EXTM3U\n';

		if (!fs.existsSync(`${process.cwd()}/.cache/${video_id}/out`)) fs.mkdirSync(`${process.cwd()}/.cache/${video_id}/out`, { recursive: true });

		// watch the directory for file changes and upload the files
		const uploadAC = new AbortController();
		const fileUpload = upload('videos', video_id, `${video_id}/out`, uploadAC);
		log(video_id, 'started the hls segment upload');

		// convert for every resolution
		const fileConversion: Promise<void>[] = [];

		let maxRes: '360p' | '720p' | '1080p' | undefined = undefined;
		if (info.resolution >= 1080) {
			if (!maxRes) maxRes = '1080p';
			fileConversion.push(
				convertVideo({
					id: video_id,
					file: `raw.${format}`,
					resolution: '1080',
					tot_frames: info.frames,
					status: async x => await uploadStatus.send(id, { video_id, status: 'converting', percentage: x })
				})
			);
			indexFile += '#EXT-X-STREAM-INF:BANDWIDTH=3500000,RESOLUTION=1920x1080\n1080.m3u8\n';
		}
		if (info.resolution >= 720) {
			if (!maxRes) maxRes = '720p';
			fileConversion.push(
				convertVideo({
					id: video_id,
					file: `raw.${format}`,
					resolution: '720',
					tot_frames: info.frames,
					status: async x => await uploadStatus.send(id, { video_id, status: 'converting', percentage: x })
				})
			);
			indexFile += '#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720\n720.m3u8\n';
		}
		if (info.resolution >= 360) {
			if (!maxRes) maxRes = '360p';
			fileConversion.push(
				convertVideo({
					id: video_id,
					file: `raw.${format}`,
					resolution: '360',
					tot_frames: info.frames,
					status: async x => await uploadStatus.send(id, { video_id, status: 'converting', percentage: x })
				})
			);
			indexFile += '#EXT-X-STREAM-INF:BANDWIDTH=375000,RESOLUTION=640x360\n360.m3u8\n';
		}

		// await the conversion and upload the hls segment and write the hls index file to disk
		await Promise.all(fileConversion);
		await Bun.write(`${process.cwd()}/.cache/${video_id}/out/index.m3u8`, indexFile);

		log(video_id, 'converted the video in all the resolutions');
		uploadAC.abort();
		await fileUpload;
		log(video_id, 'uploaded all the segments');

		// modify the conversion status
		await db.updateTable('videos').where('id', '=', video_id).set({ status: 'converted', duration: info.duration }).executeTakeFirstOrThrow();
		log(video_id, 'updated the conversion status');
		await uploadStatus.send(id, { video_id, status: 'end' });

		fs.rmSync(`${process.cwd()}/.cache/${video_id}`, { force: true, recursive: true });

		await rawAudio({ id: video_id });
	} catch (e) {
		db.updateTable('videos').where('id', '=', video_id).set({ status: 'failed' });
		throw e;
	}
};
