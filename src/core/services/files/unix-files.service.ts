import { execFile } from 'child_process';

import { FileService } from './files.service.js';
import { StreamService } from '../stream.service.js';
import { FileWorkerService } from './files.worker.service.js';

export class UnixFilesService extends FileService {
  constructor(
    protected streamService: StreamService,
    // Plain constructor parameter (no modifier): the field is inherited from
    // `FileService` and redeclaring it with a modifier is a scriptc blocker.
    fileWorkerService: FileWorkerService,
  ) {
    super(fileWorkerService);
  }

  // Non-async override (the base declares `Promise<boolean>` without async):
  // scriptc's native target refuses async overrides of non-async methods
  // (static vtable dispatch has no fiber-spawn story). The body already
  // returns a promise, so this is behavior-identical.
  delete(path: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      execFile('rm', ['-rf', '--', path], (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      });
    });
  }
}
