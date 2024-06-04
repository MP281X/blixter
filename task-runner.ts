import fs from 'fs';
console.clear();

// custom logger
const log = async (title: string, input: string | Uint8Array | ReadableStream<Uint8Array>, color: number = 91) => {
	title = title.replaceAll('\n', ' ');
	if (title.length < 20) title += ' '.repeat(20 - title.length);

	const read = (msg: string | Uint8Array) => {
		if (typeof msg !== 'string') msg = new TextDecoder().decode(msg);

		msg.split('\n').forEach(txt => {
			txt = txt.replaceAll('➜', '').trim();
			if (txt === '') return;
			if (txt.includes('VITE') || txt.includes('use --host to expose') || txt.includes('✨')) return;
			if (txt.includes('./.svelte-kit/tsconfig.json') || txt.includes('╵') || txt.includes('tsconfig.json:2:12:')) return;
			if (txt.includes('NOTICE:') || txt.includes('DETAIL:') || txt.includes('drop cascade')) return;
			if (txt.includes('bun build') || txt.includes('vite build')) return;

			if (color === 91 && Bun.argv[2]! !== 'dev') {
				console.error(`\x1b[${color}m${title} ➜ \x1b[0m${txt}`);
				process.exit(1);
			}

			console.log(`\x1b[${color}m${title} ➜ \x1b[0m${txt}`);
		});
	};

	if (typeof input === 'string' || input instanceof Uint8Array) return read(input);

	for await (const chunk of input) read(chunk);
};

// exec a command
type ExecCmdType = {
	title: string;
	cmd: string | string[];
	color?: number;
	cwd?: string;
	sync?: boolean;
};
let colorCounter = 92;
const execCmd = async ({ title, color, cmd, sync, cwd }: ExecCmdType) => {
	if (typeof cmd === 'string') cmd = cmd.split(' ');
	if (!color) {
		color = colorCounter;
		colorCounter += 1;
		if (colorCounter >= 96) colorCounter = 92;
	}

	if (sync) {
		const output = Bun.spawnSync(cmd, {
			cwd: cwd ?? '.',
			env: {
				...Bun.env,
				NODE_ENV: Bun.argv[2]! === 'build' ? 'production' : 'development'
			}
		});
		return await Promise.all([log(title, output.stdout, color), log(title, output.stderr)]);
	}

	const output = Bun.spawn(cmd, {
		cwd: cwd ?? '.',
		stderr: 'pipe',
		env: {
			...Bun.env,
			NODE_ENV: Bun.argv[2]! === 'build' ? 'production' : 'development'
		}
	});

	return Promise.all([log(title, output.stdout, color), log(title, output.stderr)]);
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
			if (['build', 'dist', '.cache', '.svelte-kit'].includes(file) || file.includes('.g.ts')) {
				fs.rmSync(`${dir}/${file}`, { recursive: true, force: true });

				log(`delete:${dir.replace('./packages/', '').replace('./apps/', '').replace('/src', '')}`, file, 95);
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

		if (Bun.argv[2]! === 'dev')
			execCmd({
				title: `codegen:${name}`,
				cmd: ['bun', 'x', 'nodemon', '--config', '../../nodemon.json', ...codegen.map(x => ['--watch', x]).flat(1)],
				color: 90,
				cwd
			});
	}

	if (script === 'lint') {
		if (scripts.includes(script))
			await execCmd({
				title: `lint:${project.name}`,
				cmd: `bun run --silent ${script}`,
				cwd: project.cwd,
				sync: true
			});

		await execCmd({
			title: `tsc:${project.name}`,
			cmd: 'bun x tsc --noEmit',
			cwd: project.cwd,
			sync: true
		});

		return;
	}

	if (scripts.includes(script))
		return execCmd({
			title: `${name}:${script}`,
			cmd: `bun run --silent ${script}`,
			cwd
		});

	return;
};

// run the scripts
const projects = await findProjects();
const prettier_args = '--plugin prettier-plugin-svelte . --log-level error --ignore-path .gitignore';
await execCmd({
	title: 'lint',
	cmd: `bun x prettier ${prettier_args}  --${['build', 'preview', 'test'].includes(Bun.argv[2]!) ? 'check' : 'write'} .`,
	sync: true
});

// run the codegen script
for (const project of projects) await runScript(project, 'codegen');

// check types
if (['reset', 'build', 'preview'].includes(Bun.argv[2]!)) {
	for (const project of projects) {
		if (project.name === 'scripts') continue;
		runScript(project, 'lint');
	}
}

// run the scripts
for (const project of projects) runScript(project, Bun.argv[2]!);

if (Bun.argv[2] === 'test') {
	Bun.spawn(['bun', '--silent', 'test', Bun.argv[4] ?? ''], { stdout: 'inherit', stderr: 'inherit', cwd: Bun.argv[3] ?? process.cwd() });
}
