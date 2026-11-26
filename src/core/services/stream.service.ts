import { ChildProcessWithoutNullStreams } from 'child_process';
import { Observable } from 'rxjs';

/**
 * Service for converting child process streams into RxJS observables.
 * Handles the conversion of stdout/stderr streams to reactive streams
 * for better integration with the application's reactive architecture.
 */
export class StreamService {
  streamToObservable<T>(stream: ChildProcessWithoutNullStreams): Observable<T> {
    const { stdout, stderr } = stream;

    return new Observable<T>((observer) => {
      const dataHandler = (data): void => observer.next(data);
      const bashErrorHandler = (error): void =>
        observer.error({ ...error, bash: true });
      const errorHandler = (error): void => observer.error(error);
      const endHandler = (): void => observer.complete();

      stdout.addListener('data', dataHandler);
      stdout.addListener('error', errorHandler);
      stdout.addListener('end', endHandler);

      stderr.addListener('data', bashErrorHandler);
      stderr.addListener('error', errorHandler);

      return () => {
        stdout.removeListener('data', dataHandler);
        stdout.removeListener('error', errorHandler);
        stdout.removeListener('end', endHandler);

        stderr.removeListener('data', bashErrorHandler);
        stderr.removeListener('error', errorHandler);
      };
    });
  }

  getStream<T>(child: ChildProcessWithoutNullStreams): Observable<T> {
    // Literal encoding spellings only: scriptc lowers `setEncoding` for
    // literals, not for a `BufferEncoding`-typed variable (SC2020).
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    return this.streamToObservable<T>(child);
  }
}
