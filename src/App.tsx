import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Routes, Navigate } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider, useAuth } from "@/lib/auth-context";

import AuthPage from "./pages/AuthPage";
import LibraryDashboard from "./pages/LibraryDashboard";
import ReaderPage from "./pages/ReaderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { isAuthenticated } =
    useAuth();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/auth"
        replace
      />
    );
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { isAuthenticated } =
    useAuth();

  if (isAuthenticated) {
    return (
      <Navigate
        to="/library"
        replace
      />
    );
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider
    client={queryClient}
  >
    <TooltipProvider>
      <Toaster />

      <Sonner />

      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <Navigate
                to="/auth"
                replace
              />
            }
          />

          <Route
            path="/auth"
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />

          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <LibraryDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/read/:id"
            element={
              <ProtectedRoute>
                <ReaderPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={<NotFound />}
          />
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;