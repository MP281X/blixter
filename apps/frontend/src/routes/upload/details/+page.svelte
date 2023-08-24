<script lang="ts">
	import FormHandler from '$lib/formHandler.svelte';
	import { videoInfo } from '../upload';

	export let data;
	export let form;
</script>

<div class="flex items-center justify-center">
	<FormHandler action="upload" schema={data.schema} errors={form} btn_text="Upload video">
		<input name="_id" hidden bind:value={$videoInfo.id} />
		<input name="_format" hidden bind:value={$videoInfo.format} />
	</FormHandler>
</div>
