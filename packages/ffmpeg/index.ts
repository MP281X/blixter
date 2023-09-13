import fs from 'fs';
import process from 'process';

// extract the video info
type GetVideoInfo = { jobID: string; file: string };
export const getVideoInfo = ({ jobID, file }: GetVideoInfo) => {
	const ffprobe = Bun.spawnSync(['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', '-count_frames', file], {
		stderr: 'ignore',
		cwd: `${process.cwd()}/.cache/${jobID}`
	});
	if (!ffprobe.success.valueOf()) throw new Error('unable to get the file info');

	const fileInfo = JSON.parse(ffprobe.stdout.toString())['streams'][0];

	console.log(`[${jobID}] extracted the video info`);
	return {
		resolution: fileInfo['height'],
		frames: Number(fileInfo['nb_frames']),
		duration: Number(fileInfo['duration']).toFixed(2)
	};
};

// convert the video for a single resolution and log the progress
type ConvertVideo = { jobID: string; file: string; resolution: '1080' | '720' | '360'; tot_frames: number };
export const convertVideo = async ({ jobID, file, resolution, tot_frames }: ConvertVideo) => {
	const cmd = Bun.spawn(
		[
			'ffmpeg',
			['-i', file],
			['-profile:v', 'baseline'],
			['-level', '3.0'],
			['-s', `${(Number(resolution) / 9) * 16}x${resolution}`],
			['-start_number', '0'],
			['-hls_time', '10'],
			['-hls_list_size', '0'],
			['-f', 'hls'],
			['-hls_flags', 'temp_file'],
			['-hls_segment_filename', `out/${resolution}_%03d.ts`],
			`out/${resolution}.m3u8`
		].flat(2),
		{ stderr: 'pipe', stdout: 'ignore', cwd: `${process.cwd()}/.cache/${jobID}` }
	);

	for await (const chunk of cmd.stderr) {
		let log = new TextDecoder().decode(chunk).split('\n');
		log.forEach((txt) => {
			if (!txt || txt.trim() === '') return;
			if (txt.includes('Failed')) throw new Error(`unable to convert the video in ${resolution}`);
			if (!txt.startsWith('frame=')) return;

			const frame = Number(txt.substring(0, txt.indexOf('fps=')).replaceAll(' ', '').split('=')[1]);
			if (frame === 0) return;

			console.log(`[${jobID}] ${resolution}p -> ${Math.floor((frame / tot_frames) * 100)}%`);
		});
	}

	if ((await cmd.exited) !== 0) throw new Error(`unable to convert the video in ${resolution}`);

	console.log(`[${jobID}] converted the video in hls ${resolution}p`);
};

type ConvertAudio = { jobID: string; file: string };
export const convertAudio = async ({ jobID, file }: ConvertAudio) => {
	const cmd = Bun.spawnSync(
		['ffmpeg', ['-i', file], '-vn', ['-acodec', 'libmp3lame'], ['-q:a', '5'], ['-preset', 'ultrafast'], 'audio.mp3'].flat(2),
		{ cwd: `${process.cwd()}/.cache/${jobID}` }
	);

	if (!cmd.success.valueOf()) throw new Error('unable to extract the audio');
};
