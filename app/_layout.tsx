import { Stack } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import Toast from "react-native-toast-message";

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
          <Toast
            config={{
              success: ({ text1, text2 }) => (
                <View
                  style={{
                    backgroundColor: "#10b981",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 8,
                    marginHorizontal: 16,
                    marginTop: 60,
                    maxWidth: "80%",
                    alignSelf: "flex-end",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  }}
                >
                  {(text1 || text2) && (
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#fff",
                        fontWeight: "500",
                      }}
                    >
                      {text1 || text2}
                    </Text>
                  )}
                </View>
              ),
              error: ({ text1, text2 }) => (
                <View
                  style={{
                    backgroundColor: "#f87171",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 8,
                    marginHorizontal: 16,
                    marginTop: 60,
                    maxWidth: "80%",
                    alignSelf: "flex-end",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  }}
                >
                  {(text1 || text2) && (
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#fff",
                        fontWeight: "500",
                      }}
                    >
                      {text1 || text2}
                    </Text>
                  )}
                </View>
              ),
            }}
          />
        </View>
      </AuthProvider>
    </ErrorBoundary>
  );
}

