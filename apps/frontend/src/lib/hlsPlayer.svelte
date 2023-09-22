<script lang="ts">
	import { formatDuration } from '$lib/helpers.js';
	import Hls from 'hls.js';
	import { onMount } from 'svelte';

	export let video: {
		id: string;
		user_id: string;
		title: string;
		duration: number;
		created_at: Date;
		username: string;
		views: number;
	};

	let video_el: HTMLVideoElement;
	let video_player: HTMLButtonElement;
	let current_time = 0;
	let hls: Hls;

	let menu = false;
	let paused = true;
	let full_screen = false;

	const playPause = async () => {
		if (!video_el) return;

		paused = video_el.currentTime > 0 && !video_el.paused && video_el.readyState > 2;
		if (!paused) menu = true;

		if (paused) video_el.pause();
		else await video_el.play();
	};

	onMount(async () => {
		if (Hls.isSupported()) {
			hls = new Hls();

			hls.loadSource(`/s3/videos/${video.id}/index.m3u8`);
			hls.attachMedia(video_el);
		}

		try {
			await video_el.play();
			paused = false;
		} catch {}

		video_player.addEventListener('fullscreenchange', (_) => {
			if (document.fullscreenElement) full_screen = true;
			else full_screen = false;
		});

		video_el.addEventListener('timeupdate', () => {
			video_el.currentTime = video_el.currentTime;
			if (!video_el || !video_el.currentTime) current_time = 0;
			else if (video_el.currentTime >= video.duration) {
				paused = true;
				current_time = video.duration;
			} else current_time = video_el.currentTime;
		});
	});
</script>

<button
	bind:this={video_player}
	class="flex w-full h-[min(100dvh, 100%)] aspect-video justify-center items-center bg-orange border-black border-4 relative"
	on:mouseenter={() => (menu = true)}
	on:mouseleave={() => (menu = false)}>
	<div class="border-orange h-[40%] aspect-square animate-spin rounded-full border-[4px] border-t-black absolute" />

	<video
		autoplay
		class="absolute h-full w-full aspect-video object-cover"
		poster="/s3/images/{video.id}"
		on:click={playPause}
		on:dblclick={() => (full_screen ? document.exitFullscreen() : video_player.requestFullscreen())}
		bind:this={video_el}>
		<track kind="captions" />
	</video>

	{#if full_screen}
		<button class="h-[70%] absolute w-10 left-[-10px] cursor-none" on:mouseenter={() => (menu = false)} on:mouseleave={() => (menu = true)} />
		<button class="h-[70%] absolute w-10 right-[-10px] cursor-none" on:mouseenter={() => (menu = false)} on:mouseleave={() => (menu = true)} />
	{/if}

	{#if current_time >= 0}
		<input
			type="range"
			on:input={(x) => {
				video_el.pause();
				//@ts-ignore
				video_el.currentTime = x.target.value;
			}}
			on:change={async () => {
				if (!paused) await video_el.play();
			}}
			class="time-slider appearance-none cursor-pointer outline-none absolute z-4 bottom-0 w-full h-2 overflow-hidden border-t-4 border-black bg-grey"
			style="bottom: {menu || paused ? 2.5 : 0}rem"
			bind:value={current_time}
			min="0"
			max={video.duration}
			step="0.1" />
	{/if}

	{#if menu || paused}
		<div class="absolute bottom-0 border-t-4 border-black bg-white font-bold flex justify-between px-5 items-center h-10 w-full">
			<div class="flex gap-5 h-full justify-center items-center">
				{#if video && current_time === video.duration}
					<button on:click={playPause} class="i-ph-repeat-bold" />
				{:else if paused || current_time === 0}
					<button on:click={playPause} class="i-ph-play-bold" />
				{:else}
					<button on:click={playPause} class="i-ph-pause-bold" />
				{/if}

				<button class="flex justify-center items-center gap-3 h-full pr-5 group">
					<button
						class={(() => {
							if (!video_el || video_el.volume === 0) return 'i-ph-speaker-simple-x-bold';
							else if (video_el.volume < 0.33) return 'i-ph-speaker-simple-none-bold';
							else if (video_el.volume < 0.66) return 'i-ph-speaker-simple-low-bold';
							else if (video_el.volume) return 'i-ph-speaker-simple-high-bold';
						})()}
						on:click={() => {
							if (!video_el) return;
							else if (video_el.volume === 0) video_el.volume = 1;
							else video_el.volume = 0;
						}}></button>
					{#if video_el}
						<input
							type="range"
							min="0"
							max="1"
							step="0.0001"
							class="volume-slider appearance-none w-[100px] h-[1rem] border-x-black border-4 outline-none cursor-pointer hidden group-hover:block"
							bind:value={video_el.volume}
							style="border-right: {video_el.volume === 1 ? 0 : 4}px solid #040404; border-left: {video_el.volume === 0 ? 0 : 4}px solid #040404" />
					{/if}
				</button>
			</div>
			<div class="flex gap-5 h-full justify-center items-center">
				<div>{formatDuration(current_time)} - {formatDuration(video.duration)}</div>
				<button
					class={full_screen ? 'i-ph-arrows-in-simple-bold' : 'i-ph-arrows-out-simple-bold'}
					on:click={() => (full_screen ? document.exitFullscreen() : video_player.requestFullscreen())} />
			</div>
		</div>
	{/if}
</button>

<style>
	.volume-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 1.5rem;
		height: 1rem;
		background: #fd7356;
		border: 4px solid #040404;
	}

	.time-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 1.25rem;
		height: 8px;
		background: white;
		border-left: 4px solid #040404;
		border-right: 4px solid #040404;
		box-shadow: -2000px 0 0 2000px #f50;
	}
</style>
