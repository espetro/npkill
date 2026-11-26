import { Subject, Observable } from 'rxjs';
import { FileService } from './files.service.js';
import { FileWorkerService } from './files.worker.service.js';
import { ScanOptions } from '../../index.js';
import { StreamService } from '../stream.service.js';
import { rm } from 'fs/promises';

export class WindowsFilesService extends FileService {
  constructor(
    private readonly streamService: StreamService,
    // Plain constructor parameter (no modifier): the field is inherited from
    // `FileService` and redeclaring it with a modifier is a scriptc blocker.
    fileWorkerService: FileWorkerService,
  ) {
    super(fileWorkerService);
  }

  // Non-async override (see UnixFilesService.delete): scriptc's native target
  // refuses async overrides of non-async methods; behavior is identical.
  delete(path: string): Promise<boolean> {
    return rm(path, { recursive: true, force: true }).then(() => true);
  }
}
