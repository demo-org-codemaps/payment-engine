import { HttpException, HttpStatus } from '@nestjs/common';

export class InternalServerErrorException extends HttpException {
  constructor(error) {
    super(error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
