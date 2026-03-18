import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  loginUser,
  registerUser,
  getMyProfile,
  type UserProfileResponse,
  type UserCreatePayload,
} from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
  token: string | null;
  uid: string | null;
  profile: UserProfileResponse | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: UserCreatePayload) => Promise<void>;
  logout: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: localStorage.getItem("access_token"),
    uid: localStorage.getItem("uid"),
    profile: null,
    loading: true,
  });

  // On mount (or when token changes), try to fetch the profile
  useEffect(() => {
    if (!state.token) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    getMyProfile()
      .then((profile) => setState((s) => ({ ...s, profile, loading: false })))
      .catch(() => {
        // Token expired / invalid → clear
        localStorage.removeItem("access_token");
        localStorage.removeItem("uid");
        setState({ token: null, uid: null, profile: null, loading: false });
      });
  }, [state.token]);

  const login = async (email: string, password: string) => {
    const data = await loginUser(email, password);
    localStorage.setItem("access_token", data.access_token);
    // Decode uid from JWT payload (base64url)
    const payload = JSON.parse(atob(data.access_token.split(".")[1]));
    const uid = payload.sub;
    localStorage.setItem("uid", uid);
    setState((s) => ({ ...s, token: data.access_token, uid, loading: true }));
  };

  const signup = async (payload: UserCreatePayload) => {
    const user = await registerUser(payload);
    // After signup, log in automatically
    if (payload.email && payload.password) {
      await login(payload.email, payload.password);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("uid");
    setState({ token: null, uid: null, profile: null, loading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
