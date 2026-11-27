import { jest } from '@jest/globals';
import { BaseUi } from '../../../src/cli/ui/base.ui.js';

class SizedUi extends BaseUi {
  render(): void {}
  size(): { columns: number; rows: number } {
    return this.terminal;
  }
}

describe('BaseUi terminal size', () => {
  const original = {
    columns: Object.getOwnPropertyDescriptor(process.stdout, 'columns'),
    rows: Object.getOwnPropertyDescriptor(process.stdout, 'rows'),
  };

  const setSize = (columns?: number, rows?: number): void => {
    Object.defineProperty(process.stdout, 'columns', {
      value: columns,
      configurable: true,
    });
    Object.defineProperty(process.stdout, 'rows', {
      value: rows,
      configurable: true,
    });
  };

  afterEach(() => {
    for (const [name, descriptor] of Object.entries(original)) {
      if (descriptor) {
        Object.defineProperty(process.stdout, name, descriptor);
      } else {
        delete (process.stdout as unknown as Record<string, unknown>)[name];
      }
    }
    jest.restoreAllMocks();
  });

  it('reports the size of the terminal', () => {
    setSize(120, 40);

    expect(new SizedUi().size()).toEqual({ columns: 120, rows: 40 });
  });

  it('falls back to 80x24 when stdout is not a terminal', () => {
    setSize(undefined, undefined);

    expect(new SizedUi().size()).toEqual({ columns: 80, rows: 24 });
  });
});
