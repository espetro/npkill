import ansiEscapes from 'ansi-escapes';
import { Position, BaseUi, HeavyUi } from '../ui/index.js';

/**
 * Minimal structural view of the stdin stream this service uses.
 *
 * Declared locally so the class stays compilable by scriptc for its native
 * (ELF) output target: `NodeJS.ReadStream` is part of @types/node but has no
 * static lowering in scriptc yet, which cascaded a build blocker onto every
 * `uiService.*` call site. `process.stdin` satisfies this shape.
 */
export interface RawStdin {
  // `boolean | undefined`: Node (and scriptc's runtime) leave `isTTY`
  // undefined when stdin is not attached to a terminal.
  isTTY: boolean | undefined;
  // Optional: `process.stdin.setRawMode` only exists on TTY streams (both in
  // Node and in scriptc's runtime); npkill only calls it behind the `isTTY`
  // guard.
  setRawMode?(mode: boolean): unknown;
  /**
   * Event registration. npkill only registers `'keypress'` listeners, with
   * the two-argument listener shape below; keeping the listener type concrete
   * (instead of variadic `(...args: any[])`) keeps the call site statically
   * lowerable by scriptc's native target.
   */
  on(
    eventName: string,
    listener: (name: unknown, key: RawKeyPress) => void,
  ): unknown;
  resume(): void;
}

/** Structural subset of the keypress event object npkill reads. */
export interface RawKeyPress {
  name: string;
  sequence: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
}

export class UiService {
  stdin: RawStdin = process.stdin;
  // public stdout: NodeJS.WriteStream = process.stdout;
  uiComponents: BaseUi[] = [];

  setRawMode(set = true): void {
    if (this.stdin.isTTY) {
      this.stdin.setRawMode?.(set);
    }
    process.stdin.resume();
  }

  setCursorVisible(visible: boolean): void {
    const instruction = visible
      ? ansiEscapes.cursorShow
      : ansiEscapes.cursorHide;
    this.print(instruction);
  }

  add(component: BaseUi): void {
    this.uiComponents.push(component);
  }

  remove(baseUiId: string): void {
    this.uiComponents = this.uiComponents.filter((c) => c.id !== baseUiId);
  }

  renderAll(): void {
    this.clear();
    this.uiComponents.forEach((component) => {
      if (component.visible) {
        component.render();
      }
    });
  }

  setFreezeAll(freeze: boolean): void {
    this.uiComponents.forEach((component) => {
      component.freezed = freeze;
    });
  }

  setVisibleAll(visible: boolean): void {
    this.uiComponents.forEach((component) => {
      component.setVisible(visible);
    });
  }

  clear(): void {
    this.print(ansiEscapes.clearTerminal);
    this.resetHeavyUiBuffers();
  }

  private resetHeavyUiBuffers(): void {
    this.uiComponents.forEach((component) => {
      if (component instanceof HeavyUi) {
        component.resetBufferState();
      }
    });
  }

  print(text: string): void {
    process.stdout.write.bind(process.stdout)(text);
  }

  printAt(message: string, position: Position): void {
    this.setCursorAt(position);
    this.print(message);
  }

  setCursorAt({ x, y }: Position): void {
    this.print(ansiEscapes.cursorTo(x, y));
  }

  clearLine(row: number): void {
    this.printAt(ansiEscapes.eraseLine, { x: 0, y: row });
  }
}
