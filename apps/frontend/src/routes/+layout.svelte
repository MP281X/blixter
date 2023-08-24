<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';

	let profileDialog = false;
	page.subscribe(() => (profileDialog = false));
</script>

<main class="font-regular grid min-h-[100dvh] grid-rows-[3.5rem_1fr] scroll-smooth text-xl">
	<header class="flex items-center justify-between border-b-4 border-b-black bg-white px-5 text-3xl font-bold">
		<a href="/" class="font-bold">Blixter</a>
		{#if $page.route.id !== '/auth'}
			<nav class="flex items-center justify-center space-x-5">
				<a href="/upload/video" class="i-ph-film-slate-bold"> </a>
				<button class="i-ph-user-focus-bold" on:click={() => (profileDialog = !profileDialog)} />
			</nav>
		{/if}
	</header>

	<slot />
</main>

{#if profileDialog}
	<button on:click={() => (profileDialog = false)} class="fixed h-[100dvh] w-full">
		<div id="profile-dialog" class="fixed right-5 top-12 flex border-4 border-black bg-white p-3 text-xl">
			<a href="/auth" class="flex items-center justify-start font-bold"><span class="i-ph-sign-out-bold mr-2 text-xl" />Log out</a>
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
