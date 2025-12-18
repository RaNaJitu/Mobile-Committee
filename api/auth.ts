import type { LoginFormValues, SignupFormValues } from "@/types/auth";

const BASE_URL = "http://10.255.253.32:4000/api/v1";
const REGISTER_PATH = "/auth/register";
const LOGIN_PATH = "/auth/login";
const LOGOUT_PATH = "/auth/logout";

// TODO: Put your real JWT token here if the API requires Authorization
// for registration, or inject it from secure storage/auth state.
const AUTH_TOKEN = "";

interface RegisterPayload {
  phoneNo: string;
  email: string;
  password: string;
  name: string;
  role: SignupFormValues["role"];
}

type RegisterResponse = unknown;
type LoginResponse = unknown;
type LogoutResponse = unknown;

interface LoginPayload {
  phoneNo: string;
  email?: string;
  password: string;
}

interface LogoutPayload {
  phoneNo: string;
  email?: string;
  password?: string;
}

export async function registerUser(
  form: SignupFormValues,
): Promise<RegisterResponse> {
  const payload: RegisterPayload = {
    phoneNo: form.phoneNumber,
    email: form.email,
    password: form.password,
    name: form.fullName,
    role: form.role,
  };

  const headers: Record<string, string> = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
  };

  if (AUTH_TOKEN) {
    headers.Authorization = `Bearer ${AUTH_TOKEN}`;
  }

  const response = await fetch(`${BASE_URL}${REGISTER_PATH}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response
    .json()
    .catch(() => null) as RegisterResponse | { message?: string; error?: string };

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && ("message" in data || "error" in data)
        ? (data as any).message ?? (data as any).error
        : undefined) ?? `Register failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as RegisterResponse;
}

export async function loginUser(
  form: LoginFormValues,
): Promise<LoginResponse> {
  const payload: LoginPayload = {
    phoneNo: form.phoneNumber,
    // If your API requires email as well, add an email field to the form
    // and pass it here. For now we only log in with phone + password.
    email: undefined,
    password: form.password,
  };

  const response = await fetch(`${BASE_URL}${LOGIN_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response
    .json()
    .catch(() => null) as LoginResponse | { message?: string; error?: string };

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && ("message" in data || "error" in data)
        ? (data as any).message ?? (data as any).error
        : undefined) ?? `Login failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as LoginResponse;
}

export async function logoutUser(
  token: string,
  payload: LogoutPayload,
): Promise<LogoutResponse> {
  const response = await fetch(`${BASE_URL}${LOGOUT_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response
    .json()
    .catch(() => null) as LogoutResponse | { message?: string; error?: string };

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && ("message" in data || "error" in data)
        ? (data as any).message ?? (data as any).error
        : undefined) ?? `Logout failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as LogoutResponse;
}


