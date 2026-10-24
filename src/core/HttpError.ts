import { HttpStatus, ResponseCode, ResponseMessage } from './http.js';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static badRequest(details?: unknown): HttpError {
    return new HttpError(HttpStatus.BAD_REQUEST, ResponseCode.E_400, ResponseMessage.BAD_REQUEST, details);
  }
  static unauthorized(): HttpError {
    return new HttpError(HttpStatus.UNAUTHORIZED, ResponseCode.E_401, ResponseMessage.UNAUTHORIZED);
  }
  static invalidCredentials(): HttpError {
    return new HttpError(HttpStatus.UNAUTHORIZED, ResponseCode.E_401, ResponseMessage.INVALID_CREDENTIALS);
  }
  static forbidden(): HttpError {
    return new HttpError(HttpStatus.FORBIDDEN, ResponseCode.E_403, ResponseMessage.FORBIDDEN);
  }
  static notFound(): HttpError {
    return new HttpError(HttpStatus.NOT_FOUND, ResponseCode.E_404, ResponseMessage.NOT_FOUND);
  }
  static payloadTooLarge(): HttpError {
    return new HttpError(HttpStatus.PAYLOAD_TOO_LARGE, ResponseCode.E_413, ResponseMessage.PAYLOAD_TOO_LARGE);
  }
  static validation(details?: unknown): HttpError {
    return new HttpError(HttpStatus.UNPROCESSABLE_ENTITY, ResponseCode.E_422, ResponseMessage.VALIDATION_FAILED, details);
  }
  static internal(): HttpError {
    return new HttpError(HttpStatus.INTERNAL_ERROR, ResponseCode.E_500, ResponseMessage.INTERNAL_ERROR);
  }
  static serviceUnavailable(): HttpError {
    return new HttpError(HttpStatus.SERVICE_UNAVAILABLE, ResponseCode.E_503, ResponseMessage.SERVICE_UNAVAILABLE);
  }
}
