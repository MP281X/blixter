import fs from 'fs';
import { db } from 'db';
import { downloadUrl, uploadUrl, deleteFile } from 's3';

type Input = {
	id: string;
	format: 'mp4';
};

const cwd = import.meta.dir.replace('/src', '/.cache');

// extrac the video info
const getVideoInfo = ({ id, format }: Input) => {
	const ffprobe = Bun.spawnSync(
		['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', '-count_frames', `${id}/raw.${format}`],
		{
			stderr: 'ignore',
			cwd
		}
	);
	if (!ffprobe.success.valueOf()) throw new Error('unable to get the file info');

	const fileInfo = JSON.parse(ffprobe.stdout.toString())['streams'][0];
	return {
		resolution: fileInfo['height'],
		frames: Number(fileInfo['nb_frames']),
		duration: Number(fileInfo['duration']).toFixed(2)
	};
};

// convert the video for a single resolution and log the progress
const convertVideo = async ({ id, format }: Input, resolution: '1080' | '720' | '360', tot_frames: number) => {
	const process = Bun.spawn(
		[
			'ffmpeg',
			['-i', `${id}/raw.${format}`],
			['-profile:v', 'baseline'],
			['-level', '3.0'],
			['-s', `${(Number(resolution) / 9) * 16}x${resolution}`],
			['-start_number', '0'],
			['-hls_time', '10'],
			['-hls_list_size', '0'],
			['-f', 'hls'],
			['-hls_segment_filename', `${id}/out/${resolution}_%03d.ts`],
			`${id}/out/${resolution}.m3u8`
		].flat(2),
		{ stderr: 'pipe', stdout: 'ignore', cwd }
	);

	for await (const chunk of process.stderr) {
		let txt = new TextDecoder().decode(chunk);
		if (txt.includes('Failed')) throw new Error(`unable to convert the video in ${resolution}`);
		if (!txt.startsWith('frame=')) continue;

		const frame = Number(txt.split(' ').filter((x) => x !== '')[1]);
		if (frame === 0) continue;

		console.log(`${resolution} -> ${Math.floor((frame / tot_frames) * 100)}% (${id}) `);
	}

	if ((await process.exited) !== 0) throw new Error(`unable to convert the video in ${resolution}`);
};

// upload the hls segment
const uploadFiles = async ({ id }: Input) => {
	const dir = `${cwd}/${id}/out`;
	const files = fs.readdirSync(dir);

	const fileUpload: Promise<Response>[] = [];
	for (const file of files) {
		if (fs.statSync(`${dir}/${file}`).isDirectory()) continue;

		const { url } = await uploadUrl('videos', `${id}/${file}`);

		const req = fetch(url, { method: 'PUT', body: Bun.file(`${dir}/${file}`) }).then((res) => {
			if (!res.ok) throw new Error(`unable to upload ${id}/${file}`);
			return res;
		});
		fileUpload.push(req);
	}

	await Promise.all(fileUpload);
};

// extract and upload the audio
const extractAudio = async ({ id, format }: Input) => {
	const process = Bun.spawnSync(
		['ffmpeg', ['-i', `${id}/raw.${format}`], '-vn', ['-acodec', 'libmp3lame'], ['-q:a', '5'], ['-preset', 'ultrafast'], `${id}/audio.mp3`].flat(2),
		{ cwd }
	);

	if (!process.success) throw new Error('unable to extract the audio');

	const url = await uploadUrl('raw_audios', id);
	const res = await fetch(url.url, { method: 'PUT', body: Bun.file(`${cwd}/${id}/audio.mp3`) });

	if (!res.ok) throw new Error('unable to upload the audio');
};

export default async ({ id, format }: Input) => {
	const path = `${cwd}/${id}`;

	// clear previous cache
	if (fs.existsSync(path)) fs.rmSync(path, { force: true, recursive: true });
	await deleteFile('videos', id, true);
	await deleteFile('raw_audios', id);
	fs.mkdirSync(`${path}/out`, { recursive: true, mode: 0o777 });

	// download the raw video
	const url = await downloadUrl('raw_videos', id);
	const res = await fetch(url);

	if (res.status !== 200) throw new Error('video not found');
	await Bun.write(`${path}/raw.${format}`, res);

	// get the video info
	const info = getVideoInfo({ id, format });
	if (info.resolution < 360) throw new Error('invalid resolution');

	// generate the hls index file based on the available resolutions
	const indexFile = Bun.file(`${path}/out/index.m3u8`).writer();
	indexFile.write('#EXTM3U\n');

	// convert for every resolution
	const fileConversion = [extractAudio({ id, format })];
	if (info.resolution >= 1080) {
		fileConversion.push(convertVideo({ id, format }, '1080', info.frames));
		indexFile.write('#EXT-X-STREAM-INF:BANDWIDTH=3500000,RESOLUTION=1920x1080\n1080.m3u8\n');
	}
	if (info.resolution >= 720) {
		fileConversion.push(convertVideo({ id, format }, '720', info.frames));
		indexFile.write('#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720\n720.m3u8\n');
	}
	if (info.resolution >= 360) {
		fileConversion.push(convertVideo({ id, format }, '360', info.frames));
		indexFile.write('#EXT-X-STREAM-INF:BANDWIDTH=375000,RESOLUTION=640x360\n360.m3u8\n');
	}

	// write the hls index file to disk
	indexFile.flush();

	// await the conversion and upload the hls segment
	await Promise.all(fileConversion);
	await uploadFiles({ id, format });

	// modify the conversion status
	await db.updateTable('videos').where('id', '=', id).set({ converted: true }).executeTakeFirstOrThrow();
};
