import { S3, S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

if (process.env.NODE_ENV !== 'production') await import('dotenv/config');

const s3Client = new S3Client({
	endpoint: 'https://eu2.contabostorage.com',
	forcePathStyle: true,
	region: 'eu2',
	credentials: {
		accessKeyId: process.env.S3_KEY!,
		secretAccessKey: process.env.S3_SECRET!
	}
});

const s3 = new S3({
	endpoint: 'https://eu2.contabostorage.com',
	forcePathStyle: true,
	region: 'eu2',
	credentials: {
		accessKeyId: process.env.S3_KEY!,
		secretAccessKey: process.env.S3_SECRET!
	}
});

const Bucket = 'blixter';

type FileType = 'images' | 'raw_images' | 'videos' | 'raw_videos';

export const uploadUrl = async (type: FileType) => {
	const id = crypto.randomUUID().toString();

	const fileInfo = new PutObjectCommand({
		Bucket,
		Key: `${type}/${id}`
	});

	const url = await getSignedUrl(s3Client, fileInfo, {
		expiresIn: 60 * 60
	});

	return { url, id };
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

export const listFiles = async (type: FileType) => {
	const files = await s3.listObjectsV2({
		Bucket,
		Prefix: `${type}/`
	});

	return files.Contents?.map((obj) => ({
		id: obj.Key,
		uploadedAt: obj.LastModified
	}));
};

export const deleteFile = async (type: FileType, id: string) => {
	await s3.deleteObject({
		Bucket,
		Key: `${type}/${id}`
	});

	return id;
};
