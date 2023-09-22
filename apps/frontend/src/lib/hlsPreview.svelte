<script lang="ts">
	import Hls from 'hls.js';
	import { onMount } from 'svelte';
	import { formatDate, formatDuration, formatViews } from '$lib/helpers';

	export let data: {
		id: string;
		user_id: string;
		title: string;
		duration: number;
		created_at: Date;
		username: string;
		views: number;
	};

	let video: HTMLVideoElement;
	let currentTime = 0;
	let remaining = data.duration;
	let hls: Hls;

	const play = async () => {
		if (Hls.isSupported()) {
			hls = new Hls();
			hls.loadSource(`/s3/videos/${data.id}/index.m3u8`);
			hls.attachMedia(video);
		}
	};

	const stop = () => {
		video.pause();
		if (hls) hls.destroy();

		video.currentTime = 0;
	};

	const imgError = (x: any) => (x.target.style.display = 'none');

	onMount(() => {
		video.addEventListener('timeupdate', () => {
			if (!video || !video.currentTime) {
				currentTime = 0;
				remaining = 0;
				return;
			}

			const time = Math.round((video.currentTime / data.duration) * 100);
			if (time > 100) currentTime = 100;
			else currentTime = Math.round(time);

			const remaining_time = Math.round(data.duration - video.currentTime);
			if (remaining_time < 0) remaining = 0;
			else remaining = remaining_time;
		});
	});
</script>

<a class="flex flex-col w-full bg-orange" href="/watch-{data.id}">
	<button
		class="flex w-full aspect-video justify-center items-center bg-orange border-black border-4 relative"
		on:mouseenter={play}
		on:mouseleave={stop}>
		<div class="border-orange h-[40%] aspect-square animate-spin rounded-full border-[4px] border-t-black absolute" />

		<video bind:this={video} autoplay muted loop class="absolute h-full w-full aspect-video object-cover" poster="/s3/images/{data.id}">
			<track kind="captions" />
		</video>

		{#if currentTime > 0}
			<div class="h-2 w-full flex absolute bottom-0 z-4">
				<div class="h-full bg-orange border-t-4 border-r-4 border-black" style="width: {currentTime}%"></div>
			</div>
		{/if}

		<div class="absolute h-full w-full bg-black bg-opacity-50 hover:bg-opacity-0 transition-all duration-300"></div>

		<div class="absolute bg-black text-white m-[12px] px-[6px] font-bold bottom-0 right-0 pointer-events-none">
			{formatDuration(remaining)}
		</div>
	</button>

	<div class="h-16 flex flex-row gap-3 w-full bg-white border-4 border-black border-t-0 p-2">
		<div class="aspect-square h-full border-4 border-black flex justify-center items-center">
			<span class="i-ph-user-focus text-4xl"></span>
			<img class="bg-white" src="/s3/images/{data.user_id}" alt="" on:error={imgError} />
		</div>

		<div class="flex flex-col justify-center items-start w-full">
			<div class="font-bold">{data.title}</div>
			<div class="text-base">{formatViews(data.views)} • {formatDate(data.created_at)}</div>
		</div>
	</div>
</a>
