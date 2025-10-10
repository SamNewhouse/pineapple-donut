/**
 * Standard HTTP response structure for API Gateway Lambda functions
 */
export interface HttpResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

/**
 * Standardized API response body structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Default CORS headers applied to all HTTP responses
 */
const defaultHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

/**
 * Creates a successful HTTP response with data
 * @param data - The response data payload
 * @param statusCode - HTTP status code (defaults to 200)
 * @param message - Optional success message
 * @returns Formatted HTTP response
 */
export function success<T>(data: T, statusCode = 200, message?: string): HttpResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };

  return {
    statusCode,
    headers: defaultHeaders,
    body: JSON.stringify(response),
  };
}

/**
 * Creates an error HTTP response
 * @param errorMessage - Error message to return
 * @param statusCode - HTTP status code (defaults to 500)
 * @returns Formatted HTTP error response
 */
export function error(errorMessage: string, statusCode = 500): HttpResponse {
  const response: ApiResponse = {
    success: false,
    error: errorMessage,
  };

  return {
    statusCode,
    headers: defaultHeaders,
    body: JSON.stringify(response),
  };
}

/**
 * Creates a 400 Bad Request response
 * @param errorMessage - Error message describing what was invalid
 * @returns HTTP 400 response
 */
export function badRequest(errorMessage: string): HttpResponse {
  return error(errorMessage, 400);
}

/**
 * Creates a 401 Unauthorized response
 * @param errorMessage - Error message (defaults to "Unauthorized")
 * @returns HTTP 401 response
 */
export function unauthorized(errorMessage: string = "Unauthorized"): HttpResponse {
  return error(errorMessage, 401);
}

/**
 * Creates a 403 Forbidden response
 * @param errorMessage - Error message (defaults to "Forbidden")
 * @returns HTTP 403 response
 */
export function forbidden(errorMessage: string = "Forbidden"): HttpResponse {
  return error(errorMessage, 403);
}

/**
 * Creates a 404 Not Found response
 * @param errorMessage - Error message (defaults to "Not Found")
 * @returns HTTP 404 response
 */
export function notFound(errorMessage: string = "Not Found"): HttpResponse {
  return error(errorMessage, 404);
}

/**
 * Creates a 409 Conflict response
 * @param errorMessage - Error message describing the conflict
 * @returns HTTP 409 response
 */
export function conflict(errorMessage: string): HttpResponse {
  return error(errorMessage, 409);
}

/**
 * Safely parses JSON request body with error handling
 * @param body - Raw request body string from API Gateway event
 * @returns Parsed JSON object
 * @throws Error if body is null/empty or contains invalid JSON
 */
export function parseBody<T = any>(body: string | null): T {
  if (!body) {
    throw new Error("Request body is required");
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Invalid JSON in request body");
  }
}

/**
 * Converts caught errors into standardized HTTP error responses
 * Automatically maps common error types to appropriate status codes
 * @param err - The caught error (unknown type for safety)
 * @returns Formatted HTTP error response
 */
export function handleError(err: unknown): HttpResponse {
  let errorMessage = "Unknown error";
  let statusCode = 500;

  if (err instanceof Error) {
    errorMessage = err.message;

    // Map specific error messages to 400 Bad Request
    if (err.message.includes("required") || err.message.includes("Invalid JSON")) {
      statusCode = 400;
    }
  }

  return error(errorMessage, statusCode);
}
