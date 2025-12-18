import { Stack } from "expo-router";
import React from "react";

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout(): React.JSX.Element {
  return (
    <AuthProvider>
      <Stack />
    </AuthProvider>
  );
}

