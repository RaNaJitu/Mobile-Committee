/**
 * Centralized API Client
 * Handles all API requests with automatic session expiration handling
 */

import { API_BASE_URL } from "@/config/env";
import { handleApiError, SessionExpiredError } from "@/utils/apiErrorHandler";
import { logger } from "@/utils/logger";

type SessionExpiredHandler = () => Promise<void>;

class ApiClient {
  private baseUrl: string;
  private sessionExpiredHandler?: SessionExpiredHandler;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set the session expiration handler
   * This should be called from AuthContext when the app initializes
   */
  setSessionExpiredHandler(handler: SessionExpiredHandler) {
    this.sessionExpiredHandler = handler;
    logger.log("Session expiration handler registered");
  }

  /**
   * Make an API request with automatic error handling
   * @param endpoint - API endpoint (e.g., "/committee/get")
   * @param options - Fetch options with optional token
   * @returns Promise with typed response data
   */
  async request<T>(
    endpoint: string,
    options: RequestInit & { token?: string },
  ): Promise<T> {
    const { token, ...fetchOptions } = options;
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "*/*",
      ...fetchOptions.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        await handleApiError(response, this.sessionExpiredHandler);
      }

      const data = await response.json().catch(() => null);
      return data as T;
    } catch (error) {
      // Re-throw SessionExpiredError as-is
      if (error instanceof SessionExpiredError) {
        throw error;
      }
      
      // Handle network errors
      logger.error("API request failed:", error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "GET",
      token,
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    token?: string,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      token,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    token?: string,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
      token,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    token?: string,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      token,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      token,
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

