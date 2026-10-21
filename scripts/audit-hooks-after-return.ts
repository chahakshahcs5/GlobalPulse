/**
 * The audit's command line.
 *
 * The rule itself lives in `hooks-after-early-return.ts`, so that the test
 * suite can run it over the repository and fail when it finds something.
 */
import { describeFindings, findHooksAfterEarlyReturn } from './hooks-after-early-return';

const findings = findHooksAfterEarlyReturn();

for (const line of describeFindings(findings)) {
  console.log(line);
}

console.log(
  findings.length === 0
    ? 'No hook follows an early return.'
    : `${findings.length} hook(s) follow an early return.`
);

process.exitCode = findings.length === 0 ? 0 : 1;
