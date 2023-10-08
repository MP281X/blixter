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

<a class="bg-orange flex w-full flex-col" href="/watch-{data.id}">
	<button
		class="bg-orange relative flex aspect-video w-full items-center justify-center border-4 border-black"
		on:mouseenter={play}
		on:mouseleave={stop}>
		<div class="border-orange absolute aspect-square h-[40%] animate-spin rounded-full border-[4px] border-t-black" />

		<video bind:this={video} autoplay muted loop class="absolute aspect-video h-full w-full object-cover" poster="/s3/images/{data.id}">
			<track kind="captions" />
		</video>

		{#if currentTime > 0}
			<div class="z-4 absolute bottom-0 flex h-2 w-full">
				<div class="bg-orange h-full border-r-4 border-t-4 border-black" style="width: {currentTime}%"></div>
			</div>
		{/if}

		<div class="absolute h-full w-full bg-black bg-opacity-50 transition-all duration-300 hover:bg-opacity-0"></div>

		<div class="pointer-events-none absolute bottom-0 right-0 m-[12px] bg-black px-[6px] font-bold text-white">
			{formatDuration(remaining)}
		</div>
	</button>

	<div class="flex h-16 w-full flex-row gap-3 border-4 border-t-0 border-black bg-white p-2">
		<div class="flex aspect-square h-full items-center justify-center border-4 border-black">
			<span class="i-ph-user-focus text-4xl"></span>
			<img class="bg-white" src="/s3/images/{data.user_id}" alt="" on:error={imgError} />
		</div>

		<div class="flex w-full flex-col items-start justify-center">
			<div class="font-bold">{data.title.length > 20 ? `${data.title.substring(0, 17)}...` : data.title}</div>
			<div class="text-base">{formatViews(data.views)} • {formatDate(data.created_at)}</div>
		</div>
	</div>
</a>
