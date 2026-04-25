import { Configuration, LogLevel } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_AZURE_AD_CLIENT_ID ?? "";
const tenantId = import.meta.env.VITE_AZURE_AD_TENANT_ID ?? "";

export const msalEnabled = !!(clientId && tenantId);

// "consumers" for personal accounts, tenant GUID for organizational
const authority = tenantId === "consumers"
  ? "https://login.microsoftonline.com/consumers"
  : `https://login.microsoftonline.com/${tenantId}`;

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
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

// For personal accounts, use openid/profile/email scopes
export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};
