import { HTTPError } from 'ky';

export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

const isKyHTTPError = (e: any): e is HTTPError => e instanceof HTTPError;

type ErrorResult<TError = unknown> =
  | {
      error: Error;
      message: string;
      stack?: string;
      type: 'Error';
    }
  | {
      error: HTTPError;
      message: string;
      stack?: string;
      type: 'KyHTTPError';
    }
  | {
      error: TError;
      message: string;
      stack?: undefined;
      type: 'Unknown';
    };

const defaultErrorMessage = '오류가 발생했어요. 잠시 후 다시 시도해 주세요.';

const errorToResult = async <TError = unknown>(error: TError): Promise<ErrorResult<TError>> => {
  if (isKyHTTPError(error)) {
    const message = !error.response.body
      ? error.message
      : (await error.response.json<{ message: string }>()).message;
    return {
      type: 'KyHTTPError',
      error,
      stack: error.stack,
      message,
    };
  }
  if (isError(error)) {
    return {
      type: 'Error',
      error,
      stack: error.stack,
      message: error.message,
    };
  }
  return {
    error,
    message: typeof error === 'string' ? error : defaultErrorMessage,
    type: 'Unknown',
  };
};

export const handleError = async <TError = unknown>(error: TError) => {
  return await errorToResult(error);
};
