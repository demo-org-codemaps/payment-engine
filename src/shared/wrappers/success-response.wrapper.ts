import { SuccessResponseDto } from '../dtos';

export const constructSuccessResponse = data => {
  const response: SuccessResponseDto = {
    code: 'OK',
    message: 'Operation completed successfully.',
    data,
  };

  return response;
};
