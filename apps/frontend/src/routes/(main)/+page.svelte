<script lang="ts">
	import HlsPreview from '$lib/hlsPreview.svelte';

	export let data;
</script>

<svelte:head>
	<title>Blixter</title>
</svelte:head>

<div class="flex flex-col gap-5 p-5">
	<div class="grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
		{#each data.videos as video}
			<HlsPreview data={video} />
		{/each}
	</div>
</div>
