import { S3, S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { watch, writeFile } from 'fs/promises';

const env = typeof Bun !== 'undefined' ? Bun.env : process.env;

const s3Client = new S3Client({
	endpoint: 'https://s3-blixter.mp281x.xyz',
	forcePathStyle: true,
	region: 'eu2',
	credentials: {
		accessKeyId: env.S3_KEY!,
		secretAccessKey: env.S3_SECRET!
	}
});

const s3 = new S3({
	endpoint: 'https://s3-blixter.mp281x.xyz',
	forcePathStyle: true,
	region: 'eu2',
	credentials: {
		accessKeyId: env.S3_KEY!,
		secretAccessKey: env.S3_SECRET!
	}
});

process.on('exit', () => {
	s3Client.destroy();
	s3.destroy();

	console.log('s3 -> disconnect');
});

const Bucket = 'blixter';
export type FileType = 'videos' | 'raw_videos' | 'raw_audios' | 'images' | 'raw_images' | 'demo';

export const uploadUrl = async (type: FileType, id?: string) => {
	if (id === undefined) id = crypto.randomUUID().toString();

	const fileInfo = new PutObjectCommand({
		Bucket,
		Key: `${type}/${id}`
	});

	const url = await getSignedUrl(s3Client, fileInfo, {
		expiresIn: 60 * 60
	});

	return { url, id };
};

export const upload = async (type: FileType, name: string, path?: string, abortController?: AbortController) => {
	const dir = `${process.cwd()}/.cache/${path ?? name}`;
	if (!fs.statSync(dir).isDirectory()) {
		const { url } = await uploadUrl(type, name);
		const res = await fetch(url, { method: 'PUT', body: Bun.file(dir), timeout: false });

		if (!res.ok) throw new Error('unable to upload the file');
		fs.rmSync(dir);

		return;
	}

	if (abortController) {
		const watcher = watch(dir, { recursive: true, persistent: true, signal: abortController.signal });

		try {
			for await (let { filename } of watcher) {
				filename = filename.replace('.tmp', '');
				if (!fs.existsSync(`${dir}/${filename}`)) continue;

				const { url } = await uploadUrl(type, `${name}/${filename}`);
				const res = await fetch(url, { method: 'PUT', body: Bun.file(`${dir}/${filename}`), timeout: false });
				if (res.ok) fs.rmSync(`${dir}/${filename}`);
			}
		} catch (e) {}
	}

	// it cannot be done with promise all' it throw a too many request error
	for (const file of fs.readdirSync(dir)) {
		if (fs.statSync(`${dir}/${file}`).isDirectory()) continue;

		const { url } = await uploadUrl(type, `${name}/${file}`);
		const res = await fetch(url, { method: 'PUT', body: Bun.file(`${dir}/${file}`), timeout: false });
		if (!res.ok) throw new Error('unable to upload the files');

		fs.rmSync(`${dir}/${file}`);
	}
};

export const downloadUrl = async (type: FileType, id: string) => {
	const fileInfo = new GetObjectCommand({
		Bucket,
		Key: `${type}/${id}`
	});

	const url = await getSignedUrl(s3Client, fileInfo, {
		expiresIn: 60 * 60
	});

	return url;
};

export const download = async (type: FileType, id: string, path: string) => {
	const url = await downloadUrl(type, id);
	const res = await fetch(url, { timeout: false });
	if (!res.ok) throw new Error(`unable to download ${type}:${id}`);

	await writeFile(`${process.cwd()}/.cache/${path}`, await res.arrayBuffer());
};

export const listFiles = async (type: FileType, id: string = '') => {
	const files = await s3.listObjectsV2({
		Bucket,
		Prefix: `${type}/${id}`
	});

	return files.Contents?.map(obj => ({
		id: obj.Key?.replace(`${type}/`, '').replace(`${id === '' ? '---' : ''}/`, '')!,
		uploadedAt: obj.LastModified!
	}));
};

export const deleteFile = async (type: FileType, id: string, folder: boolean = false) => {
	if (folder) {
		const res = await listFiles(type, id);
		if (!res) return;

		for (const file of res) {
			await s3.deleteObject({
				Bucket,
				Key: `${type}/${id}/${file.id}`.replaceAll('//', '/')
			});
		}

		return;
	}

	await s3.deleteObject({
		Bucket,
		Key: `${type}/${id}`.replaceAll('//', '/')
	});

	return;
};

export const moveFile = async (from: { type: FileType; id: string }, to: { type: FileType; id: string }) => {
	await s3.copyObject({
		Bucket,
		Key: `${to.type}/${to.id}`,
		CopySource: `${Bucket}/${from.type}/${from.id}`
	});
};
