import fs from 'fs';
import process from 'process';
import chokidar from 'chokidar';

// custom logger
const log = async (title: string, input: string | Uint8Array | ReadableStream<Uint8Array>, color: number) => {
	title = title.replaceAll('\n', ' ');
	if (title.length < 16) title += ' '.repeat(16 - title.length);

	const read = (msg: string | Uint8Array) => {
		if (typeof msg !== 'string') msg = new TextDecoder().decode(msg);

		msg.split('\n').forEach((txt) => {
			txt = txt.trim();
			if (txt.trim() === '') return;
			if (txt.includes('] ".env"')) return;

			console.log(`\x1b[${color}m${title} -> \x1b[0m${txt}`);
		});
	};

	if (typeof input === 'string' || input instanceof Uint8Array) return read(input);

	for await (const chunk of input) read(chunk);
};

// exec a command
type ExecCmdType = {
	title: string;
	cmd: string;
	color: number;
	cwd?: string;
	sync?: boolean;
};
const execCmd = async ({ title, color, cmd, sync, cwd }: ExecCmdType) => {
	const command = cmd.split(' ');

	if (sync) {
		const output = Bun.spawnSync(command, { cwd: cwd ?? '.' });
		return await Promise.all([log(title, output.stdout, color), log(title, output.stderr, 91)]);
	}

	const output = Bun.spawn(command, {
		cwd: cwd ?? '.',
		stderr: 'pipe',
		onExit: () => log('exit', title, 91)
	});

	return Promise.all([log(title, output.stdout, color), log(title, output.stderr, 91)]);
};

// find every project (apps and packages) in the current folder and create and array with those info
type ProjectsType = {
	name: string;
	cwd: string;
	priority: number;
	codegen: string[] | undefined;
	scripts: string[];
};
const findProjects = async (dir: string = '.') => {
	const projects: ProjectsType[] = [];

	const files = fs.readdirSync(`${dir}/`);

	for (const file of files) {
		try {
			if (['build'].includes(file) || file.includes('.g.ts')) {
				fs.rmSync(`${dir}/${file}`, { recursive: true, force: true });

				log('delete', file, 91);
				continue;
			}
		} catch (_) {}

		if (fs.statSync(`${dir}/${file}`).isDirectory()) {
			if (['.git', '.github', 'node_modules', 'k8s'].includes(file)) continue;

			projects.push(...(await findProjects(`${dir}/${file}`)));
		}

		if (file !== 'package.json' || dir === '.') continue;

		const { scripts, codegen } = (await import(`${dir}/package.json`)).default;

		projects.push({
			codegen,
			cwd: dir,
			priority: dir.includes('packages') ? 0 : 1,
			name: dir.split('/').pop()!,
			scripts: Object.keys(scripts ?? {})
		});
	}

	return projects.sort((a, b) => a.priority - b.priority);
};

// run a script
const runScript = async (project: ProjectsType, script: 'codegen' | (string & {})) => {
	const { name, cwd, scripts, codegen } = project;

	if (script === 'codegen' && codegen) {
		await execCmd({
			title: `codegen:${name}`,
			cmd: 'bun codegen.ts',
			sync: true,
			color: 90,
			cwd
		});

		if (process.argv[2]! === 'dev')
			chokidar
				.watch(codegen, {
					persistent: true,
					ignorePermissionErrors: true,
					cwd: cwd,
					ignored: /node_modules/,
					ignoreInitial: true,
					awaitWriteFinish: {
						stabilityThreshold: 500,
						pollInterval: 100
					}
				})
				.on('all', (_) => {
					execCmd({
						title: `codegen:${name}`,
						cmd: 'bun codegen.ts',
						sync: true,
						color: 90,
						cwd
					});
				});
	}

	if (scripts.includes(script))
		return execCmd({
			title: `${name}:${script}`,
			cmd: `bun run --silent ${script}`,
			color: 94,
			cwd
		});

	return;
};

// run the scripts
const projects = await findProjects();
await execCmd({
	title: 'lint',
	cmd: 'bun x prettier --log-level error --ignore-path .gitignore --write .',
	color: 93,
	sync: true
});

// run the codegen script
for (const project of projects) await runScript(project, 'codegen');

// check types
for (const project of projects)
	await execCmd({
		title: 'lint',
		cmd: 'bun x tsc',
		color: 93,
		cwd: project.cwd,
		sync: true
	});

// run the scripts
for (const project of projects) runScript(project, process.argv[2]!);
