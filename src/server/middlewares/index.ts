import { NextRequest, NextResponse } from 'next/server';
import { extractRequestId, extractClientIp, CLIENT_IP_HEADER } from './client-meta.middleware';
import { handleCorsPreflight } from './cors.middleware';
import { handleAuthRouting } from './auth.middleware';
import { applySecurityHeaders } from './security.middleware';
import { REQUEST_ID_HEADER } from '../context/request.context';

export * from './client-meta.middleware';
export * from './cors.middleware';
export * from './security.middleware';
export * from './auth.middleware';
export { REQUEST_ID_HEADER } from '../context/request.context';

/**
 * Runs the chain of enterprise middlewares:
 * 1. Request ID & Client IP extraction
 * 2. CORS preflight interception
 * 3. Route Protection & Auth Redirects
 * 4. Downstream header injection
 * 5. Response security headers application
 */
export function runMiddlewares(request: NextRequest): NextResponse {
  const requestId = extractRequestId(request);
  const clientIp = extractClientIp(request);

  // 1. Check for preflight CORS
  const preflightResponse = handleCorsPreflight(request, requestId);
  if (preflightResponse) {
    return preflightResponse;
  }

  // 2. Route Protection and Authentication Redirects
  const authRedirect = handleAuthRouting(request);
  if (authRedirect) {
    applySecurityHeaders(authRedirect, requestId, clientIp);
    return authRedirect;
  }

  // 3. Clone headers and inject metadata for downstream server layers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);
  requestHeaders.set(CLIENT_IP_HEADER, clientIp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 4. Apply security headers and metadata to response
  applySecurityHeaders(response, requestId, clientIp);

  return response;
}
