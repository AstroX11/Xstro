export interface ErrorDetails {
  [key: string]: any;
  context?: Record<string, any>;
  timestamp?: string;
  correlationId?: string;
}

export interface ErrorOptions {
  code?: string;
  httpCode?: number;
  details?: ErrorDetails;
  cause?: Error | unknown;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  isOperational?: boolean;
}
