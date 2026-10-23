import { describe, it, expect } from 'vitest';
import {
  findHooksAfterEarlyReturnIn,
  findHooksAfterEarlyReturn,
  describeFindings,
} from '../../../scripts/hooks-after-early-return';

/**
 * No hook may follow an early return.
 *
 * A component that returns early and then calls a hook has a different
 * number of hooks depending on which branch it took, and React crashes it
 * the moment the branch changes. The crash names neither the component nor
 * the hook, so the guard is worth having.
 */
describe('Hooks after an early return', () => {
  it('finds a hook that follows an early return', () => {
    const source = `
      export function Drawer({ isOpen }: { isOpen: boolean }) {
        const [title, setTitle] = useState('');
        if (!isOpen) return null;
        useEffect(() => {
          setTitle('loaded');
        }, []);
        return <div>{title}</div>;
      }
    `;

    const findings = findHooksAfterEarlyReturnIn(source, 'Drawer.tsx');

    expect(findings).toHaveLength(1);
    expect(findings[0].hook).toBe('useEffect');
  });

  it('finds a hook that follows a braced early return', () => {
    const source = `
      export function Drawer({ isOpen }: { isOpen: boolean }) {
        const [title, setTitle] = useState('');
        if (!isOpen) {
          return null;
        }
        useEffect(() => {}, []);
        return <div>{title}</div>;
      }
    `;

    expect(findingsOf(source)).toHaveLength(1);
  });

  it('leaves a hook that comes before the early return alone', () => {
    const source = `
      export function Drawer({ isOpen }: { isOpen: boolean }) {
        const [title, setTitle] = useState('');
        useEffect(() => {}, []);
        if (!isOpen) return null;
        return <div>{title}</div>;
      }
    `;

    expect(findingsOf(source)).toHaveLength(0);
  });

  it('leaves a hook in a nested function alone', () => {
    const source = `
      export function Drawer({ isOpen }: { isOpen: boolean }) {
        if (!isOpen) return null;
        const inner = () => {
          useEffect(() => {}, []);
          return null;
        };
        return <div onClick={inner} />;
      }
    `;

    expect(findingsOf(source)).toHaveLength(0);
  });

  it('leaves a return inside a loop alone', () => {
    const source = `
      export function Drawer({ items }: { items: string[] }) {
        for (const item of items) {
          if (!item) return null;
        }
        const [title, setTitle] = useState('');
        return <div>{title}</div>;
      }
    `;

    expect(findingsOf(source)).toHaveLength(0);
  });

  it('finds nothing in the repository', () => {
    const findings = findHooksAfterEarlyReturn();

    expect(describeFindings(findings)).toEqual([]);
  }, 15000);
});

function findingsOf(source: string) {
  return findHooksAfterEarlyReturnIn(source, 'Fixture.tsx');
}
