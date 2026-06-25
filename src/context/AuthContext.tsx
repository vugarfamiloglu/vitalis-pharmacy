import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { get, post } from "../lib/api.ts";

export interface User {
  username: string;
  full_name: string;
  role: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = (): AuthCtx => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<User>("/api/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    setUser(await post<User>("/api/auth/login", { username, password }));
  };
  const logout = async (): Promise<void> => {
    await post("/api/auth/logout", {});
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}
