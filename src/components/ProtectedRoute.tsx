import { Navigate } from "react-router-dom";

import { useAuth } from "@/lib/auth-context";

const ProtectedRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;