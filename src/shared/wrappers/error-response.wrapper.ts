import { ErrorResponseDto } from '../dtos';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnAuthorizedException,
} from '../exceptions';

export const constructErrorResponse = async data => {
  const status = data.status ? data.status : data.statusCode;
  const errorMessage = data.response ? data.response : null;
  const response: ErrorResponseDto = {
    code: status,
    message: 'Something went wrong. Please try again later.',
    error: errorMessage,
  };

  switch (status) {
    case 401:
      throw new UnAuthorizedException(response);
    case 404:
      throw new NotFoundException(response);
    case 400:
      throw new BadRequestException(response);
    default:
      throw new InternalServerErrorException(response);
  }
};
