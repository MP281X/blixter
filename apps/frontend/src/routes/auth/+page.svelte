<script lang="ts">
	import FormHandler from '$lib/formHandler.svelte';

	export let data;
	export let form;

	export let login: boolean = true;
</script>

<div class="flex flex-1 flex-col items-center justify-center">
	{#if login}
		<FormHandler action="login" schema={data.loginSchema} errors={form} btn_text="Log In">
			<button class="text-grey group mt-2 text-sm transition-colors duration-100 ease-in hover:text-black" on:click={() => (login = false)}>
				Don't have an account?
				<span class="group-hover:text-orange text-grey underline duration-200">Sign up</span>
			</button>
		</FormHandler>
	{:else}
		<FormHandler action="signup" schema={data.signupSchema} errors={form} btn_text="Sign up">
			<button class="text-grey group mt-2 text-sm transition-colors duration-100 ease-in hover:text-black" on:click={() => (login = true)}>
				Already have an account?
				<span class="group-hover:text-orange text-grey underline duration-200">Log In</span>
			</button>
		</FormHandler>
	{/if}
</div>
