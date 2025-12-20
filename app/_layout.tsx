import { Stack } from "expo-router";
import React from "react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Stack />
      </AuthProvider>
    </ErrorBoundary>
  );
}

