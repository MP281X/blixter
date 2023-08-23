<script lang="ts">
	import FormHandler from '$lib/formHandler.svelte';

	export let data;
	export let form;
</script>

<div class="flex flex-col items-center justify-center">
	<FormHandler action="upload" schema={data.schema} errors={form} btn_text="Upload video"></FormHandler>
</div>
