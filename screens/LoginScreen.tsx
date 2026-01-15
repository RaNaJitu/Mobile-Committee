import { loginUser, registerUser } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import type {
  LoginFormValues,
  SignupFormValues,
  UserRole,
} from "@/types/auth";
import { logger } from "@/utils/logger";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const extractToken = (response: any): string | null => {
  const candidates = [
    response?.token,
    response?.accessToken,
    response?.jwt,
    response?.data?.token,
    response?.data?.accessToken,
    response?.data?.jwt,
    response?.data?.data?.token,
    response?.data?.data?.accessToken,
    response?.data?.data?.jwt,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return null;
};

const LoginScreen = (): React.JSX.Element => {
  const router = useRouter();
  const { setAuth } = useAuth();

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // Login state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Signup state
  const [fullName, setFullName] = useState("");
  const [signupPhoneNumber, setSignupPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("USER");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const isLogin = activeTab === "login";

  const handleSignIn = async () => {
    const payload: LoginFormValues = {
      phoneNumber,
      password,
      rememberMe,
    };

    try {
      setIsSigningIn(true);
      const response = await loginUser(payload);
      logger.log("Login success");

      // Try to extract token and user info from the response,
      // but fall back to the form values if needed.
      const anyResponse = response as any;
      const token = extractToken(anyResponse);
      const responseUser =
        anyResponse?.data?.user ??
        anyResponse?.data?.data?.user ??
        anyResponse?.data?.data ??
        anyResponse?.user ??
        anyResponse?.data;

      await setAuth({
        token: token ?? "",
        user: {
          name: responseUser?.name ?? null,
          email: responseUser?.email ?? null,
          phoneNo: responseUser?.phoneNo ?? payload.phoneNumber ?? null,
          role: responseUser?.role ?? null,
        },
      });

      // Show success message
      const successMessage = anyResponse?.message || anyResponse?.data?.message || "Login successful";
      showSuccessToast(successMessage);
      
      router.replace("/(tabs)/committee");
    } catch (error) {
      logger.error("Login failed", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Something went wrong. Please try again.";
      showErrorToast(errorMessage);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async () => {
    const payload: SignupFormValues = {
      fullName,
      phoneNumber: signupPhoneNumber,
      email,
      password: signupPassword,
      role,
    };

    try {
      setIsSigningUp(true);
      const response = await registerUser(payload);
      logger.log("Sign up success");

      const anyResponse = response as any;
      const token = extractToken(anyResponse);
      const responseUser =
        anyResponse?.data?.user ??
        anyResponse?.data?.data?.user ??
        anyResponse?.data?.data ??
        anyResponse?.user ??
        anyResponse?.data;

      await setAuth({
        token: token ?? "",
        user: {
          name: responseUser?.name ?? payload.fullName,
          email: responseUser?.email ?? payload.email,
          phoneNo: responseUser?.phoneNo ?? payload.phoneNumber,
          role: responseUser?.role ?? payload.role,
        },
      });

      // Show success message
      const successMessage = anyResponse?.message || anyResponse?.data?.message || "Registration successful";
      showSuccessToast(successMessage);
      
      router.replace("/(tabs)/committee");
    } catch (error) {
      logger.error("Sign up failed", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Something went wrong. Please try again.";
      showErrorToast(errorMessage);
    } finally {
      setIsSigningUp(false);
    }
  };

  const toggleRoleDropdown = () => {
    setIsRoleDropdownOpen((prev) => !prev);
  };

  const handleSelectRole = (value: UserRole) => {
    setRole(value);
    setIsRoleDropdownOpen(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Top heading in Hindi */}
          <View style={styles.headingWrapper}>
            <Text style={styles.headingText}>
              स्वागत है <Text style={styles.headingHighlight}>| कमेटी में</Text>
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isLogin ? "login your account" : "Create an account"}
            </Text>

            {/* Auth toggle */}
            <View style={styles.toggleWrapper}>
              <View style={styles.toggleBackground}>
                <Pressable
                  style={[
                    styles.toggleButton,
                    activeTab === "login" && styles.toggleButtonActive,
                  ]}
                  onPress={() => setActiveTab("login")}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      activeTab === "login" && styles.toggleTextActive,
                    ]}
                  >
                    Login
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.toggleButton,
                    activeTab === "signup" && styles.toggleButtonActive,
                  ]}
                  onPress={() => setActiveTab("signup")}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      activeTab === "signup" && styles.toggleTextActive,
                    ]}
                  >
                    Signup
                  </Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.subtitle}>
              {isLogin
                ? "Enter your credentials to access the dashboard."
                : "Fill out the details below to register a new account."}
            </Text>

            {isLogin ? (
              <>
                {/* Phone input */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Phone number <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="9876541230"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    maxLength={10}
                  />
                </View>

                {/* Password input */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Password <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <Pressable
                      hitSlop={10}
                      onPress={() => setShowPassword((prev) => !prev)}
                    >
                      <Ionicons
                        name={
                          showPassword ? "eye-off-outline" : "eye-outline"
                        }
                        size={20}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Remember me / Forgot password */}
                <View style={styles.row}>
                  <Pressable
                    style={styles.rememberWrapper}
                    onPress={() => setRememberMe((prev) => !prev)}
                    hitSlop={10}
                  >
                    <View style={styles.checkbox}>
                      {rememberMe && <View style={styles.checkboxInner} />}
                    </View>
                    <Text style={styles.rememberText}>Remember me</Text>
                  </Pressable>

                  <Pressable hitSlop={10} onPress={() => {}}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </Pressable>
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  style={[
                    styles.signInButton,
                    isSigningIn && styles.signInButtonDisabled,
                  ]}
                  activeOpacity={0.9}
                  onPress={handleSignIn}
                  disabled={isSigningIn}
                >
                  <Text style={styles.signInText}>
                    {isSigningIn ? "Signing in..." : "Sign in"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Full name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Full name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                {/* Phone number */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Phone number <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="081234567890"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    value={signupPhoneNumber}
                    onChangeText={setSignupPhoneNumber}
                    maxLength={12}
                  />
                </View>

                {/* Email */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Email <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="demo@gmail.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Password <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Create a password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showSignupPassword}
                      value={signupPassword}
                      onChangeText={setSignupPassword}
                    />
                    <Pressable
                      hitSlop={10}
                      onPress={() =>
                        setShowSignupPassword((prev) => !prev)
                      }
                    >
                      <Ionicons
                        name={
                          showSignupPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={20}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Role */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Role</Text>
                  <Pressable
                    style={[styles.input, styles.roleInput]}
                    onPress={toggleRoleDropdown}
                  >
                    <Text style={styles.roleText}>
                      {role === "USER" ? "User" : "Admin"}
                    </Text>
                    <Ionicons
                      name={
                        isRoleDropdownOpen
                          ? "chevron-up-outline"
                          : "chevron-down-outline"
                      }
                      size={18}
                      color={colors.textMuted}
                    />
                  </Pressable>

                  {isRoleDropdownOpen && (
                    <View style={styles.dropdown}>
                      {(["USER", "ADMIN"] as const).map((option) => (
                        <Pressable
                          key={option}
                          style={[
                            styles.dropdownItem,
                            option === role && styles.dropdownItemSelected,
                          ]}
                          onPress={() => handleSelectRole(option)}
                        >
                          <Text style={styles.dropdownItemText}>
                            {option === "USER" ? "User" : "Admin"}
                          </Text>
                          {option === role && (
                            <Ionicons
                              name="checkmark-outline"
                              size={16}
                              color={colors.primary}
                            />
                          )}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Sign up button */}
                <TouchableOpacity
                  style={[
                    styles.signInButton,
                    isSigningUp && styles.signInButtonDisabled,
                  ]}
                  activeOpacity={0.9}
                  onPress={handleSignUp}
                  disabled={isSigningUp}
                >
                  <Text style={styles.signInText}>
                    {isSigningUp ? "Signing up..." : "Sign up"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
    justifyContent: "center",
  },
  headingWrapper: {
    alignItems: "center",
    marginBottom: 24,
  },
  headingText: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headingHighlight: {
    color: colors.headingHighlight,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 16,
    textTransform: "capitalize",
  },
  toggleWrapper: {
    marginBottom: 12,
  },
  toggleBackground: {
    flexDirection: "row",
    backgroundColor: colors.inputBackground,
    borderRadius: 999,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C0C1D9",
  },
  toggleTextActive: {
    color: "#1B1235",
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  required: {
    color: colors.error,
  },
  input: {
    height: 46,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInput: {
    flex: 1,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  rememberWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.checkboxBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkboxInner: {
    width: 11,
    height: 11,
    borderRadius: 3,
    backgroundColor: colors.checkboxFill,
  },
  rememberText: {
    fontSize: 13,
    color: "#D0D1EA",
  },
  forgotText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  signInButton: {
    marginTop: 4,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  signInText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B1235",
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  roleInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roleText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  dropdown: {
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownItemSelected: {
    backgroundColor: colors.cardBackground,
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
});

export default LoginScreen;