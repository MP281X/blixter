<script lang="ts">
	import FormHandler from '$lib/formHandler.svelte';

	export let data;
	export let form;

	export let login: boolean = true;
</script>

<div class="flex h-screen w-full flex-col items-center justify-center">
	{#if login}
		<FormHandler action="login" schema={data.loginSchema} errors={form} btn_text="Log In"></FormHandler>
		<button class="text-grey group mt-2 text-sm transition-colors duration-100 ease-in hover:text-black" on:click={() => (login = false)}>
			Don't have an account?
			<span class="group-hover:text-orange underline">Sign up</span>
		</button>
	{:else}
		<FormHandler action="signup" schema={data.signupSchema} errors={form} btn_text="Sign up"></FormHandler>
		<button class="text-grey group mt-2 text-sm transition-colors duration-100 ease-in hover:text-black" on:click={() => (login = true)}>
			Already have an account?
			<span class="group-hover:text-orange underline">Log In</span>
		</button>
	{/if}
</div>
