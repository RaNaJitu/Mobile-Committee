import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiClient } from "@/utils/apiClient";
import { logger } from "@/utils/logger";

export interface AuthUser {
  name?: string | null;
  email?: string | null;
  phoneNo?: string | null;
  role?: string | null;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  setAuth: (params: {
    token: string;
    user: AuthUser;
  }) => Promise<void>;
  clearAuth: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth data on mount
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser = await SecureStore.getItemAsync(USER_KEY);
        
        if (storedToken) {
          setToken(storedToken);
        }
        
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            // Invalid JSON, ignore
          }
        }
      } catch (error) {
        // Handle secure store errors silently
        logger.error("Failed to load stored auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadStoredAuth();
  }, []);

  const clearAuth = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (error) {
      logger.error("Failed to clear stored auth:", error);
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  // Register session expiration handler with API client
  useEffect(() => {
    const handleSessionExpired = async () => {
      logger.log("Session expired, clearing auth and redirecting to login");
      await clearAuth();
      // Use replace to prevent back navigation
      router.replace("/");
    };

    apiClient.setSessionExpiredHandler(handleSessionExpired);
  }, [router, clearAuth]);

  const setAuth: AuthContextValue["setAuth"] = async ({ token, user }) => {
    try {
      // Store token securely
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      // Store user data securely
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      
      setToken(token);
      setUser(user);
    } catch (error) {
      logger.error("Failed to store auth:", error);
      // Still set in memory as fallback
      setToken(token);
      setUser(user);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(token),
      token,
      user,
      setAuth,
      clearAuth,
      isLoading,
    }),
    [token, user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return ctx;
};


