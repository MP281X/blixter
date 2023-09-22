<script lang="ts">
	import HlsPlayer from '$lib/hlsPlayer.svelte';

	export let data;
</script>

<svelte:head>
	<title>{data.video.title}</title>
</svelte:head>

<div class="flex flex-col gap-5 p-5">
	<div class="grid grid-cols-1 gap-5 md:grid-cols-[70%_1fr] lg:grid-cols-[60%_1fr] xl:grid-cols-[60%_1fr] 2xl:grid-cols-[70%_1fr]">
		<HlsPlayer video={data.video}></HlsPlayer>
	</div>
</div>
