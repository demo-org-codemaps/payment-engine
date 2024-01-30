import { HttpException } from '@nestjs/common';
import { ApiErrorDto } from '../dtos';

export class ApiException extends HttpException {
  key: string;
  args: Record<string, any>;

  errors: ApiErrorDto[] = [];

  constructor(httpStatus: number, key: string, args?: Record<string, any>) {
    super(key, httpStatus);
    this.key = key;
    this.args = args;
  }

  public addError(error: ApiErrorDto) {
    this.errors.push(error);
  }
}
