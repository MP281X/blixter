<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDate, formatSubscribers, formatViews } from '$lib/helpers.js';
	import HlsPlayer from '$lib/hlsPlayer.svelte';

	const imgError = (x: any) => (x.target.style.display = 'none');

	export let data;
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div class="flex w-full flex-col gap-5 p-5 lg:px-[20%]">
	<div class="flex w-full items-center justify-center">
		<HlsPlayer video={data}></HlsPlayer>
	</div>

	<div class="flex w-full flex-col items-start justify-start border-4 border-black bg-white p-3">
		<div class="flex w-full flex-row gap-3">
			<div class="flex aspect-square h-full items-center justify-center border-4 border-black">
				<span class="i-ph-user-focus text-4xl"></span>
				<img class="bg-white" src="/s3/images/{data.user_id}" alt="" on:error={imgError} />
			</div>
			<div class="flex flex-col">
				<div class="flex items-baseline justify-between gap-5">
					<span class="font-bold">{data.title}</span>
					<span class="text-base"> [ {formatViews(data.views)} ]</span>
				</div>
				<div class="flex items-baseline justify-between gap-5 text-base">
					<span class="font-bold">@{data.username}</span>
					[ {formatSubscribers(data.subscribers)} ]
				</div>
			</div>
		</div>

		<div class="bg-grey mb-3 mt-5 h-[1px] w-full"></div>

		<p>{data.description}</p>
	</div>

	<div class="flex w-full flex-col gap-5 border-4 border-black bg-white p-3">
		<form use:enhance action="?/comment" method="post" novalidate class="flex flex-row items-center justify-center gap-3">
			<input
				placeholder={'comment'}
				id={'comment'}
				name={'comment'}
				type="text"
				class="placeholder-grey h-full w-full border-4 border-black bg-white bg-none p-2 outline-none" />
			<button type="submit" class="flex aspect-square h-full items-center justify-center border-4 border-black bg-white p-2">
				<span class="i-ph-paper-plane-right-bold text-xl" />
			</button>
		</form>

		{#each data.comments as { comment, username, created_at, user_id }}
			<div class="flex w-full flex-row gap-3 border-4 border-black bg-white p-2">
				<div class="flex aspect-square h-full items-center justify-center border-4 border-black">
					<span class="i-ph-user-focus text-4xl"></span>
					<img class="bg-white" src="/s3/images/{user_id}" alt="" on:error={imgError} />
				</div>

				<div class="flex flex-col items-start justify-center pr-5">
					<div>
						<span class="font-bold">@{username}</span> • <span>{formatDate(created_at)}</span>
					</div>
					<p class="break-words text-base">{comment}</p>
				</div>
			</div>
		{/each}
	</div>
</div>
