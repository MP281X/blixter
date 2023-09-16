import type EventEmitter from 'events';
import type { RedisClientType } from 'redis';

export const sseHandler = <T extends Record<string, unknown>>(
	channel: T extends { id: string } ? `${string}:id` : `${string}:*`,
	auth?: (locals: Record<string, unknown>, ...args: T extends { id: string } ? [id: string] : []) => boolean
) => {
	// create a new eventEmitter
	let msgEmitter: EventEmitter;
	let redis: RedisClientType;

	if (process.env.NODE_ENV !== 'production') {
		if (channel.endsWith(':id')) channel = `${channel.slice(0, -3)}_dev:id` as any;
		else channel = `${channel.slice(0, -2)}_dev:*` as any;
	}

	// connect to redis if not already connected
	const initRedis = async () => {
		if (!redis) {
			const { createClient } = await import('redis');
			console.log(process.env.REDIS_URL);
			const url = !process.env.REDIS_URL || process.env.REDIS_URL === '' ? Bun.env.REDIS_URL! : process.env.REDIS_URL;
			redis = createClient({ url });
			await redis.connect();
		}
	};

	// add a message to the pub/sub
	const send = async (input: T) => {
		await initRedis();

		if (!input.id) {
			await redis.publish(channel.slice(0, -2), JSON.stringify(input));
		} else {
			const channelId = input.id;
			delete (input as any)['id'];
			await redis.publish(`${channel.slice(0, -3)}:${channelId}`, JSON.stringify(input));
		}
	};

	// listen for new message
	const listen = (onMsg: (msg: T) => void | Promise<void>, ...args: T extends { id: string } ? [id: string] : []) => {
		let eventSource: EventSource;
		if (channel.endsWith(':id')) eventSource = new EventSource(`/sse/${channel.slice(0, -3)}-${(args as [string])[0]}`);
		else eventSource = new EventSource(`/sse/${channel.slice(0, -2)}`);

		eventSource.addEventListener('message', async (event) => {
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
		const channelName = channel.endsWith(':id') ? `${channel.slice(0, -3)}:*` : channel.slice(0, -2);
		await subscriber.pSubscribe(channelName, (message: string, ch: string) => {
			// check if there is a user subscribed to the channel
			if (msgEmitter.listenerCount(ch) > 0) {
				// emit the message to the listener of the channel
				msgEmitter.emit(ch, message);
			}
		});
	};

	// send a message when there is an event in the EventEmitter
	const handler = ({ params, locals }: { locals: { user: Record<string, unknown> }; params: { id: string | undefined } }) => {
		let channelId: string;
		if (channel.endsWith(':*')) {
			channelId = channel.slice(0, -2);
			if (auth && !(auth as any)(locals)) throw new Error('unauthorized');
		} else {
			if (!params.id) throw new Error('this channel needs an id');
			channelId = `${channel.slice(0, -3)}:${params.id}`;

			if (auth && !(auth as any)(locals, params.id)) throw new Error('unauthorized');
		}

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
				listener = (msg) => sendMsg(msg);
				msgEmitter.addListener(channelId, listener);
			},
			cancel() {
				// remove the listener
				msgEmitter.removeListener(channelId, listener);
			}
		});

		// return the message stream and set the headers
		return new Response(stream, {
			headers: { 'Content-Type': 'text/event-stream', Connection: 'keep-alive', 'Cache-Control': 'no-cache' }
		});
	};

	return { send, listen, initHandler, handler };
};
