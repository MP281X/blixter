// extract the video info
type GetVideoInfo = { id: string; file: string };
export const getVideoInfo = async ({ id, file }: GetVideoInfo) => {
	const ffprobe = Bun.spawn(
		['ffprobe', '-v', 'quiet', ['-select_streams', 'v:0'], ['-show_entries', 'stream=height,nb_frames,duration'], ['-of', 'json'], file].flat(2),
		{
			stderr: 'ignore',
			cwd: `${process.cwd()}/.cache/${id}`
		}
	);

	if ((await ffprobe.exited) !== 0) throw new Error('unable to get the file info');
	const fileInfo = (await new Response(ffprobe.stdout).json())['streams'][0];

	return {
		resolution: fileInfo['height'],
		frames: Number(fileInfo['nb_frames']),
		duration: Math.floor(Number(fileInfo['duration']))
	};
};

// convert the video for a single resolution and log the progress
type ConvertVideo = { id: string; file: string; resolution: '1080' | '720' | '360'; tot_frames: number; status: (arg0: number) => Promise<void> };
export const convertVideo = async ({ id, file, resolution, tot_frames, status }: ConvertVideo) => {
	const res = `${(Number(resolution) / 9) * 16}:${resolution}`;
	const cmd = Bun.spawn(
		[
			'ffmpeg',
			['-i', file],
			['-vf', `scale=${res}:force_original_aspect_ratio=decrease,pad=${res}:(ow-iw)/2:(oh-ih)/2:black`],
			['-c:v', 'h264'],
			['-profile:v', 'baseline'],
			['-level', '3.0'],
			['-start_number', '0'],
			['-f', 'hls'],
			['-hls_flags', 'temp_file'],
			['-hls_segment_filename', `out/${resolution}_%03d.ts`],
			['-hls_time', '10'],
			['-hls_list_size', '0'],
			`out/${resolution}.m3u8`
		].flat(2),
		{ stderr: 'pipe', stdout: 'ignore', cwd: `${process.cwd()}/.cache/${id}` }
	);

	for await (const chunk of cmd.stderr) {
		let log = new TextDecoder().decode(chunk).split('\n');
		log.forEach(async txt => {
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

type ExtractAudio = { id: string; file: string };
export const extractAudio = async ({ id, file }: ExtractAudio) => {
	const cmd = Bun.spawnSync(
		['ffmpeg', ['-i', file], '-vn', ['-acodec', 'libmp3lame'], ['-q:a', '5'], ['-preset', 'ultrafast'], 'audio.mp3'].flat(2),
		{ cwd: `${process.cwd()}/.cache/${id}` }
	);

	if (!cmd.success.valueOf()) throw new Error('unable to extract the audio');
};

type ExtractPreview = { id: string; file: string };
export const extractPreview = async ({ id, file }: ExtractPreview) => {
	const cmd = Bun.spawnSync(['ffmpeg', ['-i', file], ['-vf', 'select=eq(n\\,0),scale=1280:720'], ['-q:v', '2'], 'preview.png'].flat(2), {
		cwd: `${process.cwd()}/.cache/${id}`
	});

	if (!cmd.success.valueOf()) throw new Error('unable to extract the preview');
};
