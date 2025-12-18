import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
  password: string | null;
  setAuth: (params: {
    token: string;
    user: AuthUser;
    password?: string | null;
  }) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  const setAuth: AuthContextValue["setAuth"] = ({ token, user, password }) => {
    setToken(token);
    setUser(user);
    setPassword(password ?? null);
  };

  const clearAuth = () => {
    setToken(null);
    setUser(null);
    setPassword(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(token),
      token,
      user,
      password,
      setAuth,
      clearAuth,
    }),
    [token, user, password],
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


