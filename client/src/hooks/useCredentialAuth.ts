import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  familyId?: number;
}

export function useCredentialAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      return response.ok;
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Set auth state to null
      queryClient.setQueryData(["/api/auth/me"], null);
      // Force redirect to login page
      window.location.replace("/login");
    },
    onError: () => {
      // Even if logout fails, clear local state and redirect
      queryClient.clear();
      queryClient.setQueryData(["/api/auth/me"], null);
      window.location.replace("/login");
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: user as AuthUser | null,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: (user as AuthUser)?.role === "admin",
    isParent: (user as AuthUser)?.role === "parent",
    logout,
    error,
  };
}