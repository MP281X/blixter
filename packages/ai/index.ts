import fs from 'fs';
import { openai, redis, hashText } from './src/helpers';
import { SchemaFieldTypes, VectorAlgorithms } from 'redis';

export const transcribe = async (id: string) => {
	const path = `${process.cwd()}/.cache/${id}`;

	const res = await openai.audio.transcriptions.create({
		model: 'whisper-1',
		file: fs.createReadStream(`${path}/audio.mp3`)
	});

	return res.text;
};

export const summarize = async (text: string) => {
	const res = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo-16k',
		messages: [
			{
				role: 'system',
				content: `
        Given the following transcribed text from a video's audio, generate a title (max 2 words) 
        and description (max 100 words) for the video. Provide the output in a valid JSON
        object with two keys: "title" and "description". The title and description should be concise,
        focusing solely on the main topic of the video. Avoid explicitly mentioning that it's a video
        and exclude any reference to followers or additional information not provided in the
        transcribed text.

        Additionally, please remove any greetings, information about other videos, community-
        related content, news references, links to other videos.`
			},
			{ role: 'user', content: text.toString() }
		]
	});

	let output = { title: 'err', description: 'err' };
	try {
		output = JSON.parse(res.choices[0]?.message.content!) as { title: string; description: string };
	} catch (e) {
		console.log('invalid json output');
	}
	return output;
};

export const categorize = async () => {};

type Embedding = 'videos';
export const generateEmbedding = async (type: Embedding, id: string, input: string) => {
	try {
		await redis.ft.dropIndex(`${type}-idx`);
	} catch (e: any) {}

	await redis.ft.create(
		`${type}-idx`,
		{
			'$.id': { type: SchemaFieldTypes.TEXT, AS: 'id' },
			'$.text': { type: SchemaFieldTypes.TEXT, AS: 'text' },
			'$.embedding': {
				type: SchemaFieldTypes.VECTOR,
				ALGORITHM: VectorAlgorithms.HNSW,
				DIM: 1536,
				DISTANCE_METRIC: 'COSINE',
				TYPE: 'FLOAT32',
				AS: 'embedding'
			}
		},
		{ ON: 'JSON', PREFIX: `embeddings:${type}:` }
	);

	const { embedding } = (await openai.embeddings.create({ model: 'text-embedding-ada-002', input })).data[0]!;
	await redis.json.set(`embeddings:${type}:${crypto.randomUUID()}`, '$', { id, embedding, text: input });
};

export const searchEmbedding = async (type: Embedding, input: string, limit: number = 20) => {
	const hash = hashText(input);
	const data = await redis.get(`embeddings:cache:${type}:${hash}`);
	if (data) return JSON.parse(data) as string[];

	const { embedding } = (await openai.embeddings.create({ model: 'text-embedding-ada-002', input })).data[0]!;

	const res = await redis.ft.search(`${type}-idx`, `*=>[KNN ${limit} @embedding $query_vector AS score]`, {
		PARAMS: { query_vector: Buffer.from(new Float32Array(embedding).buffer) },
		RETURN: ['id', 'score'],
		SORTBY: 'score',
		DIALECT: 2
	});

	let ids = res.documents.filter(d => Math.abs(d.value.score as number) < 0.5).map(d => (d.value.id as string).replace(`embeddings:${type}:`, ''));
	ids = [...new Set(ids)];

	// await redis.set(`embeddings:cache:${type}:${hash}`, JSON.stringify(ids), { EX: 60 * 5 });
	return ids;
};
