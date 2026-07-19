import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const response = await api.get("/auth/me");
                setUser(response.data.user);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (email, password) => {
        const response = await api.post("/auth/login", { email, password });
        const { user } = response.data;
        setUser(user);
        return response.data;
    };

    const loginWithPin = async (admission_no, pin) => {
        const response = await api.post("/students/login-pin", { admission_no, pin });
        const { user } = response.data;
        setUser(user);
        return response.data;
    };

    const register = async (data) => {
        const response = await api.post("/auth/register", data);
        return response.data;
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
            setUser(null);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                loginWithPin,
                logout,
                register,
                setUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
