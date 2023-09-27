import * as crons from './src/index.g.ts';
import type { Cron } from './src/types.d.ts';

const scheduleJobs = async (name: string, cron: Cron, task: () => Promise<void> | void) =>
	setInterval(async () => {
		const [h, min, day_month, month, day_week] = cron.split(' ') as [string, string, string, string, string];
		const time = new Date();

		if (
			(min === '*' || parseInt(min) === time.getMinutes()) &&
			(h === '*' || parseInt(h) === time.getHours()) &&
			(day_month === '*' || parseInt(day_month) === time.getDate()) &&
			(month === '*' || parseInt(month) === time.getMonth() + 1) &&
			(day_week === '*' || parseInt(day_week) === time.getDay())
		)
			try {
				console.log(`running '${name}'`);
				await task();
				console.log(`finished '${name}'`);
			} catch (e) {
				console.error(`error: '${name}'`);
			}
	}, 60 * 1000);

Object.entries(crons).forEach(async ([cronName, cronHandler]) => {
	console.log(`loaded '${cronName}'`);
	scheduleJobs(cronName, cronHandler.cron, cronHandler.default);
});
