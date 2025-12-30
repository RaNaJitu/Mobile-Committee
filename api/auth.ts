import type { LoginFormValues, SignupFormValues } from "@/types/auth";

import { apiClient } from "@/utils/apiClient";

const REGISTER_PATH = "/auth/register";
const LOGIN_PATH = "/auth/login";
const LOGOUT_PATH = "/auth/logout";


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

  // Note: Registration doesn't require a token, so we don't pass one
  // If your API requires a token for registration, pass it here
  return apiClient.post<RegisterResponse>(REGISTER_PATH, payload);
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

  // Login doesn't require a token
  return apiClient.post<LoginResponse>(LOGIN_PATH, payload);
}

export async function logoutUser(
  token: string,
  payload: LogoutPayload,
): Promise<LogoutResponse> {
  return apiClient.post<LogoutResponse>(LOGOUT_PATH, payload, token);
}


