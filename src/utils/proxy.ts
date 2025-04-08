import { HttpsProxyAgent } from 'https-proxy-agent';
import { URL } from 'node:url';
import { ProxyError } from '../errors/proxy_error.ts';

export function validateProxy(proxyUri: string): boolean {
  if (!proxyUri) {
    throw ProxyError.invalidProxyUri(proxyUri);
  }

  try {
    const url = new URL(proxyUri);
    return ['http:', 'https:'].includes(url.protocol) && !!url.hostname;
  } catch (error) {
    throw ProxyError.invalidProxyUri(proxyUri, error as Error);
  }
}

export function connectProxy(proxyUri: string): HttpsProxyAgent<string> {
  if (!validateProxy(proxyUri)) {
    throw ProxyError.invalidProxyUri(proxyUri);
  }

  try {
    return new HttpsProxyAgent(proxyUri);
  } catch (error) {
    throw ProxyError.connectionFailed(proxyUri, error as Error);
  }
}
