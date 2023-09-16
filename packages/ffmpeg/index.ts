// extract the video info
type GetVideoInfo = { id: string; file: string };
export const getVideoInfo = async ({ id, file }: GetVideoInfo) => {
	const ffprobe = Bun.spawn(['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', '-count_frames', file], {
		stderr: 'ignore',
		cwd: `${process.cwd()}/.cache/${id}`
	});

	if ((await ffprobe.exited) !== 0) throw new Error('unable to get the file info');
	const fileInfo = (await new Response(ffprobe.stdout).json())['streams'][0];

	return {
		resolution: fileInfo['height'],
		frames: Number(fileInfo['nb_frames']),
		duration: Number(fileInfo['duration']).toFixed(2)
	};
};

// convert the video for a single resolution and log the progress
type ConvertVideo = { id: string; file: string; resolution: '1080' | '720' | '360'; tot_frames: number; status: (arg0: number) => Promise<void> };
export const convertVideo = async ({ id, file, resolution, tot_frames, status }: ConvertVideo) => {
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
		{ stderr: 'pipe', stdout: 'ignore', cwd: `${process.cwd()}/.cache/${id}` }
	);

	for await (const chunk of cmd.stderr) {
		let log = new TextDecoder().decode(chunk).split('\n');
		log.forEach(async (txt) => {
			if (!txt || txt.trim() === '') return;
			if (txt.includes('Failed')) throw new Error(`unable to convert the video in ${resolution}`);
			if (!txt.startsWith('frame=')) return;

			const frame = Number(txt.substring(0, txt.indexOf('fps=')).replaceAll(' ', '').split('=')[1]);
			if (frame === 0) return;

			await status(Math.floor((frame / tot_frames) * 100));
		});
	}

	if ((await cmd.exited) !== 0) throw new Error(`unable to convert the video in ${resolution}`);
};

type ConvertAudio = { id: string; file: string };
export const convertAudio = async ({ id, file }: ConvertAudio) => {
	const cmd = Bun.spawnSync(
		['ffmpeg', ['-i', file], '-vn', ['-acodec', 'libmp3lame'], ['-q:a', '5'], ['-preset', 'ultrafast'], 'audio.mp3'].flat(2),
		{ cwd: `${process.cwd()}/.cache/${id}` }
	);

	if (!cmd.success.valueOf()) throw new Error('unable to extract the audio');
};
