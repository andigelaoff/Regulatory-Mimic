import {JSX} from "react";
import {Navigate} from "react-router-dom";
import {useAuth} from "./AuthContext.tsx";

interface ProtectedRouteProps {
  children: JSX.Element;
}
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // If not authenticated, redirect to the login page.
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the child component (e.g. ChatPage)
  return children;
};
export default ProtectedRoute;