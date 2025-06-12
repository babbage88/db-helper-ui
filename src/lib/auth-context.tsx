import { createContext, useContext } from "react";

export type AuthContextType = {
  isAuthenticated: boolean | null;
  setIsAuthenticated: (val: boolean) => void;
};

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: null,
  setIsAuthenticated: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
