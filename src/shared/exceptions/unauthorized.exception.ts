import { HttpException, HttpStatus } from '@nestjs/common';

export class UnAuthorizedException extends HttpException {
  constructor(error) {
    super(error, HttpStatus.UNAUTHORIZED);
  }
}
