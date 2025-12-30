/**
 * API Error Handler Utility
 * Handles API errors including session expiration
 */

import { logger } from "@/utils/logger";

export class SessionExpiredError extends Error {
  constructor(message = "Session expired") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
}

/**
 * Handles API errors and throws appropriate exceptions
 * @param response - The fetch Response object
 * @param handleSessionExpired - Optional callback for session expiration
 * @throws SessionExpiredError if status is 401 or 403
 * @throws Error for other non-ok responses
 */
export const handleApiError = async (
  response: Response,
  handleSessionExpired?: () => Promise<void>,
): Promise<never> => {
  const data = await response
    .json()
    .catch(() => null) as ApiErrorResponse | null;

  const message =
    (data && typeof data === "object" && ("message" in data || "error" in data)
      ? (data as any).message ?? (data as any).error
      : undefined) ?? `Request failed with status ${response.status}`;

  // Check for 401 Unauthorized or 403 Forbidden (session expired)
  if (response.status === 401 || response.status === 403) {
    logger.warn("Session expired detected, status:", response.status);
    
    if (handleSessionExpired) {
      await handleSessionExpired();
    }
    
    throw new SessionExpiredError("Your session has expired. Please log in again.");
  }

  throw new Error(message);
};

