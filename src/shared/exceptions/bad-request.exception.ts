import { HttpException, HttpStatus } from '@nestjs/common';

export class BadRequestException extends HttpException {
  constructor(error) {
    super(error, HttpStatus.BAD_REQUEST);
  }
}
