import {
  type ReactNode,
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  fetchAuthSession,
  loginWithApi,
  logoutWithApi,
  signUpWithApi,
} from "../api/client";
import {
  clearStoredAuthSession,
  getStoredAuthSession,
  storeAuthSession,
  type AuthSession,
  type AuthSessionUser,
} from "./auth-storage";

type LoginInput = {
  email: string;
  password: string;
};

type SignUpInput = LoginInput & {
  name: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isReady: boolean;
  session: AuthSession | null;
  user: AuthSessionUser | null;
  signIn: (input: LoginInput) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  signUp: (input: SignUpInput) => Promise<AuthSession>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const commitSession = (
  nextSession: AuthSession | null,
  setSession: (session: AuthSession | null) => void,
) => {
  if (nextSession) {
    storeAuthSession(nextSession);
  } else {
    clearStoredAuthSession();
  }

  startTransition(() => {
    setSession(nextSession);
  });
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedSession = getStoredAuthSession();
    if (!storedSession) {
      setIsReady(true);
      return;
    }

    setSession(storedSession);
    void fetchAuthSession(storedSession.token)
      .then((freshSession) => {
        commitSession(freshSession, setSession);
      })
      .catch(() => {
        commitSession(null, setSession);
      })
      .finally(() => {
        setIsReady(true);
      });
  }, []);

  const signIn = async (input: LoginInput) => {
    const nextSession = await loginWithApi(input);
    commitSession(nextSession, setSession);
    return nextSession;
  };

  const signUp = async (input: SignUpInput) => {
    const nextSession = await signUpWithApi(input);
    commitSession(nextSession, setSession);
    return nextSession;
  };

  const signOut = async () => {
    const token = session?.token ?? getStoredAuthSession()?.token;

    try {
      if (token) {
        await logoutWithApi(token);
      }
    } finally {
      commitSession(null, setSession);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(session),
        isReady,
        session,
        user: session?.user ?? null,
        signIn,
        signOut,
        signUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
};
