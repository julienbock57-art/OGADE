import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth";
import { SettingsProvider } from "@/lib/settings";
import { setTokenGetter } from "@/lib/api";
import { AppRoutes } from "@/routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function TokenBridge({ children }: { children: React.ReactNode }) {
  const { getAccessToken } = useAuth();
  useEffect(() => {
    setTokenGetter(getAccessToken);
  }, [getAccessToken]);
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <TokenBridge>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TokenBridge>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
