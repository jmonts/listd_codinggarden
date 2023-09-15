/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { test as baseTest } from '@playwright/test';

const istanbulCLIOutput = path.join(process.cwd(), '.nyc_output');

export function generateUUID(): string {
	return crypto.randomBytes(16).toString('hex');
}

// source: https://haseebmajid.dev/posts/2023-04-15--how-to-get-code-coverage-from-playwright-tests-in-a-sveltekit-app-/
export const test = baseTest.extend({
	context: async ({ context }, use) => {
		await context.addInitScript(() =>
			window.addEventListener('beforeunload', () =>
				(window as any).collectIstanbulCoverage(JSON.stringify((window as any).__coverage__))
			)
		);
		await fs.promises.mkdir(istanbulCLIOutput, { recursive: true });
		await context.exposeFunction('collectIstanbulCoverage', (coverageJSON: string) => {
			if (coverageJSON)
				fs.writeFileSync(
					path.join(istanbulCLIOutput, `playwright_coverage_${generateUUID()}.json`),
					coverageJSON
				);
		});
		await use(context);
		for (const page of context.pages()) {
			await page.evaluate(() =>
				(window as any).collectIstanbulCoverage(JSON.stringify((window as any).__coverage__))
			);
		}
	},
});

export const { expect } = test;