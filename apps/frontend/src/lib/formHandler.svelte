<script lang="ts">
	import { enhance } from '$app/forms';

	export let schema: Record<string, any>;
	export let action: string;
	export let btn_text: string;
	export let errors: Record<string, any> | null;

	const inputType = (key: string, value: unknown) => {
		let type: string = typeof value;

		if (key.includes('password')) type = 'password';
		else if (key.includes('email')) type = 'email';
		else if (key.includes('tel')) type = 'tel';
		else if (key.includes('file')) type = 'file';
		else if (type === 'number') type = 'number';
		else if (type === 'boolean') type = 'checkbox';
		else type = 'text';

		return type;
	};
</script>

<form use:enhance action={`?/${action}`} method="post" class="font-regular flex w-[200px] flex-col items-center justify-center space-y-2 text-xl">
	{#each Object.entries(schema) as [key, value]}
		<div>
			<input
				placeholder={key}
				name={key}
				type={inputType(key, value)}
				on:input={() => {
					if (errors && errors[key]) delete errors[key];
					errors = errors;
				}}
				class="border-grey w-full border-b-2 bg-none outline-none focus:border-black" />
			{#if errors && errors[key]}
				<div class="text-orange text-xs">{errors[key]}</div>
			{/if}
		</div>
	{/each}

	<div />
	<button type="submit" class="btn-animation w-full border-2 py-1 text-2xl font-bold text-white">
		{btn_text}
	</button>

	{#if errors && errors['error']}
		<div class="text-orange text-xs">{errors['error']}</div>
	{/if}
</form>
