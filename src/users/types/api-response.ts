export interface ApiResponse<T = any> {
  success: true;
  data?: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
  };
  timestamp: string;
}

export type ApiResponseType<T> = ApiResponse<T> | ApiErrorResponse;
