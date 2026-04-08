import React, { createContext, useContext, useState, useCallback } from "react";

export type UserRole = "admin" | "vendedor" | "socio";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const mockUsers: Record<string, User & { password: string }> = {
  "admin@mesbelle.com": { id: "1", name: "Carolina Mendes", email: "admin@mesbelle.com", role: "admin", password: "admin123" },
  "vendedor@mesbelle.com": { id: "2", name: "Juliana Costa", email: "vendedor@mesbelle.com", role: "vendedor", password: "vend123" },
  "socio@mesbelle.com": { id: "3", name: "Ricardo Almeida", email: "socio@mesbelle.com", role: "socio", password: "socio123" },
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("mesbelle_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((email: string, password: string) => {
    const found = mockUsers[email];
    if (found && found.password === password) {
      const { password: _, ...userData } = found;
      setUser(userData);
      localStorage.setItem("mesbelle_user", JSON.stringify(userData));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("mesbelle_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
