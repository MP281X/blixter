import fs from 'fs';
import crypto from 'crypto';
import { OpenAI } from 'openai';

const env = typeof Bun !== 'undefined' ? Bun.env : process.env;

let openai: OpenAI;
if (env.OPEN_AI) openai = new OpenAI({ apiKey: env.OPEN_AI! });

export const hashText = (input: string) => {
	input = input.trim().toLowerCase();

	const hash = crypto.createHash('md5');
	hash.update(input);

	return hash.digest('hex');
};
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
        Given the following transcribed text from a video's audio, generate the title (max 2 words), 
        the description (max 100 words) and the category (max 1 word) for the video. Provide the output in a valid JSON
        object with three keys: "title", "description" and "category". The title and the description should be concise,
        focusing solely on the main topic of the video. Avoid explicitly mentioning that it's a video
        and exclude any reference to followers or additional information not provided in the
        transcribed text.

        The category of the video should be one of those "gaming", "vlogs", "food", "tecnology", "comedy", "education",
        "music", "animals", "sport", "entrateinment", "art", "language"
        The output should not contain any greetings, information about other videos, community 
        related content, news references, links to other videos and other things not related to the main
        topic of the video.`
			},
			{ role: 'user', content: text.toString() }
		]
	});

	let output = { title: 'err', description: 'err', category: 'err' };
	try {
		output = JSON.parse(res.choices[0]?.message.content!) as { title: string; description: string; category: string };
	} catch (e) {
		console.log('invalid json output');
	}
	return output;
};
