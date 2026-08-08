"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";

// Create an Axios instance with defaults
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://twp-pfrw.onrender.com";
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true // CRITICAL: send HttpOnly cookies on every request
});

interface AuthContextType {
  accessToken: string | null;
  role: string | null;
  name: string | null;
  setAuth: (token: string, role: string, name: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const setAuth = (token: string, newRole: string, newName: string) => {
    setAccessToken(token);
    setRole(newRole);
    setName(newName);
    
    // Attach token to all future requests
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  const logout = () => {
    setAccessToken(null);
    setRole(null);
    setName(null);
    delete api.defaults.headers.common["Authorization"];
    router.push("/login");
  };

  useEffect(() => {
    // Attempt silent refresh on mount
    const silentRefresh = async () => {
      try {
        const res = await api.post("/api/auth/refresh");
        if (res.data.success) {
          setAuth(res.data.accessToken, res.data.role, res.data.name);
        }
      } catch (error) {
        const publicPaths = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];
        if (!publicPaths.includes(pathname)) {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    silentRefresh();
  }, [pathname, router]);

  // Axios interceptor for transparent token rotation
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If 401 and we haven't already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Attempt rotation
            const res = await axios.post(`${API_BASE}/api/auth/refresh`, {}, { withCredentials: true });
            
            if (res.data.success) {
              setAuth(res.data.accessToken, res.data.role, res.data.name);
              
              // Update the failed request with the new token and retry
              originalRequest.headers["Authorization"] = `Bearer ${res.data.accessToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, kick to login
            logout();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, role, name, setAuth, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
