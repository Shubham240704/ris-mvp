
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

import api, { setAuthToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(false);

    // Authenticate using the existing backend login endpoint.
    const login = useCallback(async (email, password) => {
        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
                email: email.trim(),
                password,
            });

            const { accessToken, user: authenticatedUser } =
                response.data.data;

            setAuthToken(accessToken);
            setToken(accessToken);
            setUser(authenticatedUser);

            return authenticatedUser;
        } finally {
            setLoading(false);
        }
    }, []);

    // Verify the currently authenticated user.
    const refreshUser = useCallback(async () => {
        if (!token) {
            return null;
        }

        const response = await api.get("/auth/me");

        setUser(response.data.data);

        return response.data.data;
    }, [token]);

    // End the current frontend session.
    const logout = useCallback(() => {
        setAuthToken(null);
        setToken(null);
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({
            user,
            token,
            loading,
            isAuthenticated: Boolean(token && user),
            login,
            logout,
            refreshUser,
        }),
        [user, token, loading, login, logout, refreshUser]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
}
