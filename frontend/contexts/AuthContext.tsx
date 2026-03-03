"use client";

import { fetchWithAuth, getToken, removeToken, setToken } from "@/lib/auth";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface User {
  id: number;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    passwordConfirmation: string,
  ) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      (async () => {
        const res = await fetchWithAuth(`${API_URL}/current_user`);
        const data = await res.json();
        setUser(data);
        setLoading(false);
      })();
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "ログインに失敗しました");
      }

      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
    } catch {
      throw new Error("login error");
    }
  }, []);

  const signup = useCallback(
    async (email: string, password: string, passwordConfirmation: string) => {
      try {
        const res = await fetch(`${API_URL}/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user: {
              email,
              password,
              password_confirmation: passwordConfirmation,
            },
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "サインアップに失敗しました");
        }

        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
      } catch {
        throw new Error("signup error");
      }
    },
    [],
  );

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
