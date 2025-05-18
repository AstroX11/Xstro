import { spawn } from 'node:child_process';
import ora from 'ora';

const processes = {
	client: './src/messaging/client.ts',
	pairing: './src/messaging/paircode.ts',
};

const env = {
	...process.env,
	NODE_NO_WARNINGS: '1',
	TS_NODE_TRANSPILE_ONLY: 'true',
};

const { info, fail } = ora();

function runProc(scriptPath) {
	return new Promise(resolve => {
		const proc = spawn('node', ['--import=tsx/esm', scriptPath], {
			stdio: 'inherit',
			env,
		});

		proc.on('close', code => resolve(code ?? 0));
		proc.on('error', err => {
			fail(err.message);
			resolve(1);
		});
	});
}

async function run() {
	try {
		const p1 = await runProc(processes.pairing);
		if (p1 === 0) {
			info('Restarting...');
			setTimeout(run, 1000);
			return;
		}

		const p2 = await runProc(processes.client);
		if (p2 === 0) {
			info('Restarting...');
			setTimeout(run, 1000);
		} else {
			fail('Exit...');
			process.exit(p2);
		}
	} catch (err) {
		fail(err instanceof Error ? err.message : String(err));
		process.exit(1);
	}
}

run();
