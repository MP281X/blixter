<script lang="ts">
	import FileHandler from '$lib/fileHandler.svelte';
	import FormHandler from '$lib/formHandler.svelte';

	export let data;
	export let form;
</script>

<div class="flex flex-row items-center justify-center gap-10">
	<FormHandler action="upload" schema={data.schema} errors={form} btn_text="Upload video"></FormHandler>
	<input name="_id" hidden bind:value={data.schema._id} />
	<input name="_format" hidden bind:value={data.schema._format} />

	<FileHandler schema={data.schema} upload={data.upload}></FileHandler>
</div>
