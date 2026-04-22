import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type UserRole = "user" | "admin";

type AuthContextType = {
  role: UserRole;
  setRole: (role: UserRole) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem("smart-traffic-role");
    return (saved as UserRole) || "admin";
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  useEffect(() => {
    localStorage.setItem("smart-traffic-role", role);
  }, [role]);

  const value = useMemo(() => ({ role, setRole }), [role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}