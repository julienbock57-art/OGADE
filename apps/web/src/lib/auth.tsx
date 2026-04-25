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
import { msalConfig, msalEnabled, loginRequest } from "./msal-config";

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

function getMsalInstance(): PublicClientApplication {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }
  return msalInstance;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [msalReady, setMsalReady] = useState(false);

  useEffect(() => {
    if (!msalEnabled) {
      setUser(DEV_USER);
      setLoading(false);
      return;
    }

    const pca = getMsalInstance();
    pca.initialize().then(() => {
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

      return pca.handleRedirectPromise();
    }).then((response) => {
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
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
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
    if (!msalEnabled || !msalReady) return;
    const pca = getMsalInstance();
    try {
      await pca.loginRedirect(loginRequest);
    } catch (err) {
      console.error("Login failed", err);
    }
  }, [msalReady]);

  const logout = useCallback(async () => {
    if (!msalEnabled || !msalReady) {
      setUser(null);
      return;
    }
    const pca = getMsalInstance();
    await pca.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
  }, [msalReady]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!msalEnabled || !msalReady) return null;
    const pca = getMsalInstance();
    const account = pca.getActiveAccount();
    if (!account) return null;
    try {
      const response = await pca.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      return response.idToken;
    } catch {
      try {
        await pca.acquireTokenRedirect(loginRequest);
      } catch {
        // redirect will happen
      }
      return null;
    }
  }, [msalReady]);

  return (
    <AuthContext.Provider
      value={{ user, loading, msalEnabled, login, logout, getAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
