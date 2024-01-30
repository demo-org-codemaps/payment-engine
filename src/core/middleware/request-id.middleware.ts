import { Request, Response } from 'express';
import { CONSTANTS } from '../../app.constants';
import { v4 as uuidv4, validate } from 'uuid';

export const RequestIdMiddleware = (request: Request, response: Response, next: () => void): void => {
  /** set request id, if not being set yet */
  if (!request.headers[CONSTANTS.HEADERS.X_REQUEST_ID] || !validate(request.header(CONSTANTS.HEADERS.X_REQUEST_ID))) {
    request.headers[CONSTANTS.HEADERS.X_REQUEST_ID] = uuidv4();
  }

  /** set requestId in response headers */
  response.setHeader(CONSTANTS.HEADERS.X_REQUEST_ID, request.headers[CONSTANTS.HEADERS.X_REQUEST_ID]);
  next();
};
