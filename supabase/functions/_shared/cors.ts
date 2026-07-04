/**
 * CORS Configuration for Edge Functions
 * 
 * Allows both web and extension requests while maintaining security
 */

/**
 * Allowed origins for web requests
 */
const allowedOrigins = [
  "http://localhost:5173",
  "https://job-orbit-flax.vercel.app",
];

/**
 * CORS headers for web requests
 * Includes all headers that Supabase clients typically send
 */
export const webCorsHeaders = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info, x-extension-token',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '3600',
}

/**
 * CORS headers for extension requests
 * Extensions can use '*' for origin but we restrict by extension ID
 * Includes all headers that Supabase clients typically send
 */
export const extensionCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info, x-extension-token, x-extension-id',
  'Access-Control-Max-Age': '3600',
}

/**
 * Validate origin for CORS
 */
export function validateCorsOrigin(
  origin: string | null,
  allowedOrigins: string[]
): boolean {
  if (!origin) return false

  // Check exact matches
  if (allowedOrigins.includes(origin)) {
    return true
  }

  // Check extension origins
  if (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')) {
    return true
  }

  return false
}

/**
 * Get appropriate CORS headers based on request origin
 */
export function getCorsHeaders(
  origin: string | null,
  isExtensionRequest: boolean = false
): Record<string, string> {
  // For extension requests, allow *
  if (isExtensionRequest || (origin && (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')))) {
    return extensionCorsHeaders
  }

  // For web requests, use specific origin
  return {
    ...webCorsHeaders,
    'Access-Control-Allow-Origin': origin || 'http://localhost:5173',
  }
}

/**
 * Security headers to include in all responses
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflight(
  origin: string | null,
  isExtensionRequest: boolean = false
): Response {
  const corsHeaders = getCorsHeaders(origin, isExtensionRequest)
  
  return new Response('ok', {
    status: 200,
    headers: {
      ...corsHeaders,
      ...securityHeaders,
    },
  })
}

/**
 * Create response with CORS headers
 */
export function createCorsResponse(
  body: string | BodyInit,
  origin: string | null,
  options: {
    status?: number
    contentType?: string
    isExtensionRequest?: boolean
  } = {}
): Response {
  const {
    status = 200,
    contentType = 'application/json',
    isExtensionRequest = false,
  } = options

  const corsHeaders = getCorsHeaders(origin, isExtensionRequest)

  return new Response(body, {
    status,
    headers: {
      ...corsHeaders,
      ...securityHeaders,
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}

/**
 * Error response with CORS headers
 */
export function createCorsErrorResponse(
  message: string,
  origin: string | null,
  statusCode: number = 400,
  isExtensionRequest: boolean = false
): Response {
  const body = JSON.stringify({
    success: false,
    error: message,
  })

  return createCorsResponse(body, origin, {
    status: statusCode,
    contentType: 'application/json',
    isExtensionRequest,
  })
}
