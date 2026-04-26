import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  PublicClientApplication,
  EventType,
  type AccountInfo,
  type AuthenticationResult,
} from "@azure/msal-browser";
import { fetchAuthConfig, buildMsalConfig, loginRequest, type AuthConfig } from "./msal-config";
import { api } from "./api";

type User = {
  email: string;
  nom: string;
  prenom: string;
  roles: string[];
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  authConfig: AuthConfig | null;
  loginMicrosoft: () => Promise<void>;
  loginLocal: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  authConfig: null,
  loginMicrosoft: async () => {},
  loginLocal: async () => {},
  logout: async () => {},
  getAccessToken: async () => null,
});

const DEV_USER: User = {
  email: "julien.bock57@gmail.com",
  nom: "Bock",
  prenom: "Julien",
  roles: ["ADMIN"],
};

const LOCAL_TOKEN_KEY = "ogade_token";

let msalInstance: PublicClientApplication | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [msalReady, setMsalReady] = useState(false);
  const [config, setConfig] = useState<AuthConfig | null>(null);

  const isAuthRequired = config?.microsoftAuth || config?.localAuth;

  useEffect(() => {
    let cancelled = false;

    fetchAuthConfig().then(async (cfg) => {
      if (cancelled) return;
      setConfig(cfg);

      const hasAuth = cfg.microsoftAuth || cfg.localAuth;
      if (!hasAuth) {
        setUser(DEV_USER);
        setLoading(false);
        return;
      }

      // Check for existing local JWT
      const savedToken = localStorage.getItem(LOCAL_TOKEN_KEY);
      if (savedToken) {
        try {
          const res = await fetch("/api/v1/auth/me", {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          if (res.ok) {
            const agent = await res.json();
            if (cancelled) return;
            setUser({
              email: agent.email,
              nom: agent.nom,
              prenom: agent.prenom,
              roles: agent.roles?.map((r: { role: { code: string } }) => r.role.code) ?? [],
            });
            setLoading(false);
            return;
          }
        } catch {
          // token invalid, continue
        }
        localStorage.removeItem(LOCAL_TOKEN_KEY);
      }

      // Initialize MSAL if configured
      if (cfg.microsoftAuth && cfg.clientId) {
        const msalConfig = buildMsalConfig(cfg.clientId, cfg.tenantId);
        const pca = new PublicClientApplication(msalConfig);
        msalInstance = pca;

        await pca.initialize();
        if (cancelled) return;
        setMsalReady(true);

        pca.addEventCallback((event) => {
          if (
            event.eventType === EventType.LOGIN_SUCCESS &&
            (event.payload as AuthenticationResult)?.account
          ) {
            const account = (event.payload as AuthenticationResult).account;
            pca.setActiveAccount(account);
            setUserFromAccount(account);
          }
        });

        try {
          const response = await pca.handleRedirectPromise();
          if (cancelled) return;

          if (response?.account) {
            pca.setActiveAccount(response.account);
            setUserFromAccount(response.account);
          } else {
            const accounts = pca.getAllAccounts();
            if (accounts.length > 0) {
              pca.setActiveAccount(accounts[0]);
              setUserFromAccount(accounts[0]);
            }
          }
        } catch {
          // redirect handling failed
        }
      }

      setLoading(false);
    }).catch(() => {
      setUser(DEV_USER);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const setUserFromAccount = (account: AccountInfo) => {
    const nameParts = (account.name ?? "").split(" ");
    setUser({
      email: account.username,
      prenom: nameParts[0] ?? "",
      nom: nameParts.slice(1).join(" ") ?? "",
      roles: [],
    });
  };

  const loginMicrosoft = useCallback(async () => {
    if (!msalReady || !msalInstance) return;
    try {
      await msalInstance.loginRedirect(loginRequest);
    } catch (err) {
      console.error("Login failed", err);
    }
  }, [msalReady]);

  const loginLocal = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ token: string; agent: { email: string; nom: string; prenom: string; roles: string[] } }>(
      "/auth/login",
      { email, password },
    );
    localStorage.setItem(LOCAL_TOKEN_KEY, res.token);
    setUser({
      email: res.agent.email,
      nom: res.agent.nom,
      prenom: res.agent.prenom,
      roles: res.agent.roles,
    });
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(LOCAL_TOKEN_KEY);
    if (msalReady && msalInstance && msalInstance.getActiveAccount()) {
      await msalInstance.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
      return;
    }
    setUser(null);
  }, [msalReady]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    // Check local JWT first
    const localToken = localStorage.getItem(LOCAL_TOKEN_KEY);
    if (localToken) return localToken;

    // Try MSAL
    if (!msalReady || !msalInstance) return null;
    const account = msalInstance.getActiveAccount();
    if (!account) return null;
    try {
      const response = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      return response.idToken;
    } catch {
      try {
        await msalInstance.acquireTokenRedirect(loginRequest);
      } catch {
        // redirect will happen
      }
      return null;
    }
  }, [msalReady]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authConfig: config,
        loginMicrosoft,
        loginLocal,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
