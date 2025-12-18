export interface LoginFormValues {
  phoneNumber: string;
  password: string;
  rememberMe: boolean;
}

export type UserRole = "USER" | "ADMIN";

export interface SignupFormValues {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  role: UserRole;
}

