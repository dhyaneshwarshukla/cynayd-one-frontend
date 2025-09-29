import { useSession, signIn, signOut } from "next-auth/react";
import { AuthProvider } from "../types/auth.types";

export const useNextAuth = () => {
  const { data: session, status } = useSession();

  const login = async (provider: AuthProvider, options?: any) => {
    try {
      await signIn(provider, { ...options, callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return {
    user: session?.user,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    login,
    logout,
  };
}; 