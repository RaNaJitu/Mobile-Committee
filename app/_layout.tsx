import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NavBar } from "@/components/NavBar";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <View style={{ flex: 1 }}>
          <NavBar />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </View>
      </AuthProvider>
    </ErrorBoundary>
  );
}

