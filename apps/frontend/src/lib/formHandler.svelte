<script lang="ts">
	import { enhance } from '$app/forms';

	export let schema: Record<string, any>;
	export let action: string;
	export let btn_text: string;
	export let errors: Record<string, any> | null;

	const inputStyle = (key: string, value: unknown) => {
		const valueType = typeof value;
		let style: { type: 'text' | 'password' | 'email' | 'tel' | 'number' | 'checkbox'; icon: string };

		if (key === 'password') style = { type: 'password', icon: 'i-ph-password-bold' };
		else if (key === 'email') style = { type: 'email', icon: 'i-ph-envelope-simple-bold' };
		else if (key.includes('tel')) style = { type: 'tel', icon: 'i-ph-phone-bold' };
		else if (valueType === 'number') style = { type: 'number', icon: 'i-ph-calculator-bold' };
		else if (valueType === 'boolean') style = { type: 'checkbox', icon: 'i-ph-check-square-bold' };
		else style = { type: 'text', icon: 'i-ph-text-align-left-bold' };

		return style;
	};
</script>

<form
	use:enhance
	action={`?/${action}`}
	method="post"
	class="font-regular flex w-[230px] flex-col items-center justify-center space-y-2 border-4 border-black bg-white p-5 text-xl">
	{#each Object.entries(schema) as [key, value]}
		{@const style = inputStyle(key, value)}
		<div class="flex w-full flex-col">
			<div class={`${errors && errors[key] ? 'border-orange' : 'border-grey'} flex h-8 w-full items-center justify-start border-b-2`}>
				<label for={key} class={`${style.icon} ${errors && errors[key] ? 'text-orange' : 'text-grey'} mr-2 w-5`} />
				<input
					placeholder={key}
					id={key}
					name={key}
					type={style.type}
					on:input={() => {
						if (errors && errors[key]) delete errors[key];
						errors = errors;
					}}
					class="placeholder-grey h-full w-full bg-none outline-none" />
			</div>

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

	<slot />
</form>
