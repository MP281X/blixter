<script lang="ts">
	import { formatDuration } from '$lib/helpers.js';
	import Hls from 'hls.js';
	import { onMount } from 'svelte';

	export let video: { id: string; duration: number };

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

		video_player.addEventListener('fullscreenchange', _ => {
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
	class="bg-orange relative flex aspect-video items-center justify-center border-4 border-black"
	style="height: min(75svh, (100svw - 2.5rem)/16*9); max-height: 100svh; max-width: 100svw;"
	on:mouseenter={() => (menu = true)}
	on:mouseleave={() => (menu = false)}>
	<div class="border-orange absolute aspect-square h-[40%] animate-spin rounded-full border-[4px] border-t-black" />

	<video
		autoplay
		class="absolute h-full w-full object-cover"
		poster="/s3/images/{video.id}"
		on:click={playPause}
		on:dblclick={() => (full_screen ? document.exitFullscreen() : video_player.requestFullscreen())}
		bind:this={video_el}>
		<track kind="captions" />
	</video>

	{#if full_screen}
		<button class="absolute left-[-10px] h-[70%] w-10 cursor-none" on:mouseenter={() => (menu = false)} on:mouseleave={() => (menu = true)} />
		<button class="absolute right-[-10px] h-[70%] w-10 cursor-none" on:mouseenter={() => (menu = false)} on:mouseleave={() => (menu = true)} />
	{/if}

	{#if current_time >= 0}
		<input
			type="range"
			on:input={x => {
				video_el.pause();
				//@ts-ignore
				video_el.currentTime = x.target.value;
			}}
			on:change={async () => {
				if (!paused) await video_el.play();
			}}
			class="time-slider z-4 bg-grey absolute bottom-0 h-2 w-full cursor-pointer appearance-none overflow-hidden border-t-4 border-black outline-none"
			style="bottom: {menu || paused ? 2.5 : 0}rem"
			bind:value={current_time}
			min="0"
			max={video.duration}
			step="0.1" />
	{/if}

	{#if menu || paused}
		<div class="absolute bottom-0 flex h-10 w-full items-center justify-between border-t-4 border-black bg-white px-5 font-bold">
			<div class="flex h-full items-center justify-center gap-5">
				{#if video && current_time === video.duration}
					<button on:click={playPause} class="i-ph-repeat-bold" />
				{:else if paused || current_time === 0}
					<button on:click={playPause} class="i-ph-play-bold" />
				{:else}
					<button on:click={playPause} class="i-ph-pause-bold" />
				{/if}

				<button class="group flex h-full items-center justify-center gap-3 pr-5">
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
							class="volume-slider hidden h-[1rem] w-[100px] cursor-pointer appearance-none border-4 border-x-black outline-none group-hover:block"
							bind:value={video_el.volume}
							style="border-right: {video_el.volume === 1 ? 0 : 4}px solid #040404; border-left: {video_el.volume === 0 ? 0 : 4}px solid #040404" />
					{/if}
				</button>
			</div>
			<div class="flex h-full items-center justify-center gap-5">
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
