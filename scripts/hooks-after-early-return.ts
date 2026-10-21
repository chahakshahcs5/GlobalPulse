/**
 * Find hooks that come after an early return.
 *
 * A component that returns early — `if (!isOpen) return null` — and then
 * calls a hook below that return has a different number of hooks depending
 * on which branch it took. React insists that number never changes, and
 * crashes the component the moment the branch changes.
 *
 * The crash reads as "Rendered more hooks than during the previous render",
 * which is a long way from the thing that actually caused it.
 *
 * This is parsed with the TypeScript compiler rather than with a pattern,
 * because the question is not "is there a `return null` above this hook" but
 * "is this hook in the same function as that return, and does the function
 * reach the hook only when it does not return first".
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import ts from 'typescript';

const ROOTS = [
  'apps/web/src',
  'apps/block-studio/src',
  'libs/blocks-ui/src',
  'libs/block-studio/src',
];

const HOOK_NAMES = new Set([
  'useState',
  'useEffect',
  'useMemo',
  'useCallback',
  'useRef',
  'useReducer',
  'useLayoutEffect',
  'useInsertionEffect',
  'useImperativeHandle',
  'useDebugValue',
  'useTransition',
  'useId',
  'useDeferredValue',
  'useSyncExternalStore',
  'useContext',
]);

export interface HookFinding {
  file: string;
  line: number;
  hook: string;
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else if (full.endsWith('.tsx')) {
      // Components live in `.tsx` files, and a hook cannot be called from a
      // plain `.ts` module without being inside a component.
      files.push(full);
    }
  }
  return files;
}

/** The name of the hook a call expression invokes, if it invokes one. */
function hookNameOf(expression: ts.Expression): string | null {
  if (!ts.isCallExpression(expression)) return null;
  const callee = expression.expression;
  const name = ts.isIdentifier(callee)
    ? callee.text
    : ts.isPropertyAccessExpression(callee)
      ? callee.name.text
      : null;
  if (!name) return null;
  return HOOK_NAMES.has(name) ? name : null;
}

/**
 * Whether a statement is an early return — a return that the function
 * reaches only in some circumstances.
 *
 * It has to be the whole body of an `if`, and that `if` has to be a
 * statement of the function itself rather than of something nested inside
 * it. A return inside a loop or a nested `if` is a different thing.
 */
function earlyReturnOf(statement: ts.Statement): boolean {
  if (!ts.isIfStatement(statement)) return false;

  const then = statement.thenStatement;
  if (ts.isReturnStatement(then)) return true;
  if (ts.isBlock(then)) {
    return then.statements.length === 1 && ts.isReturnStatement(then.statements[0]);
  }
  return false;
}

/** The hooks in one file that follow an early return of the same function. */
export function findHooksAfterEarlyReturnIn(source: string, file: string): HookFinding[] {
  const parsed = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ false,
    ts.ScriptKind.TSX
  );

  const findings: HookFinding[] = [];

  const visit = (node: ts.Node): void => {
    if (
      (ts.isFunctionDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node) ||
        ts.isMethodDeclaration(node)) &&
      node.body &&
      ts.isBlock(node.body)
    ) {
      const body = node.body;

      // The line of the first early return in this function's own body.
      let earlyReturnLine = -1;

      for (const statement of body.statements) {
        if (earlyReturnLine === -1 && earlyReturnOf(statement)) {
          earlyReturnLine =
            parsed.getLineAndCharacterOfPosition(statement.getStart(parsed)).line + 1;
          continue;
        }

        if (earlyReturnLine === -1) continue;

        // Any hook that the function reaches on its way past the return.
        const walkStatement = (child: ts.Node): void => {
          // A nested function is its own scope.
          if (
            ts.isFunctionDeclaration(child) ||
            ts.isFunctionExpression(child) ||
            ts.isArrowFunction(child) ||
            ts.isMethodDeclaration(child)
          ) {
            return;
          }
          const name = hookNameOf(child as ts.Expression);
          if (name) {
            const line = parsed.getLineAndCharacterOfPosition(child.getStart(parsed)).line + 1;
            if (line > earlyReturnLine) {
              findings.push({ file, line, hook: name });
            }
          }
          ts.forEachChild(child, walkStatement);
        };
        ts.forEachChild(statement, walkStatement);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(parsed);
  return findings;
}

/** Every hook in the repository that follows an early return. */
export function findHooksAfterEarlyReturn(roots: string[] = ROOTS): HookFinding[] {
  const all: HookFinding[] = [];
  for (const root of roots) {
    for (const file of walk(root)) {
      all.push(...findHooksAfterEarlyReturnIn(readFileSync(file, 'utf8'), file));
    }
  }
  return all;
}

/** The findings as lines, ready to print. */
export function describeFindings(findings: HookFinding[], cwd: string = process.cwd()): string[] {
  return findings.map(
    (finding) => `${relative(cwd, finding.file)}:${finding.line}  ${finding.hook}`
  );
}
