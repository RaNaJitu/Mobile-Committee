import { logoutUser } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import { logger } from "@/utils/logger";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfileScreen = (): React.JSX.Element => {
  const router = useRouter();
  const { user, token, clearAuth } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!token || !user?.phoneNo) {
      await clearAuth();
      router.replace("/");
      return;
    }

    try {
      setIsLoggingOut(true);
      await logoutUser(token, {
        phoneNo: user.phoneNo,
        email: user.email ?? undefined,
      });

      await clearAuth();
      Alert.alert("Logged out", "You have been logged out successfully.");
      router.replace("/");
    } catch (error) {
      logger.error("Logout failed", error);
      Alert.alert(
        "Logout failed",
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>

        {user ? (
          <View style={styles.card}>
            {user.name ? <Text style={styles.name}>{user.name}</Text> : null}
            {user.phoneNo ? (
              <Text style={styles.detailLabel}>
                Phone: <Text style={styles.detailValue}>{user.phoneNo}</Text>
              </Text>
            ) : null}
            {user.email ? (
              <Text style={styles.detailLabel}>
                Email: <Text style={styles.detailValue}>{user.email}</Text>
              </Text>
            ) : null}
            {user.role ? (
              <Text style={styles.detailLabel}>
                Role: <Text style={styles.detailValue}>{user.role}</Text>
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.subtitle}>
            No user information available. Please log in again.
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.logoutButton,
            isLoggingOut && styles.logoutButtonDisabled,
          ]}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.9}
        >
          <Text style={styles.logoutText}>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  logoutButton: {
    marginTop: "auto",
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonDisabled: {
    opacity: 0.7,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B1235",
  },
});

export default ProfileScreen;


