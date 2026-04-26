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
import { fetchAuthConfig, buildMsalConfig, loginRequest } from "./msal-config";

type User = {
  email: string;
  nom: string;
  prenom: string;
  roles: string[];
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  msalEnabled: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  msalEnabled: false,
  login: async () => {},
  logout: async () => {},
  getAccessToken: async () => null,
});

const DEV_USER: User = {
  email: "julien.bock57@gmail.com",
  nom: "Bock",
  prenom: "Julien",
  roles: ["ADMIN"],
};

let msalInstance: PublicClientApplication | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [msalReady, setMsalReady] = useState(false);
  const [authEnabled, setAuthEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchAuthConfig().then(async (config) => {
      if (cancelled) return;

      if (!config.microsoftAuth || !config.clientId) {
        setUser(DEV_USER);
        setLoading(false);
        return;
      }

      setAuthEnabled(true);

      const msalConfig = buildMsalConfig(config.clientId, config.tenantId);
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

  const login = useCallback(async () => {
    if (!authEnabled || !msalReady || !msalInstance) return;
    try {
      await msalInstance.loginRedirect(loginRequest);
    } catch (err) {
      console.error("Login failed", err);
    }
  }, [authEnabled, msalReady]);

  const logout = useCallback(async () => {
    if (!authEnabled || !msalReady || !msalInstance) {
      setUser(null);
      return;
    }
    await msalInstance.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
  }, [authEnabled, msalReady]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!authEnabled || !msalReady || !msalInstance) return null;
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
  }, [authEnabled, msalReady]);

  return (
    <AuthContext.Provider
      value={{ user, loading, msalEnabled: authEnabled, login, logout, getAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
