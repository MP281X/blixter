<script lang="ts">
	import HlsPreview from '$lib/hlsPreview.svelte';

	export let data;

	const gridSpan = (key: string) => {
		if (key === 'latest_upload' || key === 'watch_time') return 2;
		else return 1;
	};
</script>

<svelte:head>
	<title>{data.profile.username}</title>
</svelte:head>

<div class="flex flex-col gap-5 p-5">
	<div class="grid grid-flow-row-dense grid-cols-2 gap-5 lg:grid-cols-5">
		{#each Object.entries(data.stats) as [key, value]}
			<div
				class="flex h-full w-full flex-col items-center justify-center gap-2 border-4 border-black bg-white text-2xl font-bold"
				style="grid-column: span {gridSpan(key)} / span {gridSpan(key)}">
				<div>{key[0].toUpperCase() + key.substring(1).replaceAll('_', ' ')}</div>
				<div class="text-5xl">{value}</div>
			</div>
		{/each}
	</div>

	<div class="grid w-full gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
		{#each data.videos as video}
			<HlsPreview data={video}></HlsPreview>
		{/each}
	</div>
</div>
