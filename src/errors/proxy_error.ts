import { ErrorBuilder } from './error_builder.ts';
import type { ErrorOptions } from '../@types/error.ts';

export class ProxyError extends ErrorBuilder {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      ...options,
      code: options.code ?? 'PROXY_ERROR',
      httpCode: options.httpCode ?? 503,
    });
  }

  static invalidProxyUri(uri: string, cause?: Error): ProxyError {
    return new ProxyError('Invalid proxy URI provided', {
      code: 'PROXY_INVALID_URI',
      httpCode: 400,
      details: { uri, invalidReason: cause?.message || 'Malformed or unsupported URI' },
      cause,
    });
  }

  static connectionFailed(uri: string, cause?: Error): ProxyError {
    return new ProxyError('Failed to establish proxy connection', {
      code: 'PROXY_CONNECTION_FAILED',
      httpCode: 503,
      details: { uri, errorMessage: cause?.message || 'Unknown connection error' },
      cause,
    });
  }
}
