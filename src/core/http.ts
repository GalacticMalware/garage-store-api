export const HttpStatus = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ResponseCode = {
  S_200: 'S-200',
  E_400: 'E-400',
  E_401: 'E-401',
  E_403: 'E-403',
  E_404: 'E-404',
  E_413: 'E-413',
  E_422: 'E-422',
  E_500: 'S-500',
  E_503: 'E-503',
} as const;

export const ResponseMessage = {
  LOGIN_SUCCESS: 'Se ha iniciado correcatmente',
  STORAGE_SUCCESS: 'Se ha almacenado correctamente',
  BAD_REQUEST: 'Los campos son incorrectos',
  INVALID_CREDENTIALS: 'Credenciales invalidas',
  UNAUTHORIZED: 'No autorizado o token invalido',
  FORBIDDEN: 'No tiene permisos para esta accion',
  NOT_FOUND: 'Ruta no encontrada',
  PAYLOAD_TOO_LARGE: 'El archivo excede el tamano permitido',
  VALIDATION_FAILED: 'Datos invalidos',
  INTERNAL_ERROR: 'Uppss! ocurreio algo inesperado',
  SERVICE_UNAVAILABLE: 'Servicio no disponible, intente mas tarde',
} as const;
