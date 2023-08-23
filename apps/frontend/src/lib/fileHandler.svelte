<script lang="ts">
	export let schema: Record<string, any>;
	export let upload: {
		url: string;
		id: string;
	};

	let files: FileList | undefined;
	let videoUrl: string = '';
	const uploadFile = async () => {
		if (!files || files.length !== 1) return;

		const file = files[0];
		videoUrl = URL.createObjectURL(file);
		console.log(videoUrl);

		console.log('starting upload');
		const res = await fetch(upload.url, {
			method: 'put',
			body: await file.arrayBuffer()
		});

		console.log('uploaded');

		if (res.status === 200) {
			schema['_id'] = upload.id;
			schema['_format'] = file.type;
		}
	};
</script>

<div class="h-[200px] w-[200px] border-4 border-black">
	<input type="file" bind:files />
	<!-- svelte-ignore a11y-media-has-caption -->
	<video src={videoUrl} controls></video>
	<button on:click={() => uploadFile()}>Upload file</button>
</div>
