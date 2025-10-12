import { AuthProvider } from "@/contexts/AuthContext";
import MainNavigator from "./MainNavigator";

// app/_layout.tsx
export default function RootLayout() {
  return (
    <AuthProvider>
      <MainNavigator />
    </AuthProvider>
  );
}
