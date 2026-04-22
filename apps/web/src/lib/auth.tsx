import { createContext, useContext, type ReactNode } from "react";

type User = {
  email: string;
  nom: string;
  prenom: string;
  roles: string[];
};

type AuthContextValue = {
  user: User | null;
};

const AuthContext = createContext<AuthContextValue>({ user: null });

const DEV_USER: User = {
  email: "admin@ogade.test",
  nom: "Admin",
  prenom: "Dev",
  roles: ["ADMIN_MATERIELS", "REFERENT_LOGISTIQUE_DQI"],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // TODO: Replace with MSAL authentication
  return (
    <AuthContext.Provider value={{ user: DEV_USER }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
