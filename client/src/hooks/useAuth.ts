import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true, // Force refetch on every mount
    staleTime: 0, // Always refetch to ensure fresh auth state
    gcTime: 0, // Disable cache for auth state
    queryFn: async () => {
      console.log('Checking user authentication...');
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      
      const userData = await response.json();
      console.log('User data retrieved:', userData);
      return userData;
    },
  });

  // Login mutation for login form
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      // Try multiple login endpoints for deployment compatibility
      const endpoints = ['/api/login', '/api/test-login', '/api/auth/simple-login'];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Attempting login at ${endpoint} with username: ${email}`);
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password }),
            credentials: 'include'
          });

          console.log(`Login response from ${endpoint}:`, response.status);
          if (response.ok) {
            const result = await response.json();
            console.log('Login successful:', result);
            return result;
          } else {
            const error = await response.text();
            console.log(`Login failed at ${endpoint}:`, error);
          }
        } catch (error) {
          console.log(`Login attempt failed at ${endpoint}:`, error);
          continue;
        }
      }
      
      throw new Error('Login failed - please try again');
    },
    onSuccess: () => {
      console.log('Login successful, refreshing auth state...');
      // Clear any old cookies that might interfere
      document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      // Clear all cache and refresh auth state
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      // Force page refresh to ensure proper session sync
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Clear auth state and redirect to login
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    loginMutation,
    logoutMutation,
  };
}
