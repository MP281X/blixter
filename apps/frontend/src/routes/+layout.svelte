<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let profileDialog = false;
	let searchQuery: string = '';

	onMount(() => (searchQuery = $page.url.searchParams.get('q') ?? ''));
	page.subscribe(() => (profileDialog = false));
</script>

<main class="font-regular grid min-h-[100dvh] grid-rows-[3.75rem_1fr] scroll-smooth text-xl">
	<header class="flex items-center justify-between border-b-4 border-b-black bg-white px-5 py-[6px] text-3xl">
		<a href="/" class="flex items-center justify-center font-bold">
			<img class="h-full" src="/favicon.png" alt="logo" style="image-rendering: pixelated;" />
			<div>Blixter</div>
		</a>

		{#if $page.route.id === '/(main)' || $page.route.id === '/profile'}
			<div class="flex h-full w-[70%] border-4 border-black sm:w-[50%]">
				<input type="text" bind:value={searchQuery} class="placeholder-grey w-full bg-none px-2 text-2xl outline-none" placeholder="search" />
				<a href="?" data-sveltekit-reload class="mr-1 flex aspect-square h-full items-center justify-center">
					<span class="i-ph-eraser-bold text-2xl" />
				</a>
				<a
					class="flex aspect-square h-full items-center justify-center bg-black"
					data-sveltekit-reload
					href="?q={searchQuery.replaceAll('=', '').replaceAll('?', '')}">
					<span class="i-ph-file-search-bold text-2xl text-white" />
				</a>
			</div>
		{/if}

		{#if $page.route.id !== '/auth'}
			<nav class="flex items-center justify-center space-x-5">
				<a href="/upload" class="i-ph-film-slate-bold"> </a>
				<button class="i-ph-user-focus-bold" on:click={() => (profileDialog = !profileDialog)} />
			</nav>
		{/if}
	</header>

	<slot />
</main>

{#if profileDialog}
	<button on:click={() => (profileDialog = false)} class="fixed h-[100dvh] w-full">
		<div id="profile-dialog" class="fixed right-5 top-12 flex flex-col space-y-1 border-4 border-black bg-white p-3 text-xl">
			<a href="/auth" class="flex items-center justify-start font-bold">
				<span class="i-ph-sign-out-bold mr-2 text-xl" />
				Log out
			</a>
			<a href="/profile" class="flex items-center justify-start font-bold">
				<span class="i-ph-user-list-bold mr-2 text-xl" />
				Profile
			</a>
		</div>
	</button>
{/if}

<style lang="css">
	main {
		background-color: #fefefe;
		background-image: url("data:image/svg+xml,%3Csvg width='320' height='320' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10h10v10H0V10zM10 0h10v10H10V0z' fill='%23a3a2a7' fill-opacity='0.25' fill-rule='evenodd'/%3E%3C/svg%3E");
	}

	#profile-dialog {
		animation-name: scrollAnimation;
		animation-duration: 0.4s;
		animation-timing-function: ease;
		animation-fill-mode: forwards;
	}

	@keyframes scrollAnimation {
		0% {
			opacity: 0;
			transform: translateY(30%);
		}
		60% {
			opacity: 1;
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
