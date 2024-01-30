import { HttpStatus } from '@nestjs/common';
import { Observable, throwError, timer, retry, timeout } from 'rxjs';

export const genericRetryStrategy =
  ({
    maxRetryAttempts = 3,
    timeoutDuration = 30 * 1000,
    excludedStatusCodes = [HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND],
  }: {
    maxRetryAttempts?: number;
    timeoutDuration?: number;
    excludedStatusCodes?: number[];
  } = {}) =>
  (obs: Observable<any>) => {
    return obs.pipe(
      timeout(timeoutDuration),
      retry({
        count: maxRetryAttempts,
        // backoff starting at 2 seconds, exponentially up to 1 minute.
        // retryCount starts a 1.
        delay: (err, retryCount) => {
          // if (err instanceof TimeoutError) return throwError(() => err); // throw timeout error as it is
          if (excludedStatusCodes.find(e => e === err.response?.status)) {
            return throwError(() => err);
          }
          const delay = Math.min(60000, 1000 * 2 ** retryCount);
          console.log(`Attempt ${retryCount}: retrying in ${delay}ms`);
          return timer(delay);
        },
      })
    );
  };
