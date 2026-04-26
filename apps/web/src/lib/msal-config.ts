import { Configuration, LogLevel } from "@azure/msal-browser";

export interface AuthConfig {
  microsoftAuth: boolean;
  localAuth: boolean;
  clientId: string | null;
  tenantId: string | null;
}

export async function fetchAuthConfig(): Promise<AuthConfig> {
  const res = await fetch("/api/v1/auth/config");
  if (!res.ok) return { microsoftAuth: false, localAuth: false, clientId: null, tenantId: null };
  return res.json();
}

export function buildMsalConfig(clientId: string, tenantId: string | null): Configuration {
  const authority =
    !tenantId || tenantId === "common"
      ? "https://login.microsoftonline.com/common"
      : tenantId === "consumers"
        ? "https://login.microsoftonline.com/consumers"
        : `https://login.microsoftonline.com/${tenantId}`;

  return {
    auth: {
      clientId,
      authority,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: "localStorage",
    },
    system: {
      loggerOptions: {
        logLevel: LogLevel.Warning,
        loggerCallback: (level, message) => {
          if (level === LogLevel.Error) console.error(message);
        },
      },
    },
  };
}

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};
