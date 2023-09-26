<script lang="ts">
	export let data;

	let files: FileList;
	let fileInput: { value: any };
	let uploadController: XMLHttpRequest | undefined;
	let uploadState: 'uploading' | 'uploaded' | undefined;
	let videoInfo: { id: string; format: string };
	let uploadedPercent = 0;

	const uploadFile = async () => {
		try {
			if (files && files.length !== 1) return;
			uploadState = 'uploading';
			const file = await files[0].arrayBuffer();

			const upload = await new Promise<number>((resolve, reject) => {
				uploadController = new XMLHttpRequest();
				uploadController.open('PUT', data.upload.url);

				uploadController.upload.addEventListener('progress', e => (uploadedPercent = Math.floor((e.loaded / e.total) * 100)));

				uploadController.addEventListener('load', _ => resolve(uploadController!.status));
				uploadController.addEventListener('error', e => reject(e));
				uploadController.send(file);
			});

			if (upload === 200) {
				uploadController = undefined;
				videoInfo = { id: data.upload.id, format: files[0].type.split('/')[1] };
				uploadState = 'uploaded';
			}
		} catch (e) {
			uploadState = undefined;
		}
	};

	const cancelUpload = () => {
		uploadState = undefined;
		uploadedPercent = 0;
		fileInput.value = '';

		if (uploadController) uploadController.abort();
	};

	$: files && uploadFile();
</script>

<svelte:head>
	<title>video upload</title>
</svelte:head>

<div class="flex items-center justify-center text-2xl font-bold text-white">
	<div class="flex w-[300px] flex-col items-center justify-center space-y-5 border-4 border-black bg-white p-5">
		<input type="file" id="file" bind:this={fileInput} bind:files hidden accept="video/mp4" />

		{#if files && files.length === 1}
			<button
				class="hover:border-orange relative flex aspect-video h-full w-full border-4 border-black transition-colors duration-200"
				on:click={cancelUpload}>
				<video src={URL.createObjectURL(files[0])} autoplay muted loop class="aspect-video object-cover" />
				<h3 class="absolute flex h-full w-full items-center justify-center bg-black bg-opacity-70 text-5xl">{uploadedPercent}%</h3>
			</button>
		{/if}

		{#if uploadState === undefined}
			<label for="file" class="btn-animation flex w-full items-center justify-center border-2 py-1">
				<span class="i-ph-upload-simple-bold mr-2" />
				Select File
			</label>
		{:else if uploadState === 'uploaded'}
			<a href={`/upload/${videoInfo.format}-${videoInfo.id}`} class="btn-animation w-full border-2 py-1 text-center">Next</a>
		{:else if uploadState === 'uploading'}
			<svg class="h-7 w-7 animate-spin text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
			</svg>
		{/if}
	</div>
</div>
