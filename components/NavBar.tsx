import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";

export const NavBar = (): React.JSX.Element | null => {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated } = useAuth();

  // Don't show navbar on login screen
  const firstSegment = segments[0] as string | undefined;
  const isLoginScreen = !segments.length || firstSegment === "index";
  
  // Don't show navbar if not authenticated
  if (!isAuthenticated || isLoginScreen) {
    return null;
  }

  // Check if we're on a main/tab screen (committee list, profile, contacts)
  // These screens don't need a back button
  const secondSegment = segments[1] as string | undefined;
  const isMainScreen = 
    firstSegment === "(tabs)" && 
    segments.length === 2 && 
    (secondSegment === "committee" || secondSegment === "profile" || secondSegment === "contacts");

  // Check if we can go back and we're not on a main screen
  const canGoBack = router.canGoBack() && !isMainScreen;

  const handleBack = () => {
    if (canGoBack) {
      router.back();
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.navBar}>
        {canGoBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons
              name={Platform.OS === "android" ? "arrow-back-outline" : "chevron-back"}
              size={24}
              color={"#fff"}
            />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.screenBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navBar: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: colors.screenBackground,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
  },
});
