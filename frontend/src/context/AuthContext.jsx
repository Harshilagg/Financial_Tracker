import { createContext, useState } from "react";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const initialToken = localStorage.getItem("token");
  const [token, setToken] = useState(initialToken);
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialToken);

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
