<script lang="ts">
	import HlsPlayer from '$lib/hlsPlayer.svelte';

	export let data;
</script>

<div class="grid items-center justify-center grid-cols-4 m-5">
	{#each data.videos as video}
		<HlsPlayer id={video.id}></HlsPlayer>
	{/each}
</div>
