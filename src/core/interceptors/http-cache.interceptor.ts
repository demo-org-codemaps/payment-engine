import {
  CacheInterceptor,
  CACHE_KEY_METADATA,
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  private logger = new Logger(HttpCacheInterceptor.name);

  trackBy(context: ExecutionContext): string | undefined {
    return this.reflector.get(CACHE_KEY_METADATA, context.getHandler());
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const key = this.trackBy(context);

    if (!key) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { httpAdapter } = this.httpAdapterHost;

    const isGetRequest = httpAdapter.getRequestMethod(request) === 'GET';

    if (!isGetRequest) {
      await this.cacheManager.del(key);
      return next.handle();
    }

    try {
      const value = await this.cacheManager.get(key);
      if (value) {
        this.logger.log(`Fetching ${key} from Redis cache`);
        return of(value);
      }
      return next.handle().pipe(
        tap(response => {
          const args = [key, response];
          this.cacheManager.set(...args);
        })
      );
    } catch {
      return next.handle();
    }
  }
}
