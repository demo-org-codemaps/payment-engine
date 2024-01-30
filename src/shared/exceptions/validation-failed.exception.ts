import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export class ValidationFailedException extends BadRequestException {
  validationErrors: ValidationError[];

  constructor(validationErrors: ValidationError[]) {
    super(validationErrors);
    this.validationErrors = validationErrors;
  }
}
