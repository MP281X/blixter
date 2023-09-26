import type EventEmitter from 'events';
import type { RedisClientType } from 'redis';

export const sseHandler = <T extends Record<string, unknown>>(
	channel: string,
	auth?: (arg0: { channelId: string; userData: { username: string; id: string } }) => boolean
) => {
	// create a new eventEmitter
	let msgEmitter: EventEmitter;
	let redis: RedisClientType;

	// connect to redis if not already connected
	const initRedis = async () => {
		if (!redis) {
			const env = typeof Bun !== 'undefined' ? Bun.env : process.env;
			const { createClient } = await import('redis');
			redis = createClient({ url: env.REDIS_URL! });
			await redis.connect();
		}
	};

	// add a message to the pub/sub
	const send = async (channelId: string, input: T) => {
		await initRedis();
		await redis.publish(`${channel}:${channelId}`, JSON.stringify(input));
	};

	// listen for new message
	const listen = (channelId: string, onMsg: (msg: T) => void | Promise<void>) => {
		const eventSource = new EventSource(`/sse/${channel}-${channelId}`);

		eventSource.addEventListener('message', async event => {
			try {
				const data = JSON.parse(event.data);
				await onMsg(data);
			} catch {}
		});
	};

	// initialize the redis pub/sub listener
	const initHandler = async () => {
		await initRedis();

		const { EventEmitter } = await import('events');
		msgEmitter = new EventEmitter();

		const subscriber = redis.duplicate();
		await subscriber.connect();

		// subscribe to the pub-sub
		await subscriber.pSubscribe(channel, (message: string, ch: string) => {
			// check if there is a user subscribed to the channel
			if (msgEmitter.listenerCount(ch) > 0) {
				// emit the message to the listener of the channel
				msgEmitter.emit(ch, message);
			}
		});
	};

	// send a message when there is an event in the EventEmitter
	const handler = ({ params, locals }: { locals: { user: { username: string; id: string } }; params: { id: string | undefined } }) => {
		const channelId = params.id;
		if (!channelId) throw new Error('this channel needs an id');

		if (auth && !auth({ channelId, userData: locals.user })) throw new Error('unauthorized');

		// create a variable for the arrow function (used in the removeListener)
		let listener: (msg: string) => void;

		// create a new text encoder and send a message to the client
		const encoder = new TextEncoder();

		// create the redableStream
		const stream = new ReadableStream({
			async start(controller) {
				// encode the input and send a message to a client
				const sendMsg = (msg: string) => controller.enqueue(encoder.encode('data: ' + msg + '\n' + '\n'));

				// listen to new message and send them to a client
				listener = msg => sendMsg(msg);
				msgEmitter.addListener(channelId, listener);
			},
			cancel() {
				// remove the listener
				msgEmitter.removeListener(channelId, listener);
			}
		});

		// return the message stream and set the headers
		return new Response(stream, {
			headers: { 'Content-Type': 'text/event-stream', 'Connection': 'keep-alive', 'Cache-Control': 'no-cache' }
		});
	};

	return { send, listen, initHandler, handler };
};
