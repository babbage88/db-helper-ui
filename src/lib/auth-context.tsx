import { createContext, useContext } from "react";
import type { SessionUser } from "@/lib/auth-session";

export type AuthContextType = {
  isAuthenticated: boolean | null;
  setIsAuthenticated: (val: boolean) => void;
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  refreshSession: () => Promise<SessionUser | null>;
};

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: null,
  setIsAuthenticated: () => {},
  user: null,
  setUser: () => {},
  refreshSession: async () => null,
});

export function useAuth() {
  return useContext(AuthContext);
}
