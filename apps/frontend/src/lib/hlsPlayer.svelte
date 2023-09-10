<script lang="ts">
	import Hls from 'hls.js';
	import { onMount } from 'svelte';

	export let id: string;
	let video: HTMLVideoElement;

	onMount(() => {
		if (Hls.isSupported()) {
			const hls = new Hls();
			hls.loadSource(`/hls/${id}/index.m3u8`);
			hls.attachMedia(video);
		}
	});
</script>

<video
	bind:this={video}
	height="100%"
	muted
	loop
	class="hover:border-orange border-4 border-black transition-colors duration-200 aspect-video object-cover"
	on:mouseenter={async () => video.play()}
	on:mouseleave={async () => {
		video.pause();
		video.currentTime = 0;
	}}>
	<track kind="captions" />
</video>
