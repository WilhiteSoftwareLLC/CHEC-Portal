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
      return await apiRequest("/api/logout", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      window.location.href = "/login";
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: user as AuthUser | null,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isParent: user?.role === "parent",
    logout,
    error,
  };
}