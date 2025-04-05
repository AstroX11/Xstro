import type { ErrorDetails, ErrorOptions } from '../@types/error.ts';

export class ErrorBuilder extends Error {
  public readonly code: string;
  public readonly httpCode: number;
  public readonly details: ErrorDetails;
  public readonly cause?: Error | unknown;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly correlationId: string;
  private readonly _originalStack?: string;

  constructor(message: string, options: ErrorOptions = {}) {
    super(message);
    this.name = 'Error';
    this.code = options.code ?? 'UNKNOWN_ERROR';
    this.httpCode = options.httpCode ?? 500;
    this.severity = options.severity ?? 'medium';
    this.isOperational = options.isOperational ?? true;
    this.timestamp = new Date().toISOString();
    this.correlationId = `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
    this.details = {
      ...options.details,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
    };
    this.cause = options.cause;
    this._originalStack = this.stack;

    if (options.cause instanceof Error && options.cause.stack) {
      this.stack = `${this.stack}\nCaused by: ${options.cause.stack}`;
    }

    Object.setPrototypeOf(this, ErrorBuilder.prototype);
  }

  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      httpCode: this.httpCode,
      severity: this.severity,
      isOperational: this.isOperational,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      details: this.details,
      ...(this.cause ? { cause: String(this.cause) } : {}),
    };
  }
}
